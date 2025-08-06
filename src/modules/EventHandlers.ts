import { Socket } from 'socket.io-client';
import { ChatUI } from './interfaces';
import { MessageQueueManager } from './MessageQueueManager';

// ========================================
// EVENT HANDLERS
// ========================================

/**
 * Manages all event listeners for the webchat widget
 * Handles user interactions, button clicks, and form submissions
 */
export class EventHandlers {
  /**
   * Sets up event listeners for production mode with socket connection
   * @param ui - Chat UI reference
   * @param socket - WebSocket connection
   * @param messageQueueManager - Queue manager for message processing
   */
  static setupSocketEvents(ui: ChatUI, socket: Socket, messageQueueManager: MessageQueueManager): void {
    ui.sendBtn.addEventListener('click', () => this.sendMessage(ui, socket, messageQueueManager));
    ui.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.sendMessage(ui, socket, messageQueueManager);
    });
  }

  /**
   * Sets up event listeners for development test mode
   * Simulates chat functionality without real socket connection
   */
  static setupDevTestEvents(ui: ChatUI, messageQueueManager: MessageQueueManager): void {
    ui.sendBtn.addEventListener('click', () => this.handleDevTestMessage(ui, messageQueueManager));
    ui.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.handleDevTestMessage(ui, messageQueueManager);
    });

    ui.chatBubble.addEventListener('click', () => {
      ui.webchatWrapper.classList.toggle('webchat-visible');
      const isOpen = ui.webchatWrapper.classList.contains('webchat-visible');
      if (isOpen) {
        ui.chatBubble.classList.add('chat-open');
        ui.input.focus();
      } else {
        ui.chatBubble.classList.remove('chat-open');
      }
    });

    this.setupCloseButton(ui);
    this.setupPlusButton(ui);
  }

  /**
   * Sets up event listeners for production mode
   * Handles chat bubble toggle and socket connection management
   */
  static setupProductionEvents(ui: ChatUI, getOrCreateSocket: () => Socket): void {
    ui.chatBubble.addEventListener('click', () => {
      ui.webchatWrapper.classList.toggle('webchat-visible');
      const isOpen = ui.webchatWrapper.classList.contains('webchat-visible');
      if (isOpen) {
        ui.chatBubble.classList.add('chat-open');
        ui.input.focus();
        getOrCreateSocket();
      } else {
        ui.chatBubble.classList.remove('chat-open');
      }
    });

    this.setupCloseButton(ui);
    this.setupPlusButton(ui);
  }

  /**
   * Sets up the close button functionality
   * Hides the chat container when clicked
   */
  private static setupCloseButton(ui: ChatUI): void {
    const closeBtn = ui.chatContainer.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        ui.webchatWrapper.classList.remove('webchat-visible');
        ui.chatBubble.classList.remove('chat-open');
      });
    }
  }

  /**
   * Sets up the plus button functionality
   * Toggles the action area visibility and button rotation
   */
  private static setupPlusButton(ui: ChatUI): void {
    ui.plusBtn.addEventListener('click', () => {
      const actionArea = document.getElementById('actionArea');
      if (actionArea) {
        actionArea.classList.toggle('action-hidden');
        const isHidden = actionArea.classList.contains('action-hidden');
        ui.plusBtn.classList.toggle('rotated', !isHidden);
      }
    });
  }

  /**
   * Sends a user message through the socket connection
   * Adds message to queue and emits to server
   */
  private static sendMessage(ui: ChatUI, socket: Socket, messageQueueManager: MessageQueueManager): void {
    const text = ui.input.value.trim();
    if (!text) return;
    console.log("Sending message:", text)
    messageQueueManager.addMessage({
      chatElement: ui.chat,
      text,
      sender: 'user',
      quickReplies: [],
      socket,
      ui
    });
    socket.emit('message', text);
    ui.input.value = '';
    ui.input.focus();
  }

  /**
   * Handles message sending in development test mode
   * Simulates bot responses with random messages and quick replies
   */
  private static handleDevTestMessage(ui: ChatUI, messageQueueManager: MessageQueueManager): void {
    const text = ui.input.value.trim();
    if (!text) return;
    
    messageQueueManager.addMessage({
      chatElement: ui.chat,
      text,
      sender: 'user',
      quickReplies: [],
      socket: undefined,
      ui
    });
    ui.input.value = '';
    ui.input.focus();

    setTimeout(() => {
      const responses = [
        "That's interesting! Tell me more about that.",
        "I understand. How does that make you feel?",
        "Thanks for sharing that with me.",
        "I'm here to help. What else would you like to discuss?",
        "That's a great point. Can you elaborate?",
        "I'm listening. Please continue.",
        "Thank you for your message. How can I assist you further?",
        "I appreciate you taking the time to share that.",
        "That's helpful information. What's next?",
        "I'm here to support you. What would you like to explore?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const quickReplies = ['Tell me more', 'What else?', 'Thanks', 'Goodbye'];
      
      messageQueueManager.addMessage({
        chatElement: ui.chat,
        text: randomResponse,
        sender: 'bot',
        quickReplies,
        socket: undefined,
        ui
      });
    }, Math.random() * 1000);
  }
} 