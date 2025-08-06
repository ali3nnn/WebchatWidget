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
  DevTestMode,
  EndpointSettings
} from './modules';

/**
 * Main entry point for the webchat widget
 * Initializes the chat interface and handles both dev and production modes
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

  const isDevTestMode = endpointID === 'DEV_TEST_MODE';
  
  if (isDevTestMode) {
    Logger.log('🧪 Initializing Webchat in DEV_TEST_MODE');
    const devSettings: EndpointSettings = {
      flow: "dev-test",
      chatbotName: "Dev Test Bot",
      colors: {
        header: "#667eea",
        message: {
          user: "#667eea",
          bot: "#4a5568"
        }
      },
      inputFieldMessage: "Type your message...",
      sendButton: "Send",
      chatBubbleTheme: 'theme-chatbubble-modern',
      chatContainerTheme: 'theme-container-modern',
      enableJumpAnimation: false
    };
    
    const ui = ChatUIBuilder.create(devSettings);
    DevTestMode.setup(ui, messageQueueManager);
    return;
  }

  let endpointSettings: EndpointSettings;
  try {
    const response = await fetch(endpointURL);
    if (!response.ok) {
      throw new Error(`GET request failed with status ${response.status}`);
    }
    const data = await response.json();

    endpointSettings = {
      ...data.settings,
      // colors: {
        // header: "#667eea",
        // message: {
          // user: "#667eea",
          // bot: "#4a5568"
        // }
      // },
      chatBubbleTheme: 'theme-chatbubble-modern',
      chatContainerTheme: 'theme-container-modern',
      enableJumpAnimation: false
    };
  } catch (error) {
    console.error('❌ Error making GET request:', error);
    return;
  }

  Logger.log('Initializing Webchat');

  console.log("Endpoint Settings", endpointSettings)

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
  }
}

window.initWebchat = initWebchat;