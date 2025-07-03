/
├── src/
│   ├── components/         # Reusable UI components (e.g., MessageBubble, InputBar, ThreadCard)
│   │   ├── chat/
│   │   │   ├── ✅✅ MessageList.tsx      # Display chat messages
│   │   │   ├── ✅✅ MessageInput.tsx     # Input component for sending messages
│   │   │   ├── ✅ ThreadList.tsx       # List of conversation threads
│   │   │   ├── ✅✅ MessageBubble.tsx    # Individual message bubble component
│   │   │   ├── ✅✅ ImageCarousel.tsx    # Horizontal scrolling for multiple images
│   │   │   └── ✅ FileUpload.tsx       # File upload component
│   │   ├── common/
│   │   │   ├── ✅ MarkdownRenderer.tsx # Render markdown content
│   │   │   ├── ✅ LoadingSpinner.tsx   # Loading indicator
│   │   │   └── ✅ ErrorBoundary.tsx    # Error handling component
│   │   └──...
│   ├── screens/            # Main screen components, primarily the ChatScreen entry point
│   │   └── ✅ ChatScreen.tsx           # Main chat interface
│   ├── data/               # Data Layer logic for Supabase interactions
│   │   ├── ✅✅ supabase.ts              # Supabase client initialization
│   │   ├── ✅✅ AuthService.ts           # User authentication logic
│   │   ├── ✅✅ ChatService.ts           # CRUD for threads and messages
│   │   ├── ✅✅ FileService.ts           # File upload and management
│   │   └──...
│   ├── ai/                 # AI Integration Layer logic for LangGraph
│   │   ├── ✅✅ LangGraphClient.ts       # Communication with LangGraph backend
│   │   ├── ✅✅ StreamParser.ts          # Handles SSE streaming and message parsing
│   │   └──...
│   ├── theming/            # Theming system implementation
│   │   ├── ✅✅ themes.ts                # Default light/dark theme objects
│   │   ├── ✅✅ useAppTheme.ts           # Custom hook for theme access (using Zustand internally)
│   │   └── ✅✅ store.ts                 # Zustand store for theme state
│   ├── hooks/              # Custom React hooks abstracting logic (e.g., useChatMessages, useFileUpload)
│   │   └── ✅✅ index.ts                 # Main hooks (useChatMessages, useThreads, useAuth)
│   ├── utils/              # General utility functions and helpers
│   │   └── ✅ index.ts                 # Utility functions
│   ├── types/              # TypeScript type definitions for all data structures and props
│   │   └── ✅ index.ts                 # Core type definitions
│   └── ✅ index.ts                     # Main entry point for the package, exporting public components/hooks
├── example/                # A sample React Native app to test the package locally
│   ├── android/
│   ├── ios/
│   ├── App.tsx
│   └── package.json
├── package.json            # Package metadata, dependencies, peerDependencies
├── README.md               # Documentation for installation, usage, and configuration
└── tsconfig.json           # TypeScript configuration