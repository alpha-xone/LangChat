// Authentication related types (note: AuthUser, SignUpData, SignInData, AuthState are exported from AuthService)
export interface AuthResult {
  success: boolean;
  error?: string;
}

// Database types (based on Supabase schema)
export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  metadata: any;
  is_favorited: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  thread_id: string;
  content: string;
  role: 'user' | 'human' | 'assistant' | 'ai' | 'tool' | 'system';
  metadata: any;
  created_at: string;
  saved: boolean | null;
  summary: string | null;
}

export interface FileUpload {
  id: string;
  user_id: string;
  thread_id: string | null;
  message_id: string | null;
  filename: string;
  file_type: 'pdf' | 'txt' | 'image' | 'document' | 'other';
  file_size: number;
  file_path: string;
  mime_type: string;
  metadata: any;
  created_at: string;
}

export interface VoiceInput {
  id: string;
  user_id: string;
  thread_id: string | null;
  message_id: string | null;
  audio_file_path: string;
  transcription: string | null;
  duration_seconds: number | null;
  metadata: any;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications_enabled: boolean;
  voice_input_enabled: boolean;
  auto_save_enabled: boolean;
  preferences: any;
  created_at: string;
  updated_at: string;
}
