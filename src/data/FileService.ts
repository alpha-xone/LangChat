import type { Attachment } from '../types';
import { getSupabaseClient } from './supabase';

export class FileService {
  private supabase = getSupabaseClient();
  private bucketName = 'chat-files';

  async uploadFile(file: File, userId: string): Promise<Attachment> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      const attachment: Attachment = {
        id: data.path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: urlData.publicUrl,
        thumbnailUrl: this.isImage(file.type) ? urlData.publicUrl : undefined,
      };

      return attachment;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  async getFileUrl(filePath: string): Promise<string> {
    try {
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      throw new Error(`Failed to get file URL: ${error}`);
    }
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  getSupportedFileTypes(): string[] {
    return [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
  }

  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = this.getSupportedFileTypes();

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    if (!supportedTypes.includes(file.type)) {
      return { isValid: false, error: 'Unsupported file type' };
    }

    return { isValid: true };
  }
}
