# **Design of a React Native Package for an AI Chat Application**

## **1\. Executive Summary**

This report details the architectural design for a React Native package, @alpha.xone/langchat, engineered to deliver a robust, plug-and-play chat interface for AI interactions. The package is conceived as a reusable npm module, designed for seamless integration into diverse mobile applications. It will leverage Supabase for user authentication, secure chat data persistence, and efficient file storage. Concurrently, it will interface with a LangGraph backend to facilitate sophisticated AI message processing and maintain conversational context. Key functionalities include real-time message streaming, rich markdown rendering with support for code blocks and tables, comprehensive capabilities for file and image uploads (including horizontal scrolling for multiple images), and a highly customizable theming system. A deliberate design choice involves avoiding ThemeContext to ensure cleaner integration for package consumers. The package prioritizes ease of use, requiring minimal setup primarily through environment variables and simplified ChatScreen props, making it readily publishable to npm for broad adoption.

## **2\. Package Architecture Overview**

The @alpha.xone/langchat package is structured with a layered architecture, promoting modularity, maintainability, and a clear separation of concerns. This design approach ensures that each part of the system has a well-defined responsibility, contributing to a robust and scalable solution suitable for publication as an npm module.

### **High-level Component Breakdown**

The package comprises three distinct, yet interconnected, layers:

* **UI Layer (@alpha.xone/langchat-ui):** This layer is the visual interface, encompassing all components that users interact with directly. It includes the foundational ChatScreen component, which serves as the primary entry point for package consumers. Within ChatScreen, granular components such as MessageInput (for user text and media input), MessageList (for displaying chat history), and ThreadList (for managing conversation threads) are organized. Specialized display components like MarkdownRenderer (for rich text display), ImageCarousel (for multiple images), and DocumentPreview (for file viewing) are also part of this layer. The UI Layer's primary responsibility is to render data received from the Data Layer and capture all user interactions, translating them into actions for the underlying layers.
* **Data Layer (@alpha.xone/langchat-data):** This layer is exclusively dedicated to managing all interactions with the Supabase backend. It abstracts the complexities of user authentication, CRUD (Create, Read, Update, Delete) operations for chat threads and messages, and file storage operations. The Data Layer exposes a clean, consistent API through custom hooks and service classes, enabling UI components to fetch, send, and update data without direct knowledge of the Supabase SDK specifics or database structure. This separation ensures that changes to the backend integration do not necessitate modifications in the UI.
* **AI Integration Layer (@alpha.xone/langchat-ai):** This layer is critical for orchestrating communication with the LangGraph backend. Its responsibilities include securely sending user messages, ensuring the correct thread ID is maintained for conversational context, and, most importantly, receiving and robustly parsing streamed AI responses. This layer is designed to implement necessary workarounds for known React Native ReadableStream incompatibilities with LangGraph's default useStream hook, providing a reliable streaming solution. It acts as the intermediary, translating client-side requests into LangGraph API calls and processing LangGraph responses for consumption by the Data Layer.

### **Data Flow Diagram Illustration**

The interaction between these layers and external services follows a well-defined flow:

1. **User Input:** User messages, along with any attached files or images, are captured by the UI Layer's MessageInput component.
2. **Authentication & Forwarding:** The UI Layer dispatches the user input to the Data Layer. The Data Layer first handles Supabase user authentication, ensuring the user is logged in and their session is valid. Once authenticated, the user's message, along with their Supabase access token, is securely forwarded by the Data Layer to the AI Integration Layer.
3. **AI Processing Request:** The AI Integration Layer constructs an HTTP request containing the user message and the Supabase access token, then sends it to the LangGraph Backend.
4. **Backend Processing & Persistence:** The LangGraph Backend processes the message, potentially invoking various tools and AI models. During this process, it interacts with the Supabase database to save the user's message and the AI's response, ensuring all conversational history is persistently stored.
5. **AI Response Streaming:** The LangGraph Backend streams its response (which may include AI messages, tool outputs, system messages, and assistant actions) back to the AI Integration Layer.
6. **Client-Side Parsing & Update:** The AI Integration Layer receives and parses this incoming stream, intelligently reconstructing full messages from chunks and processing different message types. These reconstructed messages are then pushed as updates to the Data Layer.
7. **Data Layer State Update:** The Data Layer updates its local state, incorporating the new messages, and potentially updates a local cache. It then notifies the UI Layer of these changes.
8. **UI Re-rendering:** The UI Layer reacts to the Data Layer's updates, re-rendering the MessageList to display the newly received messages in real-time.
9. **Real-time Synchronization (Supabase Realtime):** Additionally, Supabase's Realtime service actively monitors the messages table. Any new messages or updates originating from other client instances or backend processes are pushed directly to the Data Layer. This ensures that the chat UI remains synchronized across all active user sessions without requiring manual polling.

### **Principles for Reusability and Extensibility as a Package**

The architectural design is grounded in principles essential for creating a successful and maintainable npm package:

* **Modularity:** Components, services, and hooks are designed as independent, loosely coupled units. This promotes isolated development, testing, and easier maintenance, allowing individual parts of the package to be updated or replaced without affecting the entire system.
* **Configuration-driven:** The primary ChatScreen component is designed to be highly configurable through a minimal set of well-defined props. This approach allows package consumers to easily integrate and customize its behavior, such as API endpoints, initial theme, or specific feature toggles, without needing to modify the package's source code directly. This flexibility is key for broad adoption.
* **Theming System:** A robust theming system is implemented that avoids ThemeContext for cleaner integration \[point 9\]. This system offers deep customization capabilities for colors, typography, and component-specific styles, ensuring the chat interface can seamlessly adopt the aesthetic of any consuming application.
* **Dependency Management:** A clear distinction is maintained between dependencies and peerDependencies in the package's package.json file. Dependencies are libraries directly required by and bundled with the package, while peerDependencies (such as react and react-native) are expected to be provided by the consuming host application.1 This strategy prevents version conflicts and minimizes the package's overall bundle size for consumers, leading to a more efficient and compatible integration.

