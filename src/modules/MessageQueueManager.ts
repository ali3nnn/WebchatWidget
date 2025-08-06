import { MessageData } from './interfaces';
import { Logger } from './utils';
import { TypewriterEffect } from './TypewriterEffect';

// ========================================
// MESSAGE QUEUE MANAGER
// ========================================

/**
 * Manages the message queue and typewriter effect
 * Ensures messages are displayed in order with proper animations
 */
export class MessageQueueManager {
    private messageQueue: MessageData[] = [];
    private isTyping = false;

    /**
     * Adds a message to the queue and processes it if not currently typing
     * @param message - The message data to add to the queue
     */
    addMessage(message: MessageData): void {
        this.messageQueue.push(message);
        if (!this.isTyping) {
            this.processMessageQueue();
        }
    }

    /**
     * Processes the next message in the queue
     * Handles both user and bot messages with appropriate animations
     */
    private processMessageQueue(): void {
        if (this.messageQueue.length === 0 || this.isTyping) {
            return;
        }

        const message = this.messageQueue.shift()!;
        this.isTyping = true;

        const wrapper = document.createElement('div');
        wrapper.className = `message ${message.sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'bubble';

        wrapper.appendChild(bubble);

        if (message.sender === 'bot') {
            TypewriterEffect.apply(bubble, message.text, () => {
                this.addQuickReplies(wrapper, message);
                this.isTyping = false;
                this.processMessageQueue();
            });
        } else {
            bubble.textContent = message.text;
            this.isTyping = false;
            this.processMessageQueue();
        }

        message.chatElement.appendChild(wrapper);
        message.chatElement.scrollTop = message.chatElement.scrollHeight;
    }

    /**
     * Adds quick reply buttons to a bot message
     * Creates interactive buttons for user responses
     */
    private addQuickReplies(wrapper: HTMLElement, message: MessageData): void {
        if (message.quickReplies.length > 0 && message.socket && message.ui) {
            Logger.log('Adding quick replies:', message.quickReplies);
            const qrContainer = document.createElement('div');
            qrContainer.className = 'quick-replies';

            message.quickReplies.forEach(reply => {
                const btn = document.createElement('button');
                btn.className = 'quick-reply-btn';
                btn.textContent = reply;
                btn.addEventListener('click', () => {
                    this.addMessage({
                        chatElement: message.ui!.chat,
                        text: reply,
                        sender: 'user',
                        quickReplies: [],
                        socket: message.socket,
                        ui: message.ui
                    });
                    message.socket!.emit('message', reply);
                    message.ui!.input.value = '';
                    message.ui!.input.focus();
                });
                qrContainer.appendChild(btn);
            });

            wrapper.appendChild(qrContainer);
            Logger.log('Quick replies container added to wrapper');
        }
        // else {
        //   Logger.log('No quick replies to add. Length:', message.quickReplies.length, 'Socket:', !!message.socket, 'UI:', !!message.ui);
        // }
    }
} 