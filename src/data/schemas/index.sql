-- Supabase Database Schema for LangChat Package
-- This file contains the complete database schema for the chat application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid not null,
  email text not null,
  name text not null,
  avatar_url text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_profiles_email on public.profiles using btree (email) TABLESPACE pg_default;

create trigger update_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION update_updated_at_column ();

-- Create chat_threads table
create table public.chat_threads (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null default ''::text,
  metadata jsonb null default '{}'::jsonb,
  is_favorited boolean not null default false,
  tags text[] null default array[]::text[],
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint chat_threads_pkey primary key (id),
  constraint chat_threads_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chat_threads_user_id on public.chat_threads using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_chat_threads_updated_at on public.chat_threads using btree (updated_at) TABLESPACE pg_default;
create index IF not exists idx_chat_threads_is_favorited on public.chat_threads using btree (is_favorited) TABLESPACE pg_default;
create index IF not exists idx_chat_threads_tags on public.chat_threads using gin (tags) TABLESPACE pg_default;

create trigger update_chat_threads_updated_at BEFORE
update on chat_threads for EACH row
execute FUNCTION update_updated_at_column ();

-- Create chat_messages table
create table public.chat_messages (
  id text not null,
  user_id uuid not null,
  thread_id uuid not null,
  content text not null,
  role text not null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  saved boolean null,
  summary text null,
  constraint chat_messages_pkey primary key (id),
  constraint chat_messages_thread_id_fkey foreign KEY (thread_id) references chat_threads (id) on delete CASCADE,
  constraint chat_messages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint chat_messages_role_check check (
    (
      role = any (
        array[
          'user'::text,
          'human'::text,
          'assistant'::text,
          'ai'::text,
          'tool'::text,
          'system'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_chat_messages_user_id on public.chat_messages using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_chat_messages_thread_id on public.chat_messages using btree (thread_id) TABLESPACE pg_default;
create index IF not exists idx_chat_messages_created_at on public.chat_messages using btree (created_at) TABLESPACE pg_default;

-- Create file_uploads table for file attachment support
create table public.file_uploads (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  thread_id uuid null,
  message_id text null,
  filename text not null,
  file_type text not null,
  file_size bigint not null,
  file_path text not null,
  mime_type text not null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint file_uploads_pkey primary key (id),
  constraint file_uploads_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint file_uploads_thread_id_fkey foreign KEY (thread_id) references chat_threads (id) on delete CASCADE,
  constraint file_uploads_message_id_fkey foreign KEY (message_id) references chat_messages (id) on delete CASCADE,
  constraint file_uploads_file_type_check check (
    (
      file_type = any (
        array[
          'pdf'::text,
          'txt'::text,
          'image'::text,
          'document'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_file_uploads_user_id on public.file_uploads using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_file_uploads_thread_id on public.file_uploads using btree (thread_id) TABLESPACE pg_default;
create index IF not exists idx_file_uploads_message_id on public.file_uploads using btree (message_id) TABLESPACE pg_default;
create index IF not exists idx_file_uploads_created_at on public.file_uploads using btree (created_at) TABLESPACE pg_default;

-- Create voice_inputs table for voice command support
create table public.voice_inputs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  thread_id uuid null,
  message_id text null,
  audio_file_path text not null,
  transcription text null,
  duration_seconds numeric(5,2) null,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint voice_inputs_pkey primary key (id),
  constraint voice_inputs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint voice_inputs_thread_id_fkey foreign KEY (thread_id) references chat_threads (id) on delete CASCADE,
  constraint voice_inputs_message_id_fkey foreign KEY (message_id) references chat_messages (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_voice_inputs_user_id on public.voice_inputs using btree (user_id) TABLESPACE pg_default;
create index IF not exists idx_voice_inputs_thread_id on public.voice_inputs using btree (thread_id) TABLESPACE pg_default;
create index IF not exists idx_voice_inputs_message_id on public.voice_inputs using btree (message_id) TABLESPACE pg_default;
create index IF not exists idx_voice_inputs_created_at on public.voice_inputs using btree (created_at) TABLESPACE pg_default;

-- Create user_preferences table for theme and other settings
create table public.user_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  theme text not null default 'system'::text,
  language text not null default 'en'::text,
  notifications_enabled boolean not null default true,
  voice_input_enabled boolean not null default true,
  auto_save_enabled boolean not null default true,
  preferences jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_preferences_pkey primary key (id),
  constraint user_preferences_user_id_key unique (user_id),
  constraint user_preferences_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_preferences_theme_check check (
    (
      theme = any (
        array[
          'light'::text,
          'dark'::text,
          'system'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_user_preferences_user_id on public.user_preferences using btree (user_id) TABLESPACE pg_default;

create trigger update_user_preferences_updated_at BEFORE
update on user_preferences for EACH row
execute FUNCTION update_updated_at_column ();

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat threads policies
CREATE POLICY "Users can view own chat threads" ON public.chat_threads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat threads" ON public.chat_threads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat threads" ON public.chat_threads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat threads" ON public.chat_threads
    FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- File uploads policies
CREATE POLICY "Users can view own file uploads" ON public.file_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own file uploads" ON public.file_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own file uploads" ON public.file_uploads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own file uploads" ON public.file_uploads
    FOR DELETE USING (auth.uid() = user_id);

-- Voice inputs policies
CREATE POLICY "Users can view own voice inputs" ON public.voice_inputs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice inputs" ON public.voice_inputs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice inputs" ON public.voice_inputs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice inputs" ON public.voice_inputs
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);