## **3\. Core Feature Implementations**

### **3.1. User Authentication & Session Management (Supabase)**

The package's authentication mechanism is built upon Supabase, providing a secure and streamlined user experience.

#### **Integration with Supabase Auth**

The package will exclusively utilize the @supabase/supabase-js client library for all user authentication functionalities.2 This includes fundamental operations such as

signUp for new user registration, signIn for existing user login, and signOut for session termination.2 The Supabase client will be initialized within the dedicated

Data Layer of the package. This initialization requires the supabaseUrl and supabaseAnonKey 2, which will be provided by the consuming application as environment variables.4 This external configuration ensures that the package remains flexible, capable of connecting to any Supabase project without requiring internal code modifications.

#### **Secure Handling and Propagation of Supabase Access Tokens**

Upon successful user authentication, Supabase issues two crucial pieces of information: an access token, in the form of a JSON Web Token (JWT), and a refresh token.5 These tokens are vital for maintaining authenticated user sessions and authorizing subsequent requests. The package will securely store these session details using

AsyncStorage 2, leveraging the

@react-native-async-storage/async-storage library within the Data Layer.

A specific requirement is to include the current Supabase access token in the defaultHeaders of all outgoing user messages sent to the LangGraph backend \[point 5\]. A dedicated utility function, integrated into the AuthService within the Data Layer, will be responsible for retrieving the current token from AsyncStorage 6 and ensuring its consistent inclusion in the

Authorization header of all HTTP requests directed to the LangGraph backend.

The decision to transmit the Supabase access token to the LangGraph backend necessitates a robust validation process on the server side. Supabase issues JSON Web Tokens (JWTs) 5, which are self-contained and cryptographically signed. For the LangGraph backend to verify the authenticity and integrity of these tokens, it must be configured with the

SUPABASE\_JWT\_SECRET.6 This secret is essential for decrypting or verifying the JWT's signature, confirming its origin from the legitimate Supabase instance. Without such validation, the AI service would be vulnerable to forged requests, undermining the security of the entire system. Furthermore, successful JWT validation allows the LangGraph backend to extract the

user.uid (Supabase user ID) embedded within the token. This uid is fundamental for associating AI interactions, chat threads, and messages with the correct user in the Supabase database. This capability facilitates the implementation of Row Level Security (RLS) on the Supabase database 3, where data access is restricted based on the authenticated user's ID, and enables personalized AI responses grounded in the user's historical interactions. The token thus transcends simple authentication, becoming a core mechanism for propagating user context throughout the entire application ecosystem.

##### **Table: Supabase Authentication Flow & Token Handling**

| Aspect | Client-Side Actions | Token Types | Storage Mechanism | Propagation Method | Backend Actions (LangGraph) | Security Notes |  |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **User Login/Signup** | User initiates signIn or signUp via UI. | Access Token (JWT), Refresh Token | @react-native-async-storage/async-storage 2 | N/A | N/A | PKCE flow by default for SSR, but AsyncStorage for React Native client.5 |  |
| **Session Persistence** | Tokens stored securely after successful auth. | Access Token (JWT), Refresh Token | @react-native-async-storage/async-storage 2 | N/A | N/A | Refresh tokens periodically to avoid session expiration.2 |  |
| **Token Retrieval** | AuthService retrieves current access token. | Access Token (JWT) | @react-native-async-storage/async-storage 6 | HTTP Authorization Header (Bearer \<token\>) 6 | JWT Validation using SUPABASE\_JWT\_SECRET.6 Extraction of | auth.uid().7 | Crucial for RLS on Supabase 3 and user context. |
| **LangGraph Communication** | User messages sent with token in headers. | Access Token (JWT) | N/A | HTTP Authorization Header (Bearer \<token\>) \[point 5\] | Verifies token authenticity and extracts user ID for context. | Prevents unauthorized AI requests. Enables personalized AI responses. |  |

### **3.2. Chat Data Persistence & Retrieval (Supabase)**

A robust and scalable database schema is paramount for effectively managing chat data within the Supabase backend. The design prioritizes efficient storage, retrieval, and real-time synchronization of conversational elements.

#### **Schema Design for Chat Data**

The following tables form the core of the chat data schema:

* **users table:** This serves as a foundational table for storing user profiles. It is typically linked directly to Supabase Auth's auth.users table. Key columns would include id (matching the Supabase auth.uid() for direct user identification), email, display\_name, and avatar\_url. This table ensures that each message and thread can be attributed to a specific user.
* **threads table:** This table represents individual conversation threads between a user and the AI. It is designed to encapsulate the overarching context of a conversation. Key columns include id (Primary Key, preferably a UUID for distributed generation or auto-increment for simplicity), user\_id (Foreign Key referencing users.id, establishing ownership of the thread), title (a TEXT field, optional, which could be auto-generated from the first message or user-editable for better organization), created\_at (TIMESTAMP WITH TIME ZONE, for recording creation time), and updated\_at (TIMESTAMP WITH TIME ZONE, for tracking last activity). To support user-specific features, is\_favorite (BOOLEAN) allows users to mark important conversations, and tags (TEXT ARRAY or JSONB) provides flexibility for categorizing threads.8
* **messages table:** This table stores each individual message within a conversation thread. Its columns include id (Primary Key), thread\_id (Foreign Key referencing threads.id, linking messages to their respective conversations), user\_id (Foreign Key referencing users.id, indicating the sender, whether it's the user or the AI), content (TEXT, designed to store markdown-formatted or plain text), type (an ENUM type to categorize messages, such as 'user', 'ai', 'tool', 'system', and 'assistant', aligning with LangGraph's output types 10),
  created\_at (TIMESTAMP WITH TIME ZONE, for chronological ordering), and file\_attachments (a JSONB array storing metadata for attached files, potentially linking to the files table, or a separate message\_files join table for more complex relationships 7).
