// webchat.ts
import { io, Socket } from 'socket.io-client';
import cssText from './style.css';
import {
  CSSInjector,
  Logger,
  MessageQueueManager,
  ChatUIBuilder,
  SocketManager,
  EventHandlers,
  EndpointSettings,
  SessionUtils,
  ConversationManager
} from './modules';

/**
 * Main entry point for the webchat widget
 */

// ========================================
// MAIN INITIALIZATION
// ========================================

// Initialize CSS
CSSInjector.inject(cssText);

// Global message queue manager
const messageQueueManager = new MessageQueueManager();

/**
 * Initializes the webchat widget with the provided endpoint URL
 * @param endpointURL - The full WebSocket URL including endpoint ID
 */
export async function initWebchat(endpointURL: string): Promise<void> {
  if (!endpointURL) {
    console.error('⚠️ You must provide the full WebSocket URL to initWebchat()');
    return;
  }

  const url = new URL(endpointURL);
  const basePath = url.origin;
  const endpointID = url.pathname.replace("/", "");

  if (!endpointID) {
    console.error('⚠️ Missing "endpointID" in the query parameters.');
    return;
  }
  
  let endpointSettings: EndpointSettings;
  try {
    const response = await fetch(endpointURL);
    if (!response.ok) {
      throw new Error(`GET request failed with status ${response.status}`);
    }
    const data = await response.json();

    // @ts-ignore
    endpointSettings = {
      ...data.settings,
      enableJumpAnimation: false,
      additionalInput: false
    };

    // console.log("Endpoint URL:", endpointURL)
    console.log("Endpoint Settings:", endpointSettings)
  } catch (error) {
    console.error('❌ Error making GET request:', error);
    return;
  }

  Logger.log('Initializing Webchat');

  const ui = ChatUIBuilder.create(endpointSettings);
  let socket: Socket | null = null;

  const getOrCreateSocket = (): Socket => {
    if (socket) return socket;
    socket = SocketManager.createConnection(basePath, endpointID, ui, messageQueueManager);
    EventHandlers.setupSocketEvents(ui, socket, messageQueueManager);
    return socket;
  };

  EventHandlers.setupProductionEvents(ui, getOrCreateSocket);
}

// ========================================
// GLOBAL EXPORT
// ========================================

declare global {
  interface Window {
    initWebchat?: (url: string) => void;
    webchatConversation?: {
      getSessionId: () => string;
      getConversation: () => any[];
      clearConversation: () => void;
      exportConversation: () => string;
    };
  }
}

window.initWebchat = initWebchat;

// Expose conversation management for debugging
window.webchatConversation = {
  getSessionId: () => SessionUtils.getBrainigySessionId(),
  getConversation: () => {
    const sessionId = SessionUtils.getBrainigySessionId();
    return ConversationManager.getConversation(sessionId);
  },
  clearConversation: () => {
    const sessionId = SessionUtils.getBrainigySessionId();
    ConversationManager.clearConversation(sessionId);
    // Clear the chat UI if it exists
    const chatElement = document.querySelector('#chat');
    if (chatElement) {
      chatElement.innerHTML = '';
    }
  },
  exportConversation: () => {
    const sessionId = SessionUtils.getBrainigySessionId();
    const conversation = ConversationManager.getConversation(sessionId);
    return JSON.stringify(conversation, null, 2);
  }
};