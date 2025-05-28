// src/chatTypes.ts

export interface MessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const testMessage: MessageType = {
  id: '1',
  role: 'user',
  content: 'Hello, world!',
};
