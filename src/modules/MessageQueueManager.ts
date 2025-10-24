import { MessageData } from './interfaces';
import { Logger, SessionUtils, ConversationManager } from './utils';
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
    private currentStreamMessage: { wrapper: HTMLElement; bubble: HTMLElement; text: string; streamId: string } | null = null;

    /**
     * Adds a message to the queue and processes it if not currently typing
     * @param message - The message data to add to the queue
     */
    addMessage(message: MessageData): void {
        console.log("Adding message to queue:", message);
        this.messageQueue.push(message);
        if (!this.isTyping) {
            this.processMessageQueue();
        }
    }

    /**
     * Adds a streaming message that updates in real-time
     * @param message - The streaming message data to add
     */
    addStreamMessage(message: MessageData): void {
        console.log("Adding streaming message:", message);

        // Extract streamId from customData
        const streamId = (message as any).customData?.streamId;

        if (!streamId) {
            console.warn('Stream message missing streamId, treating as regular message');
            this.addMessage(message);
            return;
        }

        // Check if this is a new stream or continuation of existing stream
        const isNewStream = !this.currentStreamMessage || this.currentStreamMessage.streamId !== streamId;

        if (isNewStream) {
            // Finalize previous stream if exists (this will save it)
            if (this.currentStreamMessage) {
                console.log('New stream detected, finalizing previous stream:', this.currentStreamMessage.streamId);
                this.finalizeStreamMessage(message, this.currentStreamMessage.streamId);
            }

            // Create a new stream message bubble
            const wrapper = document.createElement('div');
            wrapper.className = `message ${message.sender}`;

            const bubble = document.createElement('div');
            bubble.className = 'bubble';

            wrapper.appendChild(bubble);
            message.chatElement.appendChild(wrapper);

            this.currentStreamMessage = {
                wrapper,
                bubble,
                text: message.text,
                streamId
            };

            bubble.textContent = message.text;
        } else if (this.currentStreamMessage) {
            // Append to existing stream message with the same streamId
            this.currentStreamMessage.text += message.text;
            this.currentStreamMessage.bubble.textContent = this.currentStreamMessage.text;
        }

        // Scroll to bottom
        message.chatElement.scrollTop = message.chatElement.scrollHeight;

        // Note: We don't save here - saving happens only when stream is finalized
    }

    /**
     * Finalizes the current streaming message and adds quick replies if needed
     * Saves the complete message to localStorage
     * @param message - The final message data with quick replies
     * @param streamId - Optional streamId to finalize specific stream
     */
    finalizeStreamMessage(message?: MessageData, streamId?: string): void {
        // If streamId is provided, only finalize if it matches current stream
        if (streamId && this.currentStreamMessage && this.currentStreamMessage.streamId !== streamId) {
            console.log('StreamId mismatch, not finalizing:', { expected: streamId, current: this.currentStreamMessage.streamId });
            return;
        }

        if (this.currentStreamMessage) {
            // Add quick replies if provided
            if (message) {
                this.addQuickReplies(this.currentStreamMessage.wrapper, message);
            }

            // Save the complete streamed message to localStorage
            const sessionId = SessionUtils.getBrainigySessionId();
            ConversationManager.saveMessage(sessionId, {
                text: this.currentStreamMessage.text,
                sender: message?.sender || 'bot',
                timestamp: new Date().toISOString(),
                quickReplies: message?.quickReplies,
                customData: { streamId: this.currentStreamMessage.streamId }
            });

            console.log('💾 Complete stream message saved:', this.currentStreamMessage.streamId);
        }

        this.currentStreamMessage = null;
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
            // Typing effect disabled - show message immediately
            bubble.textContent = message.text;
            this.addQuickReplies(wrapper, message);
            this.isTyping = false;
            this.processMessageQueue();
        } else {
            bubble.textContent = message.text;
            this.isTyping = false;
            this.processMessageQueue();
        }

        message.chatElement.appendChild(wrapper);
        message.chatElement.scrollTop = message.chatElement.scrollHeight;

        // Save message to localStorage
        const sessionId = SessionUtils.getBrainigySessionId();
        ConversationManager.saveMessage(sessionId, {
            text: message.text,
            sender: message.sender,
            timestamp: new Date().toISOString(),
            quickReplies: message.quickReplies,
            customData: message.customData
        });
    }

    /**
     * Adds quick reply buttons to a bot message
     * Creates interactive buttons for user responses
     */
    private addQuickReplies(wrapper: HTMLElement, message: MessageData): void {
        if (message.quickReplies?.length > 0 && message.socket && message.ui) {
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