* **files table:** This table manages the metadata for all uploaded files. Columns include id (Primary Key), storage\_object\_id (UUID, serving as a Foreign Key referencing storage.objects.id within Supabase Storage), name (TEXT), mime\_type (TEXT), size (INTEGER), created\_by (Foreign Key referencing users.id), and created\_at (TIMESTAMP WITH TIME ZONE).7

#### **Strategies for Loading Past Threads and Messages**

Upon the initiation of the UI, specifically the ChatScreen, the system will load a list of past conversation threads associated with the authenticated user \[point 4\]. This process involves querying the threads table, typically ordered by updated\_at to display the most recent conversations first.

When a user selects an existing thread, the historical messages pertinent to that specific thread\_id will be loaded from the messages table \[point 4\]. To ensure efficient retrieval and to support common chat UI patterns like infinite scrolling, these queries will implement pagination, such as cursor-based pagination.11 Messages will be initially fetched in descending order of

created\_at (newest first) and then reversed on the client-side for display in chronological order within the chat interface.

A fundamental requirement for the chat application is the consistent use of a thread ID when communicating with the LangGraph backend, ensuring conversational context is maintained \[point 8\]. This design choice is directly supported by the proposed Supabase schema, where the messages table explicitly includes a thread\_id.11 This

thread\_id functions as the unique identifier for each distinct conversation, akin to a "session-token" 12, which is vital for distinguishing and managing concurrent conversations effectively. The architecture of the LangGraph backend, with its inherent capability to manage conversational state and checkpoints over time 13, relies heavily on this

thread ID. By consistently passing this identifier with every message within a conversation, LangGraph can retrieve and update the precise internal state for that specific thread. This approach has direct implications for the package's internal state management. The ChatScreen component, or a centralized state management solution within the package, must actively track the currently active thread\_id. When a user initiates a new conversation, a new thread\_id is generated and persisted in Supabase. Conversely, when an existing thread is selected from the user's history, the corresponding thread\_id is loaded. This active thread\_id then governs all subsequent data operations, such as fetching historical messages from Supabase, and all AI interactions, including sending new messages to LangGraph. This meticulous management of the thread\_id guarantees that the conversation's context is accurately preserved, which is a prerequisite for advanced features like conversation branching 13 to function as intended.

#### **Real-time Message Updates using Supabase Realtime**

Supabase's Realtime service 15 will be strategically employed to provide instant updates to the chat user interface. A real-time subscription will be established on the

messages table, specifically filtered by the currently active thread\_id.11 This ensures that only relevant messages for the current conversation are streamed to the client. When a new message is inserted into the

messages table—whether initiated by the user, generated by the AI backend, or synchronized from another client instance—Supabase's broadcast\_messages\_trigger 11 will automatically push this change to all subscribed clients. This mechanism eliminates the need for manual polling, ensuring the chat UI is always synchronized and provides a fluid, responsive user experience.

##### **Table: Supabase Chat Database Schema**

| Table Name | Key Columns | Data Types | Relationships | Notes |
| :---- | :---- | :---- | :---- | :---- |
| users | id (PK) | UUID | Matches auth.users.id | Stores user profile data. |
|  | email | TEXT |  |  |
|  | display\_name | TEXT |  |  |
|  | avatar\_url | TEXT |  |  |
| threads | id (PK) | UUID |  | Represents a unique conversation. |
|  | user\_id (FK) | UUID | users.id | Owner of the thread. |
|  | title | TEXT |  | Optional, user-editable. |
|  | created\_at | TIMESTAMP WITH TIME ZONE |  | Indexed for recency. |
|  | updated\_at | TIMESTAMP WITH TIME ZONE |  | Indexed for recency. |
|  | is\_favorite | BOOLEAN |  | For user favoriting.8 |
|  | tags | TEXT or JSONB |  | For user tagging.8 |
| messages | id (PK) | UUID |  | Individual chat message. |
|  | thread\_id (FK) | UUID | threads.id | Links message to conversation thread. |
|  | user\_id (FK) | UUID | users.id | Sender of the message (user or AI). |
|  | content | TEXT |  | Message content, supports markdown. |
|  | type | ENUM ('user', 'ai', 'tool', 'system', 'assistant') |  | Categorizes message origin/role.10 |
|  | created\_at | TIMESTAMP WITH TIME ZONE |  | Indexed for chronological order. |
|  | file\_attachments | JSONB | Links to files.id (metadata) | Array of file metadata for attachments.7 |
| files | id (PK) | UUID |  | Metadata for uploaded files. |
|  | storage\_object\_id (FK) | UUID | storage.objects.id | Reference to Supabase Storage object.7 |
|  | name | TEXT |  | Original file name. |
|  | mime\_type | TEXT |  | File type (e.g., 'application/pdf'). |
|  | size | INTEGER |  | File size in bytes. |
|  | created\_by (FK) | UUID | users.id | User who uploaded the file. |
|  | created\_at | TIMESTAMP WITH TIME ZONE |  |  |
| thread\_tags (Optional) | thread\_id (PK, FK) | UUID | threads.id | For many-to-many tag relationships. |
|  | tag\_id (PK, FK) | UUID | tags.id |  |
| tags (Optional) | id (PK) | UUID |  | Lookup table for predefined tags. |
|  | name | TEXT |  | Tag name (e.g., 'Support', 'Sales'). |

