// ========================================
// UTILITIES
// ========================================

/**
 * Handles CSS injection into the document head
 * Used to inject the webchat styles dynamically
 */
export class CSSInjector {
  static inject(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

/**
 * Centralized logging utility for the webchat widget
 * Provides consistent logging format and filtering
 */
export class Logger {
  static log(...args: unknown[]): void {
    console.log('[webchat.ts]', ...args);
  }
}

/**
 * Utility for generating UUIDs and managing session storage
 */
export class SessionUtils {
  /**
   * Generates a proper UUID v4
   * @returns A random UUID v4 string
   */
  static generateUUID(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback to manual UUID generation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Creates or retrieves the brainigy_sessionId from sessionStorage
   * @returns The session ID
   */
  static getBrainigySessionId(): string {
    const existingSessionId = sessionStorage.getItem('brainigy_sessionId');
    if (existingSessionId) {
      return existingSessionId;
    }
    
    const newSessionId = this.generateUUID();
    sessionStorage.setItem('brainigy_sessionId', newSessionId);
    Logger.log('🆔 Created new brainigy_sessionId:', newSessionId);
    return newSessionId;
  }
}

/**
 * Manages conversation storage and retrieval from localStorage
 */
export class ConversationManager {
  private static readonly CONVERSATION_PREFIX = 'brainigy_conversation_';

  /**
   * Gets the localStorage key for a session's conversation
   */
  private static getConversationKey(sessionId: string): string {
    return `${this.CONVERSATION_PREFIX}${sessionId}`;
  }

  /**
   * Saves a message to the conversation history
   */
  static saveMessage(sessionId: string, message: { text: string; sender: 'user' | 'bot'; timestamp: string; quickReplies?: string[], customData?: object }): void {
    const key = this.getConversationKey(sessionId);
    const conversation = this.getConversation(sessionId);
    conversation.push(message);
    
    try {
      localStorage.setItem(key, JSON.stringify(conversation));
      Logger.log('💾 Message saved to conversation:', message.text.substring(0, 50) + '...');
    } catch (error) {
      console.warn('Failed to save conversation to localStorage:', error);
    }
  }

  /**
   * Retrieves the conversation history for a session
   */
  static getConversation(sessionId: string): Array<{ text: string; sender: 'user' | 'bot'; timestamp: string; quickReplies?: string[] }> {
    const key = this.getConversationKey(sessionId);
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const conversation = JSON.parse(stored);
        Logger.log('📚 Retrieved conversation with', conversation.length, 'messages');
        return conversation;
      }
    } catch (error) {
      console.warn('Failed to retrieve conversation from localStorage:', error);
    }
    
    return [];
  }

  /**
   * Clears the conversation history for a session
   */
  static clearConversation(sessionId: string): void {
    const key = this.getConversationKey(sessionId);
    localStorage.removeItem(key);
    Logger.log('🗑️ Conversation cleared for session:', sessionId);
  }

  /**
   * Restores conversation messages to the chat container
   */
  static restoreConversation(sessionId: string, chatElement: HTMLElement): void {
    const conversation = this.getConversation(sessionId);
    
    if (conversation.length > 0) {
      Logger.log('🔄 Restoring', conversation.length, 'messages to chat');
      
      conversation.forEach(message => {
        const wrapper = document.createElement('div');
        wrapper.className = `message ${message.sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = message.text;

        wrapper.appendChild(bubble);

        // Add quick replies if they exist for bot messages
        if (message.sender === 'bot' && message.quickReplies && message.quickReplies.length > 0) {
          const qrContainer = document.createElement('div');
          qrContainer.className = 'quick-replies';
          
          message.quickReplies.forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply-btn disabled'; // Add disabled class for restored messages
            btn.textContent = reply;
            btn.disabled = true; // Disable interaction with restored quick replies
            qrContainer.appendChild(btn);
          });
          
          wrapper.appendChild(qrContainer);
        }

        chatElement.appendChild(wrapper);
      });

      // Scroll to bottom after restoring messages
      chatElement.scrollTop = chatElement.scrollHeight;
    }
  }
}

/**
 * Utility for creating gradient colors from single color values
 * Converts hex, HSL, and gradient colors to consistent gradient format
 */
export class ColorUtils {
  static createGradient(color: string | undefined): string {
    if (!color) {
      return '';
    }

    if (color.includes('gradient') || color.includes('linear-gradient')) {
      return color;
    }
    
    if (color.includes('hsl')) {
      const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (hslMatch) {
        const [, h, s, l] = hslMatch;
        const hue = parseInt(h);
        const saturation = parseInt(s);
        const lightness = parseInt(l);
        const lighterLightness = Math.min(100, lightness * 1.4);
        return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lighterLightness}%) 0%, ${color} 100%)`;
      }
    }
    
    const lighterColor = color.replace('#', '').match(/.{2}/g)?.map(hex => {
      const num = parseInt(hex, 16);
      const lighter = Math.min(255, num + Math.round(num * 0.2));
      return lighter.toString(16).padStart(2, '0');
    }).join('') || color;
    
    return `linear-gradient(135deg, #${lighterColor} 0%, ${color} 100%)`;
  }
} 