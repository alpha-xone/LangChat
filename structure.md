/
├── src/
│   ├── components/         # Reusable UI components (e.g., MessageBubble, InputBar, ThreadCard)
│   │   ├── chat/
│   │   ├── common/
│   │   └──...
│   ├── screens/            # Main screen components, primarily the ChatScreen entry point
│   │   └── ChatScreen.tsx
│   ├── data/               # Data Layer logic for Supabase interactions
│   │   ├── schemas/        # SQL schema files for Supabase database
│   │   │   ├── index.sql   # Complete database schema
│   │   │   └── migrations/ # Migration files (optional)
│   │   ├── supabase.ts     # Supabase client initialization
│   │   ├── AuthService.ts  # User authentication logic
│   │   ├── ChatService.ts  # CRUD for threads and messages
│   │   ├── FileService.ts  # File upload and management
│   │   └──...
│   ├── ai/                 # AI Integration Layer logic for LangGraph
│   │   ├── LangGraphClient.ts  # Communication with LangGraph backend
│   │   ├── StreamParser.ts     # Handles SSE streaming and message parsing
│   │   └──...
│   ├── theming/            # Theming system implementation
│   │   ├── themes.ts       # Default light/dark theme objects
│   │   ├── useAppTheme.ts  # Custom hook for theme access (using Zustand internally)
│   │   └── store.ts        # Zustand store for theme state
│   ├── hooks/              # Custom React hooks abstracting logic (e.g., useChatMessages, useFileUpload)
│   ├── utils/              # General utility functions and helpers
│   ├── types/              # TypeScript type definitions for all data structures and props
│   └── index.ts            # Main entry point for the package, exporting public components/hooks
├── example/                # A sample React Native app to test the package locally
│   ├── android/
│   ├── ios/
│   ├── App.tsx
│   └── package.json
├── package.json            # Package metadata, dependencies, peerDependencies
├── README.md               # Documentation for installation, usage, and configuration
└── tsconfig.json           # TypeScript configuration
