## Project: LangChat - AI-Powered Chat Module

LangChat is a comprehensive chat module facilitating conversations between users and an AI. It leverages Supabase for data persistence and user authentication, and LangGraph for advanced AI message processing. The module is designed for easy integration and extensibility, with a focus on rich user experience and robust functionality.

### Core Features:

* **AI-Powered Conversations:** Enables real-time chat interactions between users and an AI, supporting various AI roles (AI, human, assistant, tool, system).
* **Persistent Chat History:** Stores and retrieves chat threads and messages, ensuring continuity of conversations across sessions.
* **User Authentication & Profiles:** Integrates with Supabase for secure user signup, sign-in, and management of user profiles (including email, name, and avatar URL).
* **Rich Text Display:** Renders AI messages in Markdown format, supporting code blocks, tables, and other rich content.
* **Contextual Conversations:** Maintains conversation context by utilizing existing thread IDs for ongoing discussions.
* **Theming Engine:** Provides a flexible theming system with built-in light, dark, and system themes, and future extensibility for custom themes (avoiding `ThemeContext` for cleaner integration).

### Advanced Capabilities:

* **File Upload Support:** Allows users to upload various file types, including PDF and TXT.
* **Voice Input:** Enables users to interact with the AI using voice commands.
* **Image Display:** Supports the display of incoming images, with horizontal scrolling for multiple images.
* **Thread Management:** Users can favorite and tag chat threads for better organization.

### Technical Specifications:

* **Package Distribution:** Designed for publication as an npm package, allowing easy installation and integration into other projects.
* **Minimal Setup:** Requires minimal configuration for users, primarily defining environment variables for LangGraph, LLM, and Supabase. The `ChatScreen` component will expose props for straightforward integration.
* **Thread Management & Streaming:** Utilizes `@langchain/langgraph-sdk` for efficient thread management and real-time message streaming.
* **Authentication:** Employs `@supabase/auth-js` for handling user signup and sign-in processes.
* **Database Schema:** Leverages a Supabase PostgreSQL database. The current schema (defined in `index.sql`) includes tables for `profiles`, `chat_threads`, and `chat_messages`. This schema is designed to support user authentication, thread storage, and message persistence, including metadata, roles, and timestamps. Modifications or additions to this schema will be made as necessary to accommodate new requirements.
