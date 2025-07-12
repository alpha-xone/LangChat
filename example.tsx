import React from "react";
import { View, StyleSheet } from "react-native";
import { ChatScreen, type LangGraphConfig } from "./src"; // Use relative import instead of package name

export default function ChatExample() {
  // LangGraph configuration
  const langGraphConfig: LangGraphConfig = {
    apiUrl: "https://your-deployment-url", // Replace with your LangGraph API URL
    assistantId: "agent", // Your assistant ID
    defaultHeaders: {
      // Add any additional headers if needed
    },
  };

  const handleThreadCreated = (threadId: string) => {
    console.log("New thread created:", threadId);
    // You can save this threadId to continue the conversation later
  };

  const handleError = (error: string) => {
    console.error("Chat error:", error);
    // Handle error (show toast, etc.)
  };

  return (
    <View style={styles.container}>
      <ChatScreen
        config={langGraphConfig}
        reconnectOnMount={true}
        placeholder="Ask me anything..."
        onThreadCreated={handleThreadCreated}
        onError={handleError}
        style={{
          container: styles.chatContainer,
          input: styles.customInput,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  chatContainer: {
    flex: 1,
  },
  customInput: {
    // Custom input styles if needed
  },
});

// Alternative usage with custom message rendering
export function ChatExampleWithCustomRendering() {
  const langGraphConfig: LangGraphConfig = {
    apiUrl: "https://your-deployment-url",
    assistantId: "agent",
  };

  const renderCustomMessage = (message: any, _index: number) => {
    // Custom message bubble rendering
    return (
      <View key={message.id} style={{ padding: 10 }}>
        {/* Your custom message UI */}
      </View>
    );
  };

  const renderCustomHeader = () => {
    return (
      <View style={{ padding: 16, backgroundColor: "#f0f0f0" }}>
        {/* Your custom header */}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ChatScreen
        config={langGraphConfig}
        renderMessage={renderCustomMessage}
        renderHeader={renderCustomHeader}
      />
    </View>
  );
}
