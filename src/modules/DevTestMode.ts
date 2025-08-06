import { ChatUI } from './interfaces';
import { EventHandlers } from './EventHandlers';
import { MessageQueueManager } from './MessageQueueManager';

// ========================================
// DEV TEST MODE
// ========================================

/**
 * Handles development test mode functionality
 * Provides simulated chat experience without real backend connection
 */
export class DevTestMode {
  /**
   * Sets up development test mode with initial bot message
   * @param ui - Chat UI reference
   * @param messageQueueManager - Queue manager for message processing
   */
  static setup(ui: ChatUI, messageQueueManager: MessageQueueManager): void {
    console.log("DevTestMode setup")
    setTimeout(() => {
      messageQueueManager.addMessage({
        chatElement: ui.chat,
        text: "Hello! I'm a dev test bot. How can I help you today?",
        sender: 'bot',
        quickReplies: ['Tell me more', 'What can you do?', 'Goodbye', 'This is a long quick reply', 'Test'],
        socket: undefined,
        ui
      });
    }, 1000);

    EventHandlers.setupDevTestEvents(ui, messageQueueManager);
  }
} 