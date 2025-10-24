import { io, Socket } from 'socket.io-client';
import { ChatUI } from './interfaces';
import { Logger, SessionUtils } from './utils';
import { MessageQueueManager } from './MessageQueueManager';

// ========================================
// SOCKET MANAGER
// ========================================

/**
 * Manages WebSocket connections for real-time chat communication
 * Handles connection, disconnection, and message events
 */
export class SocketManager {
  /**
   * Creates and configures a WebSocket connection
   * @param basePath - The WebSocket server URL
   * @param endpointID - The specific endpoint identifier
   * @param ui - Chat UI reference for updating interface
   * @param messageQueueManager - Queue manager for processing messages
   * @returns Configured Socket.io connection
   */
  static createConnection(basePath: string, endpointID: string, ui: ChatUI, messageQueueManager: MessageQueueManager): Socket {
    Logger.log('endpointID', endpointID);
    const socket = io(basePath, {
      auth: { endpoint: endpointID, sessionId: SessionUtils.getBrainigySessionId() },
      reconnectionAttempts: 3,
      reconnectionDelay: 2000
    });

    socket.on('connect', () => {
      Logger.log('✅ Connected');
      ui.sendBtn.disabled = false;
    });

    socket.on('disconnect', (reason) => {
      Logger.log('❌ Disconnected:', reason);
      ui.sendBtn.disabled = true;
    });

    socket.on('connect_error', (err: Error) => {
      Logger.log('⚠️ Connection Error:', err.message);
    });

    socket.on('message', (msg: { text: string; quickReplies: string[]; customData?: { streaming?: boolean; streamId?: string } }) => {
      if (!msg || typeof msg.text !== 'string' || msg.text === null || msg.text === undefined) {
        console.warn('Invalid message format:', msg);
        return;
      }
      
      // Skip empty or whitespace-only messages
      if (msg.text.trim().length === 0 || msg.text === "undefined" || msg.text === "null") {
        console.warn('Empty message received, skipping:', msg);
        return;
      }
      
      console.log("Message received:", msg)
      
      const messageData = {
        chatElement: ui.chat,
        sender: 'bot' as const,
        socket,
        ui,
        ...msg,
      };

      if (msg.customData?.streaming) {
        messageQueueManager.addStreamMessage(messageData);
      } else {
        messageQueueManager.addMessage(messageData);
      }
    });

    return socket;
  }
} 