import { ChatUI, EndpointSettings } from './interfaces';
import { ColorUtils, SessionUtils, ConversationManager } from './utils';
import { SVG_ASSETS } from './constants';

// ========================================
// CHAT UI BUILDER
// ========================================

/**
 * Builds and configures the complete chat UI
 * Creates all DOM elements and applies styling based on settings
 */
export class ChatUIBuilder {
  /**
   * Creates the complete chat UI with all components
   * @param settings - Configuration settings for the UI
   * @returns ChatUI object with all DOM element references
   */
  static create(settings: EndpointSettings): ChatUI {
    // Create brainigy_sessionId when chat bubble is created
    const sessionId = SessionUtils.getBrainigySessionId();
    
    this.injectStyles(settings);
    const chatContainer = this.createChatContainer(settings);
    const chatBubble = this.createChatBubble(settings);
    const webchatWrapper = this.createWrapper(chatBubble, chatContainer, settings);
    
    document.body.appendChild(webchatWrapper);
    this.setupJumpAnimation(chatBubble, settings);
    
    const ui = {
      webchatWrapper,
      chatBubble,
      chatContainer,
      chat: chatContainer.querySelector<HTMLElement>('#chat')!,
      input: chatContainer.querySelector<HTMLInputElement>('#input')!,
      sendBtn: chatContainer.querySelector<HTMLButtonElement>('#sendBtn')!,
      plusBtn: chatContainer.querySelector<HTMLButtonElement>('#plusBtn') || undefined
    };

    // Restore conversation if it exists for this session
    ConversationManager.restoreConversation(sessionId, ui.chat);
    
    // Setup scroll-to-bottom button
    this.setupScrollButton(ui.chat);
    
    return ui;
  }

  /**
   * Injects CSS custom properties for dynamic styling
   * Converts color settings to CSS variables
   */
  private static injectStyles(settings: EndpointSettings): void {
    // const headerGradient = ColorUtils.createGradient(settings.colors.header);
    // const userMessageGradient = ColorUtils.createGradient(settings.colors.message.user);
    // const botMessageGradient = ColorUtils.createGradient(settings.colors.message.bot);
    // const chatBubbleGradient = ColorUtils.createGradient(settings.colors.chatBubble || settings.colors.header);
    console.log("Injecting styles with settings:", settings)
    const headerGradient = settings.colors.header;
    const userMessageGradient = settings.colors.message.user;
    const botMessageGradient = settings.colors.message.bot;
    const chatBubbleGradient = settings.colors.chatBubble || settings.colors.header;

    const root = document.documentElement;
    root.style.setProperty('--header-bg', headerGradient);
    root.style.setProperty('--user-message-bg', userMessageGradient);
    root.style.setProperty('--bot-message-bg', botMessageGradient);
    root.style.setProperty('--chat-bubble-bg', chatBubbleGradient);
  }

  /**
   * Creates the main chat container with header, chat area, and input
   * @param settings - UI configuration settings
   * @returns The chat container DOM element
   */
  private static createChatContainer(settings: EndpointSettings): HTMLDivElement {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chatContainer';
    
    chatContainer.innerHTML = `
      <div id="header">
        <span class="header-title">${settings.chatbotName}</span>
        <button class="close-btn">${SVG_ASSETS.plus}</button>
      </div>
      <div id="chat" class="chat-box" data-chatbot-name="${settings.chatbotName}">
        <button id="scrollDownBtn" class="scroll-down-btn" style="display: none;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      <div id="inputArea" class="input-area">
        ${settings.additionalInput !== false ? `<button id="plusBtn" class="plus-btn">${SVG_ASSETS.plus}</button>` : ''}
        <input id="input" type="text" placeholder="${settings.inputFieldMessage}" autocomplete="off" />
        <button id="sendBtn">${SVG_ASSETS.airplane}</button>
      </div>
      <div id="actionArea" class="action-area action-hidden">
        <button class="action-btn" id="documentsBtn" title="Documents">${SVG_ASSETS.documents}<span class="action-label">Documents</span></button>
        <button class="action-btn" id="photosBtn" title="Photos">${SVG_ASSETS.photos}<span class="action-label">Photos</span></button>
        <button class="action-btn" id="cameraBtn" title="Camera">${SVG_ASSETS.camera}<span class="action-label">Camera</span></button>
        <button class="action-btn" id="audioFileBtn" title="Audio File">${SVG_ASSETS.audioFile}<span class="action-label">Audio</span></button>
        <button class="action-btn" id="voiceRecordingBtn" title="Voice Recording">${SVG_ASSETS.voiceRecording}<span class="action-label">Voice</span></button>
      </div>
      <div class="powered-by">Powered by Lexoft</div>
    `;

    return chatContainer;
  }