### **3.3. AI Interaction & Streaming (LangGraph)**

The AI interaction component is central to the chat experience, requiring robust communication with the LangGraph backend and efficient handling of streaming responses.

#### **Integration with LangGraph Backend**

User messages will be transmitted to the LangGraph backend via an HTTP POST request \[point 5\]. The AI Integration Layer is responsible for constructing this request, meticulously ensuring that the Supabase access token is included in the defaultHeaders. This token is crucial for both authentication and propagating the user's context to the AI backend \[point 5\].

#### **Addressing React Native Streaming Challenges (Crucial Workaround)**

A significant technical hurdle arises from the known incompatibility of the @langchain/langgraph-sdk's useStream hook with React Native's JavaScript execution environments, specifically Hermes or JavaScriptCore. This issue stems from the hook's reliance on the Web Streams API (ReadableStream), which is not fully or natively supported in React Native, leading to persistent "This stream has already been locked for exclusive reading by another reader" errors.16 Despite this challenge, the requirement for real-time, streamed AI responses remains paramount.

The LangGraph backend offers a suitable mechanism for granular, real-time updates through its astream\_events() API.17 This API is designed to stream detailed information about the AI's processing steps, including

on\_chat\_model\_stream for token-by-token AI message chunks, on\_tool\_end for results of tool executions, and other events for system messages or assistant actions.10 On the React Native client, robust support for Server-Sent Events (SSE) is available via the

react-native-sse library.20

Given these factors, a custom "streaming bridge" component or service will be implemented within the AI Integration Layer. This bridge will effectively re-create the streaming functionality that useStream would have provided, but through a compatible mechanism. The custom bridge will initiate an SSE connection to a designated LangGraph backend endpoint, such as /stream\_events. It will then actively listen for incoming message events dispatched by the react-native-sse client. Upon receiving an event, the service will parse the incoming JSON payload.19 Based on the

kind field of the parsed event (e.g., on\_chat\_model\_stream for AI text, on\_tool\_end for tool results), it will intelligently update the local message state. This process involves concatenating content from AIMessageChunks to progressively form the complete AI message, or adding new, distinct ToolMessage or SystemMessage entries to the chat history as they arrive. This architectural decision is critical; it means the package assumes the responsibility for managing the streaming protocol and message parsing, thereby abstracting this intricate complexity from the package's end-user. This ensures that the core requirement for real-time AI interaction is met effectively within the React Native environment, making the package both robust and functional.

#### **Maintaining Thread Context with thread ID for LangGraph**

The thread ID (or "session-token" as termed in 12) is paramount for maintaining conversational context throughout the interaction. This identifier will be consistently passed as part of the input payload with every user message sent to the LangGraph backend \[point 8\]. LangGraph's built-in persistence layer 13 will leverage this

thread ID to load and manage the specific conversation's state and checkpoints. This ensures that the AI has access to the full history of the current conversation, enabling coherent and contextually relevant responses. The package will also expose functionality (or internal logic) to retrieve message metadata (e.g., getMessagesMetadata from langgraph-sdk if used for non-streaming parts, or a custom implementation based on stored checkpoints) to enable advanced features like branching from past conversation points.13

##### **Table: LangGraph AI Message Types & Client-Side Parsing**

| LangGraph Event Kind (from astream\_events) | Corresponding LangChain Message Type | Client-Side Parsing Logic | Example Payload Structure (simplified) |
| :---- | :---- | :---- | :---- |
| on\_chat\_model\_stream | AIMessageChunk 10 | Concatenate content to current AI message being formed. | {"kind": "on\_chat\_model\_stream", "data": {"chunk": {"content": "Hello"}},...} |
| on\_tool\_start | Tool Call Initiation | Log tool call, prepare UI for tool execution display. | {"kind": "on\_tool\_start", "data": {"tool\_name": "search", "input": "query"},...} |
| on\_tool\_end | ToolMessage 10 | Display tool output as a distinct message. | {"kind": "on\_tool\_end", "data": {"tool\_output": "Search results..."},...} |
| on\_agent\_action | Intermediate Agent Step | Display agent's thought process or action. | {"kind": "on\_agent\_action", "data": {"log": "Thinking about next step..."},...} |
| on\_agent\_finish | Final Agent Output | Mark agent's response as complete. | {"kind": "on\_agent\_finish", "data": {"output": "Final answer."},...} |
| on\_llm\_start | LLM Call Start | Indicate LLM processing is beginning. | {"kind": "on\_llm\_start", "data": {"model": "gpt-4"},...} |
| on\_llm\_end | LLM Call End | Indicate LLM processing is complete. | {"kind": "on\_llm\_end", "data": {"output": {"content": "Full LLM response"}},...} |
| on\_retriever\_end | Retrieval Results | Display retrieved documents/context. | {"kind": "on\_retriever\_end", "data": {"documents": \[{"text": "doc1 content"}\]},...} |
| Custom Events | Custom types as defined by backend | Process based on custom event definition. | {"kind": "on\_custom\_event", "data": {"status": "processing\_image"},...} |

### **3.4. Theming System Design**

