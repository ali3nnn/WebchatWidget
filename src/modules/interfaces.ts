import { Socket } from 'socket.io-client';

// ========================================
// INTERFACES
// ========================================

/**
 * Represents the main UI elements of the webchat widget
 * Contains references to all DOM elements that need to be manipulated
 */
export interface ChatUI {
  webchatWrapper: HTMLDivElement;
  chatBubble: HTMLDivElement;
  chatContainer: HTMLDivElement;
  chat: HTMLElement;
  input: HTMLInputElement;
  sendBtn: HTMLButtonElement;
  plusBtn: HTMLButtonElement;
}

/**
 * Configuration settings for the webchat endpoint
 * Defines appearance, behavior, and connection settings
 */
export interface EndpointSettings {
  flow: string;
  chatbotName: string;
  colors: {
    header: string;
    message: {
      user: string;
      bot: string;
    };
    chatBubble?: string;
  };
  inputFieldMessage: string;
  sendButton: string;
  chatBubbleMessage?: string;
  chatBubblePillMessage?: string;
  chatBubbleTheme?: string;
  chatContainerTheme?: string;
  enableJumpAnimation?: boolean;
}

/**
 * Represents a single message in the chat queue
 * Contains all data needed to display and process a message
 */
export interface MessageData {
  chatElement: HTMLElement;
  text: string;
  sender: 'user' | 'bot';
  quickReplies: string[];
  socket?: Socket;
  ui?: ChatUI;
} 