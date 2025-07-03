import type { Attachment } from '../types';
import { getSupabaseClient } from './supabase';

// React Native file interface (since File API is not available)
interface ReactNativeFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export class FileService {
  private supabase = getSupabaseClient();
  private bucketName = 'chat-files';
  private maxFileSize = 50 * 1024 * 1024; // 50MB
  private allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private allowedDocumentTypes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  async uploadFile(file: ReactNativeFile, userId: string, options?: {
    generateThumbnail?: boolean;
    onProgress?: (progress: number) => void;
  }): Promise<Attachment> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}_${this.sanitizeFileName(file.name)}`;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      let thumbnailUrl: string | undefined;

      // Generate thumbnail for images
      if (this.isImage(file.type) && options?.generateThumbnail) {
        thumbnailUrl = await this.generateThumbnail(data.path, file);
      }

      const attachment: Attachment = {
        id: data.path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size || 0,
        url: urlData.publicUrl,
        thumbnailUrl: thumbnailUrl || (this.isImage(file.type) ? urlData.publicUrl : undefined),
      };

      return attachment;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async uploadMultipleFiles(
    files: ReactNativeFile[],
    userId: string,
    options?: {
      onProgress?: (progress: number, fileIndex: number) => void;
      onFileComplete?: (attachment: Attachment, fileIndex: number) => void;
    }
  ): Promise<Attachment[]> {
    const attachments: Attachment[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      try {
        const attachment = await this.uploadFile(files[i], userId, {
          generateThumbnail: true,
          onProgress: (progress) => options?.onProgress?.(progress, i),
        });

        attachments.push(attachment);
        options?.onFileComplete?.(attachment, i);
      } catch (error) {
        console.error(`Failed to upload file ${files[i].name}:`, error);
        // Continue with other files
      }
    }

    return attachments;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      // Also try to delete thumbnail if it exists
      const thumbnailPath = this.getThumbnailPath(filePath);
      if (thumbnailPath) {
        await this.supabase.storage
          .from(this.bucketName)
          .remove([thumbnailPath]);
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(filePaths);

      if (error) {
        throw error;
      }

      // Also delete thumbnails
      const thumbnailPaths = filePaths
        .map(path => this.getThumbnailPath(path))
        .filter(Boolean) as string[];

      if (thumbnailPaths.length > 0) {
        await this.supabase.storage
          .from(this.bucketName)
          .remove(thumbnailPaths);
      }
    } catch (error) {
      throw new Error(`Failed to delete files: ${error}`);
    }
  }

  async getFileUrl(filePath: string, options?: {
    download?: boolean;
    transform?: {
      width?: number;
      height?: number;
      quality?: number;
    }
  }): Promise<string> {
    try {
      if (options?.download) {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (error) {
          throw error;
        }

        return data.signedUrl;
      }

      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath, {
          transform: options?.transform,
        });

      return data.publicUrl;
    } catch (error) {
      throw new Error(`Failed to get file URL: ${error}`);
    }
  }

  async getFileMetadata(filePath: string): Promise<{
    size: number;
    lastModified: string;
    mimetype: string;
  } | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop(),
        });

      if (error || !data || data.length === 0) {
        return null;
      }

      const file = data[0];
      return {
        size: file.metadata?.size || 0,
        lastModified: file.updated_at || file.created_at,
        mimetype: file.metadata?.mimetype || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .copy(sourcePath, destinationPath);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .move(sourcePath, destinationPath);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to move file: ${error}`);
    }
  }

  async listFiles(userId: string, options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{
    files: Array<{
      name: string;
      path: string;
      size: number;
      lastModified: string;
      mimetype: string;
    }>;
    hasMore: boolean;
  }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(userId, {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          search: options?.search,
        });

      if (error) {
        throw error;
      }

      const files = data.map(file => ({
        name: file.name,
        path: `${userId}/${file.name}`,
        size: file.metadata?.size || 0,
        lastModified: file.updated_at || file.created_at,
        mimetype: file.metadata?.mimetype || 'application/octet-stream',
      }));

      return {
        files,
        hasMore: data.length === (options?.limit || 100),
      };
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  async getStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byType: Record<string, { count: number; size: number }>;
  }> {
    try {
      const { files } = await this.listFiles(userId, { limit: 1000 });

      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      const byType: Record<string, { count: number; size: number }> = {};

      files.forEach(file => {
        const category = FileService.getFileTypeCategory(file.mimetype);
        if (!byType[category]) {
          byType[category] = { count: 0, size: 0 };
        }
        byType[category].count++;
        byType[category].size += file.size;
      });

      return {
        totalFiles,
        totalSize,
        byType,
      };
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error}`);
    }
  }

  private async generateThumbnail(originalPath: string, file: ReactNativeFile): Promise<string | undefined> {
    try {
      if (!this.isImage(file.type)) {
        return undefined;
      }

      const thumbnailPath = this.getThumbnailPath(originalPath);
      if (!thumbnailPath) {
        return undefined;
      }

      // For now, return the original image URL as thumbnail
      // In a real implementation, you'd resize the image
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(originalPath, {
          transform: {
            width: 300,
            height: 300,
            quality: 80,
          },
        });

      return data.publicUrl;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return undefined;
    }
  }

  private getThumbnailPath(originalPath: string): string | null {
    const pathParts = originalPath.split('.');
    if (pathParts.length < 2) {
      return null;
    }

    const extension = pathParts.pop();
    const basePath = pathParts.join('.');
    return `${basePath}_thumb.${extension}`;
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private isImage(mimeType: string): boolean {
    return this.allowedImageTypes.includes(mimeType.toLowerCase());
  }

  private isDocument(mimeType: string): boolean {
    return this.allowedDocumentTypes.includes(mimeType.toLowerCase());
  }

  getSupportedFileTypes(): string[] {
    return [...this.allowedImageTypes, ...this.allowedDocumentTypes];
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  validateFile(file: ReactNativeFile): { isValid: boolean; error?: string } {
    if (!file.name) {
      return { isValid: false, error: 'File name is required' };
    }

    if (file.size && file.size > this.maxFileSize) {
      const maxSizeMB = Math.round(this.maxFileSize / (1024 * 1024));
      return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    if (!file.type) {
      return { isValid: false, error: 'File type is required' };
    }

    const supportedTypes = this.getSupportedFileTypes();
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      return { isValid: false, error: 'Unsupported file type' };
    }

    return { isValid: true };
  }

  validateMultipleFiles(files: ReactNativeFile[]): {
    isValid: boolean;
    errors: string[];
    validFiles: ReactNativeFile[];
    invalidFiles: ReactNativeFile[];
  } {
    const errors: string[] = [];
    const validFiles: ReactNativeFile[] = [];
    const invalidFiles: ReactNativeFile[] = [];

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file);
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    return {
      isValid: validFiles.length > 0,
      errors,
      validFiles,
      invalidFiles,
    };
  }

  // Utility methods for file type checking
  static getFileTypeCategory(mimeType: string): 'image' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }

    const documentTypes = [
      'application/pdf',
      'text/',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
    ];

    if (documentTypes.some(type => mimeType.includes(type))) {
      return 'document';
    }

    return 'other';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileIcon(mimeType: string): string {
    const category = FileService.getFileTypeCategory(mimeType);

    switch (category) {
      case 'image':
        return '🖼️';
      case 'document':
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
        return '📄';
      default:
        return '📎';
    }
  }

  static extractFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }

  static generateUniqueFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = FileService.extractFileExtension(originalName);
    const nameWithoutExt = originalName.replace(`.${extension}`, '');
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `${userId}/${timestamp}_${sanitizedName}.${extension}`;
  }

  // Image-specific utilities
  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  static getImageDimensions(file: ReactNativeFile): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      // This would need platform-specific implementation
      // For now, return default dimensions
      resolve({ width: 800, height: 600 });
    });
  }

  // Document-specific utilities
  static isPDFFile(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  static isTextFile(mimeType: string): boolean {
    return mimeType.startsWith('text/');
  }

  static isOfficeDocument(mimeType: string): boolean {
    return mimeType.includes('officedocument') ||
           mimeType.includes('msword') ||
           mimeType.includes('ms-excel') ||
           mimeType.includes('ms-powerpoint');
  }
}

// Export singleton instance
export const fileService = new FileService();