  /**
   * Creates the floating chat bubble with appropriate theme
   * @param settings - UI configuration settings
   * @returns The chat bubble DOM element
   */
  private static createChatBubble(settings: EndpointSettings): HTMLDivElement {
    const chatBubble = document.createElement('div');
    chatBubble.id = 'chatBubble';

    if (settings.chatBubbleTheme === 'theme-chatbubble-pill') {
      const pillText = settings.chatBubblePillMessage || "Default message";
      const smallChatBubbleSVG = SVG_ASSETS.chatBubble.replace('width="20" height="20"', 'width="16" height="16"');
      chatBubble.innerHTML = `
        <div class="chat-bubble-icon">${smallChatBubbleSVG}</div>
        <div class="down-arrow-icon">${SVG_ASSETS.downArrow.replace('width="20" height="20"', 'width="16" height="16"')}</div>
        <span class="pill-text">${pillText}</span>
      `;
    } else {
      chatBubble.innerHTML = `
        <div class="chat-bubble-icon">${SVG_ASSETS.chatBubble}</div>
        <div class="down-arrow-icon">${SVG_ASSETS.downArrow}</div>
      `;
    }

    return chatBubble;
  }

  /**
   * Creates the main wrapper that contains both bubble and container
   * @param chatBubble - The floating chat bubble
   * @param chatContainer - The main chat container
   * @param settings - UI configuration settings
   * @returns The wrapper DOM element
   */
  private static createWrapper(chatBubble: HTMLDivElement, chatContainer: HTMLDivElement, settings: EndpointSettings): HTMLDivElement {
    const webchatWrapper = document.createElement('div');
    webchatWrapper.id = 'webchatWrapper';
    
    const bubbleTheme = settings.chatBubbleTheme || 'theme-chatbubble-default';
    // const containerTheme = settings.chatContainerTheme || 'theme-container-default';
    const containerTheme = settings.chatContainerTheme || 'theme-container-modern';
    webchatWrapper.className = `${bubbleTheme} ${containerTheme}`;
    
    webchatWrapper.appendChild(chatBubble);
    webchatWrapper.appendChild(chatContainer);

    return webchatWrapper;
  }

  /**
   * Sets up the jump animation for the chat bubble
   * Creates attention-grabbing animation if enabled in settings
   */
  private static setupJumpAnimation(chatBubble: HTMLDivElement, settings: EndpointSettings): void {
    if (settings.enableJumpAnimation === false) return;

    let hasBeenClicked = false;
    const jumpDelay = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--jump-delay')) * 1000;
    const jumpDuration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--jump-duration')) * 1000;
    
    const jumpTimer = setTimeout(() => {
      if (!hasBeenClicked) {
        chatBubble.classList.add('jump-animation');
        setTimeout(() => {
          chatBubble.classList.remove('jump-animation');
        }, jumpDuration);
      }
    }, jumpDelay);

    chatBubble.addEventListener('click', () => {
      hasBeenClicked = true;
      clearTimeout(jumpTimer);
    });
  }

  /**
   * Sets up the scroll-to-bottom button functionality
   * Shows button when user scrolls up, hides when at bottom
   */
  private static setupScrollButton(chatElement: HTMLElement): void {
    const scrollDownBtn = chatElement.querySelector<HTMLButtonElement>('#scrollDownBtn');
    
    if (!scrollDownBtn) return;

    // Function to check if user is at bottom of chat
    const isAtBottom = (): boolean => {
      const threshold = 100; // pixels from bottom to consider "at bottom"
      return chatElement.scrollHeight - chatElement.scrollTop - chatElement.clientHeight < threshold;
    };

    // Function to update button visibility
    const updateButtonVisibility = (): void => {
      if (isAtBottom()) {
        scrollDownBtn.style.display = 'none';
      } else {
        scrollDownBtn.style.display = 'flex';
      }
    };

    // Scroll to bottom when button is clicked
    scrollDownBtn.addEventListener('click', () => {
      chatElement.scrollTo({
        top: chatElement.scrollHeight,
        behavior: 'smooth'
      });
    });

    // Update button visibility on scroll
    chatElement.addEventListener('scroll', updateButtonVisibility);

    // Initial check
    updateButtonVisibility();
  }
} 