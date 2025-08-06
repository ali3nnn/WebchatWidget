import { ChatUI, EndpointSettings } from './interfaces';
import { ColorUtils } from './utils';
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
    this.injectStyles(settings);
    const chatContainer = this.createChatContainer(settings);
    const chatBubble = this.createChatBubble(settings);
    const webchatWrapper = this.createWrapper(chatBubble, chatContainer, settings);
    
    document.body.appendChild(webchatWrapper);
    this.setupJumpAnimation(chatBubble, settings);
    
    return {
      webchatWrapper,
      chatBubble,
      chatContainer,
      chat: chatContainer.querySelector<HTMLElement>('#chat')!,
      input: chatContainer.querySelector<HTMLInputElement>('#input')!,
      sendBtn: chatContainer.querySelector<HTMLButtonElement>('#sendBtn')!,
      plusBtn: chatContainer.querySelector<HTMLButtonElement>('#plusBtn')!
    };
  }

  /**
   * Injects CSS custom properties for dynamic styling
   * Converts color settings to CSS variables
   */
  private static injectStyles(settings: EndpointSettings): void {
    const headerGradient = ColorUtils.createGradient(settings.colors.header);
    const userMessageGradient = ColorUtils.createGradient(settings.colors.message.user);
    const botMessageGradient = ColorUtils.createGradient(settings.colors.message.bot);
    const chatBubbleGradient = ColorUtils.createGradient(settings.colors.chatBubble || settings.colors.header);

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
      <div id="chat" class="chat-box" data-chatbot-name="${settings.chatbotName}"></div>
      <div id="inputArea" class="input-area">
        <button id="plusBtn" class="plus-btn">${SVG_ASSETS.plus}</button>
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
    const containerTheme = settings.chatContainerTheme || 'theme-container-default';
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
} 