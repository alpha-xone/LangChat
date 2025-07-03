
1. Chatting app module btw user and AI.

2. Two data sources: supabase and LangGraph.

3. Use supabase for user authentications.

4. When UI is initiated, the chat screen will load past threads and messages from supabase.

5. User messages will be sent to LangGraph backend, along with supabase access token in the defaultHeaders.

6. User messages will be processed and saved to supabase database.

7. LangGraph will return AI messages including AI, tools, systems, and assistants.

8. When user sends messges from past thread, keep the same thread ID to send to LangGraph for context consistency.

9. Themes are crucial ingredient for the app. Start with the basic light / dark / system, with the ability to extended to use more customized themes in the future. Avoid using ThemeContext for cleaner wrapping.

10. Display incoming AI messgaes in markdown format, with supports of code blocks, tables, etc.

11. Support of file uploads including pdf / txt / etc.

12. Support of incoming pictures - for multiple pictures, scroll horizontally to display.

13. Favourite and tagging threads.



Technical specifications:

1. Make the package able to publish to npm.

2. Users can load the module with minimal setup - define environment variables in LangGraph, LLM, supabase, etc., then with a few props for ChatScreen, anyone can start using the package.

3. Use @langchain/langgraph-sdk for thread managements and streaming.
