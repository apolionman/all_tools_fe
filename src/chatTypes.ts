// src/chatTypes.ts

export interface MessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}