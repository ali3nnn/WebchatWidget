import { io, Socket } from 'socket.io-client';
import { ChatUI } from './interfaces';
import { Logger } from './utils';
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
      auth: { endpoint: endpointID },
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

    socket.on('message', (msg: { text: string; quickReplies?: string[] }) => {
      if (!msg || typeof msg.text !== 'string') {
        console.warn('Invalid message format:', msg);
        return;
      }
      console.log("Message received:", msg)
      messageQueueManager.addMessage({
        chatElement: ui.chat,
        text: msg.text,
        sender: 'bot',
        quickReplies: msg.quickReplies || [],
        socket,
        ui
      });
    });

    return socket;
  }
} 