A flexible and extendable theming system is a crucial ingredient for the package, ensuring it can seamlessly adapt to various application designs while adhering to the constraint of avoiding ThemeContext \[point 9\].

#### **Implementation of Light, Dark, and System Themes**

The package will define comprehensive default light and dark theme objects. These objects will encapsulate all relevant UI properties, including a full color palette (e.g., primary, background, text, borders), typography definitions (font families, sizes, weights), spacing units, and component-specific styles.21 This granular control ensures a consistent visual language across the chat interface.

To support system-wide theme preferences, the package will leverage React Native's Appearance API and the useColorScheme hook.22 This allows the package to automatically detect whether the user's device prefers a light, dark, or no specific color scheme, and subsequently apply the corresponding default theme. This integration ensures a native and consistent user experience that aligns with the device's operating system settings.

#### **Strategy for Extendable Custom Themes without ThemeContext**

Adhering to the requirement of avoiding ThemeContext \[point 9\], the package will implement its theming system using a lightweight global state management library. Zustand 24 is an excellent candidate due to its minimal boilerplate, performance-focused design, and simple hooks-based API. This approach centralizes the theme state without the need for explicit

Provider components wrapping the entire application tree, leading to cleaner component wrapping.27

A dedicated Zustand store will be established to hold the current theme object and expose actions such as setTheme (to switch between light, dark, or custom themes) or toggleTheme (for direct light/dark mode switching). The package will then export a custom hook, for instance, useAppTheme(). This hook will internally interact with the Zustand store, allowing any component within the ChatScreen or its child components to directly access theme properties (e.g., const { colors, typography } \= useAppTheme();). This provides a clean and efficient mechanism for consuming theme values throughout the user interface.

The ChatScreen component will be responsible for initializing the theme, either by detecting system preferences through React Native's Appearance API and useColorScheme hook 22 or by applying a

customTheme object provided via its props by the package consumer. This architectural choice effectively decouples the theme state management from React's Context.Provider components. Components within the package can directly utilize useAppTheme() without requiring explicit wrapping by a ThemeProvider, thereby fulfilling the "cleaner wrapping" requirement and offering a highly flexible and extensible theming solution that can evolve without impacting the core API. The default theme object will be designed with extensibility in mind. Package users will be able to provide their own customTheme objects via ChatScreen props. These custom themes can partially or fully override the default theme properties or even introduce new custom properties, which the internal useAppTheme hook will make available.21 The

setTheme action in the Zustand store will intelligently merge these custom theme objects with the base theme, allowing for both simple overrides and advanced customizations.

### **3.5. Rich Media & File Handling**

The package will provide comprehensive support for rich media and file attachments, enhancing the interactivity and utility of the chat experience.

#### **File Upload Mechanism (PDF, TXT, etc.)**

The MessageInput component will incorporate functionality enabling users to select and upload various file types \[point 11\]. react-native-document-picker 29 will be integrated to provide a native interface for picking documents, including common formats like PDF and TXT files. Once a file is selected, it will be uploaded directly to Supabase Storage. The

FileService within the Data Layer will manage this upload process using supabase.storage.from('files').upload().4 A crucial technical consideration for React Native environments is that standard

Blob, File, or FormData objects might not function as expected for uploads; therefore, files should be converted to and uploaded as ArrayBuffer from base64 encoded data.30 Upon successful upload to Supabase Storage, relevant file metadata (e.g.,

id, name, mime\_type, storage\_object\_id from Supabase Storage) will be saved to the files table in the Supabase database 7 and linked to the corresponding message in the

messages table.

#### **Displaying Incoming AI Messages in Markdown Format**

The ChatMessageContent component will be responsible for rendering the content of AI messages, which are expected to be in markdown format, including support for code blocks and tables \[point 10\]. react-native-markdown-display 31 will be integrated for this purpose. This library is chosen for its advantages as a CommonMark renderer that utilizes native React Native components, offering superior performance and a more consistent look and feel compared to WebView-based solutions. It provides robust support for fenced code blocks with syntax highlighting and standard markdown tables.31 The package's theming system will allow for extensive customization of these markdown element styles, ensuring visual consistency with the overall application theme.

#### **Displaying Incoming Pictures with Horizontal Scrolling**

When an incoming message contains multiple image attachments \[point 12\], they will be presented within a horizontally scrollable carousel component. react-native-snap-carousel 36 or

react-native-reanimated-carousel 37 are suitable libraries for this functionality, offering features like image previews and performant handling of numerous items. Careful consideration will be given to managing potential scroll conflicts, particularly if the image carousel is nested within a larger vertical

ScrollView 38 that encompasses the entire chat history. This may involve implementing specific gesture handlers or scroll locking mechanisms to ensure a smooth user experience.

#### **Integration of Document Viewer for PDF/TXT Files**

For PDF files, the package will integrate react-native-pdf 39 to enable viewing documents directly within the app. This can be implemented either inline within the chat message display or via a dedicated full-screen viewer activated upon tapping a PDF attachment. This library supports various PDF sources (local files, URLs, base64) and offers essential features such as zooming, scrolling, and page navigation. For TXT files, a basic

Text component might suffice for direct display within the chat. For very large text files or to offer more advanced features like search or custom formatting, a dedicated text viewer component could be considered.

### **3.6. Thread Management & User Features**

To enhance user experience and organization, the package will incorporate features for managing chat threads, including favoriting and tagging.

#### **Logic for Favoriting and Tagging Chat Threads**

