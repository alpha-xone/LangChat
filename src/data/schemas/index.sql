-- Supabase Database Schema for LangChat Package
-- This file contains the complete database schema for the chat application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint chat_threads_pkey primary key (id),
  constraint chat_threads_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_chat_threads_user_id on public.chat_threads using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_chat_threads_updated_at on public.chat_threads using btree (updated_at) TABLESPACE pg_default;

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
