export interface ChatConfig {
  apiKey?: string;
  baseUrl?: string;
  threadId?: string;
  assistantId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
}

export interface ThemeConfig {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
}

export interface ComponentConfig {
  theme?: ThemeConfig;
  chat?: ChatConfig;
}