* **Favoriting:** A BOOLEAN column named is\_favorite will be added to the threads table in Supabase. This simple flag allows users to easily mark and unmark conversations as favorites 8, providing a quick way to identify important discussions.
* **Tagging:** For tagging, a TEXT (array of strings) or JSONB column named tags can be added directly to the threads table to store multiple tags associated with each conversation. This provides flexibility for ad-hoc tagging. For more complex tagging scenarios, such as predefined tags, tag counts, or hierarchical tags, a separate thread\_tags join table could be implemented, linking threads to a tags lookup table.8 This approach allows for greater normalization and scalability of the tagging system.

#### **UI Considerations for Displaying These Features**

The ThreadList component, responsible for displaying the list of past conversations, will provide clear visual indicators for favorited threads, such as a prominent star icon. It will also display associated tags, potentially as clickable chips or labels, allowing users to quickly grasp the content or category of a thread. Furthermore, the ThreadList will offer filtering and sorting options based on favorite status or specific tags, enabling users to efficiently navigate their conversation history. Within the ChatScreen header or a dedicated overflow menu, intuitive UI elements will be available for users to favorite or add/remove tags for the currently active thread, ensuring these management features are easily accessible.

## **4\. Package Development & Distribution**

The development and distribution strategy for the @alpha.xone/langchat package focuses on best practices for npm modules, ensuring ease of use, maintainability, and reliable deployment.

### **4.1. Project Structure & Best Practices**

The package will be initialized using npx create-react-native-library@latest \<package-name\>.1 This command-line tool provides the necessary boilerplate for creating a React Native module, ensuring cross-platform compatibility and a standardized project setup. The generated structure will include configurations for Android, iOS, and a test application, streamlining the development process.

A well-organized folder structure is crucial for the package's long-term maintainability and readability. The following organization is recommended 42:

* **/src:** Contains the core source code of the package.
  * **/src/components:** Houses all reusable UI components (e.g., MessageBubble, InputBar, ThreadCard).
  * **/src/screens:** Contains the main screen components, primarily ChatScreen, which serves as the package's entry point.
  * **/src/data:** Encapsulates the Data Layer logic, including Supabase client initialization, authentication services, and CRUD operations for threads, messages, and files. This might contain supabase.ts, AuthService.ts, ChatService.ts, FileService.ts.
  * **/src/ai:** Contains the AI Integration Layer logic, including the custom SSE streaming bridge, message parsing, and LangGraph communication utilities. This might contain LangGraphClient.ts, StreamParser.ts.
  * **/src/theming:** Dedicated to the theming system, including default theme objects, the Zustand store, and the useAppTheme custom hook.
  * **/src/hooks:** Custom React hooks that abstract complex logic for use in UI components (e.g., useChatMessages, useFileUpload).
  * **/src/utils:** General utility functions and helper modules (e.g., markdown parsing helpers, date formatters).
  * **/src/types:** TypeScript type definitions for all data structures and props.
  * **/src/index.ts:** The main entry point for the package, exporting the ChatScreen component and any other public APIs.

**Testing:** The package will include a comprehensive suite of tests. Unit tests will verify the correctness of individual components and utility functions in isolation. Integration tests will confirm the proper interaction between different layers and external services (e.g., Supabase API calls, LangGraph streaming). The create-react-native-library tool typically sets up a test application within the library folder, allowing for local testing before publishing.41 This involves navigating to the example folder, installing dependencies (

yarn install), and running platform-specific builds (yarn android, yarn ios).41

**Documentation:** A detailed README.md file will be maintained at the root of the package. This file will include:

* A clear description of the package's purpose and features.
* Installation instructions, including peerDependencies requirements.
* Usage examples for the ChatScreen component and its props.
* Configuration details for environment variables (Supabase URL/Key, LangGraph API URL).
* Guidance on extending themes and customizing behavior.
* Contribution guidelines and licensing information.

**Versioning and Publishing:** Semantic Versioning (SemVer) will be followed for all releases, ensuring clear communication of changes and compatibility. The package will be published to npm. Tools like semantic-release can automate the release process, including version bumping, generating changelogs, and publishing to npm and GitHub, upon successful CI/CD pipeline execution.43 This automation requires setting up npm and GitHub tokens as repository secrets.43 The

publishConfig in package.json will be set to {"access": "public"} to ensure the package is publicly available.43 The

create-react-native-library tool often includes a yarn prepare script for building the library and a yarn release script for publishing 41, simplifying the deployment workflow.

## **Conclusions**

The design of the React Native AI Chat package, @alpha.xone/langchat, represents a robust and extensible solution for integrating AI-powered conversational capabilities into mobile applications. By adopting a layered architecture, the package achieves high modularity and maintainability, separating UI concerns from data management and AI interactions.

The integration with Supabase for authentication and data persistence is foundational, leveraging its built-in features for user management, secure token handling, and real-time data synchronization. A key architectural decision involves the explicit validation of Supabase JWTs on the LangGraph backend. This not only secures the AI service against unauthorized access but also critically enables the propagation of user context, facilitating personalized AI responses and robust Row Level Security within the Supabase database. The meticulous schema design for threads, messages, and file attachments ensures scalable and organized data storage, with the thread ID serving as the central contextual link for seamless conversation continuity.

A significant challenge, the incompatibility of @langchain/langgraph-sdk's useStream with React Native's streaming mechanisms, is addressed through a custom SSE-based streaming bridge. This workaround, utilizing react-native-sse on the client and LangGraph's astream\_events on the backend, guarantees real-time, granular AI message delivery despite underlying technical limitations. This demonstrates the package's resilience and commitment to delivering a fluid user experience.

The theming system, designed without ThemeContext and built upon a lightweight global state management library like Zustand, provides unparalleled flexibility for customization while maintaining clean component integration. This approach allows developers to seamlessly align the chat interface with their application's brand identity. Furthermore, comprehensive support for rich media, including file uploads to Supabase Storage and sophisticated markdown rendering with image carousels, elevates the interactivity of the chat.

In conclusion, the @alpha.xone/langchat package is architected to be a high-quality, reusable npm module. Its design prioritizes ease of integration for consumers through minimal setup and configurable props, while internally managing complex interactions with Supabase and LangGraph. This comprehensive approach ensures a performant, secure, and highly customizable AI chat solution for React Native applications.

#### **Works cited**

1. How To Create NPM Package For React Native? | MindBowser, accessed July 3, 2025, [https://www.mindbowser.com/how-to-create-npm-package-for-react-native/](https://www.mindbowser.com/how-to-create-npm-package-for-react-native/)
2. Mastering Authentication in React Native: Best Practices with Supabase \- Medium, accessed July 3, 2025, [https://medium.com/@fa21-bse-112/mastering-authentication-in-react-native-best-practices-with-supabase-84caf4b741b5](https://medium.com/@fa21-bse-112/mastering-authentication-in-react-native-best-practices-with-supabase-84caf4b741b5)
3. Using Supabase \- Expo Documentation, accessed July 3, 2025, [https://docs.expo.dev/guides/using-supabase/](https://docs.expo.dev/guides/using-supabase/)
4. How to integrate Supabase Storage with your React Native Project \- Medium, accessed July 3, 2025, [https://medium.com/@wsvuefanatic/how-to-integrate-supabase-storage-with-your-react-native-project-2a2966ee712b](https://medium.com/@wsvuefanatic/how-to-integrate-supabase-storage-with-your-react-native-project-2a2966ee712b)
5. Advanced guide | Supabase Docs, accessed July 3, 2025, [https://supabase.com/docs/guides/auth/server-side/advanced-guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
6. Using Supabase as an Auth Service \- DepsHub, accessed July 3, 2025, [https://depshub.com/blog/using-supabase-auth-as-a-service-with-a-custom-backend/](https://depshub.com/blog/using-supabase-auth-as-a-service-with-a-custom-backend/)
7. supabase-community/chatgpt-your-files: Production-ready MVP for securely chatting with your documents using pgvector \- GitHub, accessed July 3, 2025, [https://github.com/supabase-community/chatgpt-your-files](https://github.com/supabase-community/chatgpt-your-files)
8. Build a Full-Stack Threads Clone with React Native & Supabase \- notJust.dev, accessed July 3, 2025, [https://www.notjust.dev/projects/threads](https://www.notjust.dev/projects/threads)
9. Full-Stack Threads Clone with React Native & Supabase (+Advanced Features) \- YouTube, accessed July 3, 2025, [https://www.youtube.com/watch?v=TA7vQYbr7kQ](https://www.youtube.com/watch?v=TA7vQYbr7kQ)
10. Conceptual guide \- Python LangChain, accessed July 3, 2025, [https://python.langchain.com/docs/concepts/](https://python.langchain.com/docs/concepts/)
11. Implementing Realtime Messaging with Supabase \+ React | by Fedor Selenskiy | May, 2025, accessed July 3, 2025, [https://levelup.gitconnected.com/implementing-realtime-messaging-with-supabase-react-0f8a33a35e61](https://levelup.gitconnected.com/implementing-realtime-messaging-with-supabase-react-0f8a33a35e61)
12. Chat History in Supabase? : r/LangChain \- Reddit, accessed July 3, 2025, [https://www.reddit.com/r/LangChain/comments/14l6a4n/chat\_history\_in\_supabase/](https://www.reddit.com/r/LangChain/comments/14l6a4n/chat_history_in_supabase/)
13. React JS Hook for your LangGraph Agent \- YouTube, accessed July 3, 2025, [https://www.youtube.com/watch?v=h8rML95qWX8](https://www.youtube.com/watch?v=h8rML95qWX8)
14. LangGraph \- LangChain, accessed July 3, 2025, [https://www.langchain.com/langgraph](https://www.langchain.com/langgraph)
15. Realtime | Supabase Docs, accessed July 3, 2025, [https://supabase.com/docs/guides/realtime](https://supabase.com/docs/guides/realtime)
16. This stream has already been locked for exclusive reading by ..., accessed July 3, 2025, [https://github.com/langchain-ai/langgraphjs/issues/1302](https://github.com/langchain-ai/langgraphjs/issues/1302)
17. Streaming \- Python LangChain, accessed July 3, 2025, [https://python.langchain.com/docs/concepts/streaming/](https://python.langchain.com/docs/concepts/streaming/)
18. How to stream runnables \- Python LangChain, accessed July 3, 2025, [https://python.langchain.com/docs/how\_to/streaming/](https://python.langchain.com/docs/how_to/streaming/)
19. astream\_event doens't emit events from retriever tool \#17041 \- GitHub, accessed July 3, 2025, [https://github.com/langchain-ai/langchain/discussions/17041](https://github.com/langchain-ai/langchain/discussions/17041)
20. react-native-sse \- npm, accessed July 3, 2025, [https://www.npmjs.com/package/react-native-sse](https://www.npmjs.com/package/react-native-sse)
21. Theming | React Native Paper, accessed July 3, 2025, [https://callstack.github.io/react-native-paper/docs/guides/theming/](https://callstack.github.io/react-native-paper/docs/guides/theming/)
22. Themes \- React Navigation, accessed July 3, 2025, [https://reactnavigation.org/docs/themes/](https://reactnavigation.org/docs/themes/)
23. Appearance \- React Native, accessed July 3, 2025, [https://reactnative.dev/docs/appearance](https://reactnative.dev/docs/appearance)
24. Mastering State Management with Zustand in Next.js and React \- DEV Community, accessed July 3, 2025, [https://dev.to/mrsupercraft/mastering-state-management-with-zustand-in-nextjs-and-react-1g26](https://dev.to/mrsupercraft/mastering-state-management-with-zustand-in-nextjs-and-react-1g26)
25. Zustand \- Complete Tutorial for Beginners in React Native \- YouTube, accessed July 3, 2025, [https://www.youtube.com/watch?v=U2Hg-MAAz\_M](https://www.youtube.com/watch?v=U2Hg-MAAz_M)
26. Zustand | Ignite Cookbook for React Native, accessed July 3, 2025, [https://ignitecookbook.com/docs/recipes/Zustand/](https://ignitecookbook.com/docs/recipes/Zustand/)
27. Mastering State Management in React Native Apps in 2025: A Comprehensive Guide | by praveen sharma | Medium, accessed July 3, 2025, [https://medium.com/@sharmapraveen91/mastering-state-management-in-react-native-apps-in-2025-a-comprehensive-guide-5399b6693dc1](https://medium.com/@sharmapraveen91/mastering-state-management-in-react-native-apps-in-2025-a-comprehensive-guide-5399b6693dc1)
28. Global state management in react native || software engineering tutorial \- YouTube, accessed July 3, 2025, [https://m.youtube.com/shorts/Beqq2WSgk0k](https://m.youtube.com/shorts/Beqq2WSgk0k)
29. Hello from React Native document picker & viewer | React Native ..., accessed July 3, 2025, [https://react-native-documents.github.io/](https://react-native-documents.github.io/)
30. JavaScript: Upload a file | Supabase Docs, accessed July 3, 2025, [https://supabase.com/docs/reference/javascript/storage-from-upload](https://supabase.com/docs/reference/javascript/storage-from-upload)
31. yarn | Yarn, accessed July 3, 2025, [https://classic.yarnpkg.com/en/package/react-native-markdown-renderer](https://classic.yarnpkg.com/en/package/react-native-markdown-renderer)
32. react-native-markdown-display \- npm, accessed July 3, 2025, [https://www.npmjs.com/package/react-native-markdown-display](https://www.npmjs.com/package/react-native-markdown-display)
33. iamacup/react-native-markdown-display: React Native 100 ... \- GitHub, accessed July 3, 2025, [https://github.com/iamacup/react-native-markdown-display](https://github.com/iamacup/react-native-markdown-display)
34. Looking for a javascript markdown library which can parse code blocks within \`\`\` and \`\`\` \[closed\] \- Stack Overflow, accessed July 3, 2025, [https://stackoverflow.com/questions/10991049/looking-for-a-javascript-markdown-library-which-can-parse-code-blocks-within](https://stackoverflow.com/questions/10991049/looking-for-a-javascript-markdown-library-which-can-parse-code-blocks-within)
35. code block inside table row in Markdown \- Stack Overflow, accessed July 3, 2025, [https://stackoverflow.com/questions/28508141/code-block-inside-table-row-in-markdown](https://stackoverflow.com/questions/28508141/code-block-inside-table-row-in-markdown)
36. react-native-snap-carousel examples \- CodeSandbox, accessed July 3, 2025, [https://codesandbox.io/examples/package/react-native-snap-carousel](https://codesandbox.io/examples/package/react-native-snap-carousel)
37. How can I create a carousel with multiple item like the image attached? \- Stack Overflow, accessed July 3, 2025, [https://stackoverflow.com/questions/77972117/how-can-i-create-a-carousel-with-multiple-item-like-the-image-attached](https://stackoverflow.com/questions/77972117/how-can-i-create-a-carousel-with-multiple-item-like-the-image-attached)
38. Help with carousel inside scroll view : r/reactnative \- Reddit, accessed July 3, 2025, [https://www.reddit.com/r/reactnative/comments/18wgq4h/help\_with\_carousel\_inside\_scroll\_view/](https://www.reddit.com/r/reactnative/comments/18wgq4h/help_with_carousel_inside_scroll_view/)
39. How to build a React Native PDF viewer \- Nutrient, accessed July 3, 2025, [https://www.nutrient.io/blog/how-to-build-a-react-native-pdf-viewer/](https://www.nutrient.io/blog/how-to-build-a-react-native-pdf-viewer/)
40. react-native-pdf \- npm, accessed July 3, 2025, [https://www.npmjs.com/package/react-native-pdf](https://www.npmjs.com/package/react-native-pdf)
41. Create a Library for Your Module \- React Native, accessed July 3, 2025, [https://reactnative.dev/docs/the-new-architecture/create-module-library](https://reactnative.dev/docs/the-new-architecture/create-module-library)
42. Newbie Learning React Native CLI and Node.js from Scratch \- Need Advice on App Structure and Best Practices : r/reactnative \- Reddit, accessed July 3, 2025, [https://www.reddit.com/r/reactnative/comments/1j58jbm/newbie\_learning\_react\_native\_cli\_and\_nodejs\_from/](https://www.reddit.com/r/reactnative/comments/1j58jbm/newbie_learning_react_native_cli_and_nodejs_from/)
43. Best Practices for Creating a Modern npm Package with Security in Mind | Snyk, accessed July 3, 2025, [https://snyk.io/blog/best-practices-create-modern-npm-package/](https://snyk.io/blog/best-practices-create-modern-npm-package/)