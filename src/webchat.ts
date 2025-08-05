// webchat.ts
import { io, Socket } from 'socket.io-client';
import cssText from './style.css';

// SVG constants (moved to top of file)
const airplaneSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chatBubbleSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const plusSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const downArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const photosSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
  <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const documentsSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const cameraSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2"/>
  <path d="M12 11V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 13H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const audioFileSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 13H10L12 11V17L10 15H8V13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const voiceRecordingSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 1A3 3 0 0 0 9 4V10A3 3 0 0 0 15 10V4A3 3 0 0 0 12 1Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19 10V14A7 7 0 0 1 5 14V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 19V23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 23H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function injectCSS(css: string) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

injectCSS(cssText);

interface ChatUI {
  webchatWrapper: HTMLDivElement;
  chatBubble: HTMLDivElement;
  chatContainer: HTMLDivElement;
  chat: HTMLElement;
  input: HTMLInputElement;
  sendBtn: HTMLButtonElement;
  plusBtn: HTMLButtonElement;
}

interface EndpointSettings {
  flow: string;
  chatbotName: string;
  colors: {
    header: string;
    message: {
      user: string;
    };
    chatBubble?: string;
  };
  inputFieldMessage: string;
  sendButton: string;
  chatBubbleMessage?: string;
  chatBubblePillMessage?: string;
  chatBubbleTheme?: string;
  chatContainerTheme?: string;
  enableJumpAnimation?: boolean;
}

function log(...args: unknown[]) {
  console.log('[webchat.ts]', ...args);
}

function createChatUI(settings: EndpointSettings): ChatUI {

  // Helper function to create gradient from a single color
  const createGradient = (color: string) => {
    // If it's already a gradient, return as is
    if (color.includes('gradient') || color.includes('linear-gradient')) {
      return color;
    }
    
    // Handle HSL colors
    if (color.includes('hsl')) {
      const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (hslMatch) {
        const [, h, s, l] = hslMatch;
        const hue = parseInt(h);
        const saturation = parseInt(s);
        const lightness = parseInt(l);
        
        // Create 20% lighter version
        const lighterLightness = Math.min(100, lightness * 1.4);
        
        return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lighterLightness}%) 0%, ${color} 100%)`;
      }
    }
    
    // Handle hex colors (fallback)
    const lighterColor = color.replace('#', '').match(/.{2}/g)?.map(hex => {
      const num = parseInt(hex, 16);
      const lighter = Math.min(255, num + Math.round(num * 0.2));
      return lighter.toString(16).padStart(2, '0');
    }).join('') || color;
    
    return `linear-gradient(135deg, #${lighterColor} 0%, ${color} 100%)`;
  };

  const headerGradient = createGradient(settings.colors.header);
  const userMessageGradient = createGradient(settings.colors.message.user);
  const chatBubbleGradient = createGradient(settings.colors.chatBubble || settings.colors.header);

  // Update CSS root variables
  const root = document.documentElement;
  root.style.setProperty('--header-bg', headerGradient);
  root.style.setProperty('--user-message-bg', userMessageGradient);
  root.style.setProperty('--chat-bubble-bg', chatBubbleGradient);
  
  // Set default colors from settings
  root.style.setProperty('--header-default-bg', settings.colors.header);
  root.style.setProperty('--user-message-default-bg', settings.colors.message.user);
  root.style.setProperty('--chat-bubble-default-bg', settings.colors.chatBubble || settings.colors.header);

  const chatContainer = document.createElement('div');
  chatContainer.id = 'chatContainer';

  // Check if we're on mobile (width < 600px)
  const isMobile = window.innerWidth < 600;

  // chatContainer.classList.add('webchat-visible'); // TODO: remove this
  
  chatContainer.innerHTML = `
    <div id="header">
      <span class="header-title">${settings.chatbotName}</span>
      <button class="close-btn">
        ${plusSVG}
      </button>
    </div>
    <div id="chat" class="chat-box" data-chatbot-name="${settings.chatbotName}">
    </div>
    <div id="inputArea" class="input-area">
      <button id="plusBtn" class="plus-btn">
        ${plusSVG}
      </button>
      <input id="input" type="text" placeholder="${settings.inputFieldMessage}" autocomplete="off" />
      <button id="sendBtn">
        ${airplaneSVG}
      </button>
    </div>
    <div id="actionArea" class="action-area action-hidden">
      <button class="action-btn" id="documentsBtn" title="Documents">
        ${documentsSVG}
        <span class="action-label">Documents</span>
      </button>
      <button class="action-btn" id="photosBtn" title="Photos">
        ${photosSVG}
        <span class="action-label">Photos</span>
      </button>
      <button class="action-btn" id="cameraBtn" title="Camera">
        ${cameraSVG}
        <span class="action-label">Camera</span>
      </button>
      <button class="action-btn" id="audioFileBtn" title="Audio File">
        ${audioFileSVG}
        <span class="action-label">Audio</span>
      </button>
      <button class="action-btn" id="voiceRecordingBtn" title="Voice Recording">
        ${voiceRecordingSVG}
        <span class="action-label">Voice</span>
      </button>
    </div>
    <div class="powered-by">Powered by Lexoft</div>
  `;

  // settings.chatBubbleMessage = 'Need help? Chat with us!'

  const chatBubble = document.createElement('div');
  chatBubble.id = 'chatBubble';
  chatBubble.innerHTML = `
    <div class="chat-bubble-icon">${chatBubbleSVG}</div>
    <div class="down-arrow-icon">${downArrowSVG}</div>
  `;

  // If using pill theme, add text content
  if (settings.chatBubbleTheme === 'theme-chatbubble-pill') {
    const pillText = settings.chatBubblePillMessage || "Default message";
    const smallChatBubbleSVG = chatBubbleSVG.replace('width="20" height="20"', 'width="16" height="16"');
    chatBubble.innerHTML = `
      <div class="chat-bubble-icon">${smallChatBubbleSVG}</div>
      <div class="down-arrow-icon">${downArrowSVG.replace('width="20" height="20"', 'width="16" height="16"')}</div>
      <span class="pill-text">${pillText}</span>
    `;
  }

  // Create wrapper container for both chat bubble and chat container
  const webchatWrapper = document.createElement('div');
  webchatWrapper.id = 'webchatWrapper';
  
  // Apply themes - default to circle bubble and small container
  const bubbleTheme = settings.chatBubbleTheme || 'theme-chatbubble-default';
  const containerTheme = settings.chatContainerTheme || 'theme-container-default';
  webchatWrapper.className = `${bubbleTheme} ${containerTheme}`;
  
  // Add both elements to the wrapper
  webchatWrapper.appendChild(chatBubble);
  webchatWrapper.appendChild(chatContainer);

  document.body.appendChild(webchatWrapper);

  // Add jump animation after delay if not clicked
  let hasBeenClicked = false;
  
  // Get timing from CSS variables
  const jumpDelay = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--jump-delay')) * 1000;
  const jumpDuration = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--jump-duration')) * 1000;
  
  // Only add jump animation if enabled in settings
  if (settings.enableJumpAnimation !== false) { // Default to true if not specified
    const jumpTimer = setTimeout(() => {
      if (!hasBeenClicked) {
        chatBubble.classList.add('jump-animation');
        
        // Remove jump-animation class after duration
        setTimeout(() => {
          chatBubble.classList.remove('jump-animation');
        }, jumpDuration);
      }
    }, jumpDelay);

    // Track if chat bubble has been clicked
    chatBubble.addEventListener('click', () => {
      hasBeenClicked = true;
      clearTimeout(jumpTimer);
    });
  }

  // Add close button functionality for mobile
  if (isMobile) {
    const closeBtn = chatContainer.querySelector('.close-btn') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        webchatWrapper.classList.remove('webchat-visible');
        chatBubble.classList.remove('stop-animation');
      });
    }
  }

  return {
    webchatWrapper,
    chatContainer,
    chat: chatContainer.querySelector<HTMLElement>('#chat')!,
    input: chatContainer.querySelector<HTMLInputElement>('#input')!,
    sendBtn: chatContainer.querySelector<HTMLButtonElement>('#sendBtn')!,
    plusBtn: chatContainer.querySelector<HTMLButtonElement>('#plusBtn')!,
    chatBubble
  };
}

function updateChatBubbleIcon(chatBubble: HTMLDivElement, settings: EndpointSettings) {
  // The icons are now always present in the DOM, visibility is controlled by CSS
  // No need to update innerHTML, just ensure the structure is correct
  const isOpen = chatBubble.classList.contains('chat-open');
  
  if (settings.chatBubbleTheme === 'theme-chatbubble-pill') {
    const pillText = settings.chatBubblePillMessage || "Default message";
    const smallChatBubbleSVG = chatBubbleSVG.replace('width="20" height="20"', 'width="16" height="16"');
    const smallDownArrowSVG = downArrowSVG.replace('width="20" height="20"', 'width="16" height="16"');
    
    chatBubble.innerHTML = `
      <div class="chat-bubble-icon">${smallChatBubbleSVG}</div>
      <div class="down-arrow-icon">${smallDownArrowSVG}</div>
      <span class="pill-text">${pillText}</span>
    `;
  } else {
    chatBubble.innerHTML = `
      <div class="chat-bubble-icon">${chatBubbleSVG}</div>
      <div class="down-arrow-icon">${downArrowSVG}</div>
    `;
  }
}

function setupSocketConnection(basePath: string, endpointID: string, ui: ChatUI): Socket {
  const socket = io(basePath, {
    auth: { endpoint: endpointID },
    reconnectionAttempts: 3,
    reconnectionDelay: 2000
  });

  socket.on('connect', () => {
    log('✅ Connected');
    ui.sendBtn.disabled = false;
  });

  socket.on('disconnect', () => {
    log('❌ Disconnected');
    ui.sendBtn.disabled = true;
  });

  socket.on('connect_error', (err: Error) => {
    log('⚠️ Connection Error:', err.message);
  });

  socket.on('message', (msg: { text: string; quickReplies?: string[] }) => {
    if (!msg || typeof msg.text !== 'string') {
      console.warn('Invalid message format:', msg);
      return;
    }
    addMessage(ui.chat, msg.text, 'bot', msg.quickReplies || [], socket, ui);
  });

  return socket;
}

// Global message queue for typewriter effect
let messageQueue: Array<{
  chatElement: HTMLElement;
  text: string;
  sender: 'user' | 'bot';
  quickReplies: string[];
  socket?: Socket;
  ui?: ChatUI;
}> = [];
let isTyping = false;

function addMessage(
  chatElement: HTMLElement,
  text: string,
  sender: 'user' | 'bot' = 'user',
  quickReplies: string[] = [],
  socket?: Socket,
  ui?: ChatUI
) {
  // Add message to queue
  messageQueue.push({
    chatElement,
    text,
    sender,
    quickReplies,
    socket,
    ui
  });

  // Process queue if not currently typing
  if (!isTyping) {
    processMessageQueue();
  }
}

function processMessageQueue() {
  if (messageQueue.length === 0 || isTyping) {
    return;
  }

  const message = messageQueue.shift()!;
  isTyping = true;

  const wrapper = document.createElement('div');
  wrapper.className = `message ${message.sender}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  if (message.sender === 'bot') {
    // Add typewriter effect for bot messages
    typewriterEffect(bubble, message.text, () => {
      // Add quick replies after typing is complete
      if (message.quickReplies.length > 0 && message.socket && message.ui) {
        const qrContainer = document.createElement('div');
        qrContainer.className = 'quick-replies';

        message.quickReplies.forEach(reply => {
          const btn = document.createElement('button');
          btn.className = 'quick-reply-btn';
          btn.textContent = reply;
          btn.addEventListener('click', () => {
            addMessage(message.ui!.chat, reply, 'user');
            message.socket!.emit('message', reply);
            message.ui!.input.value = '';
            message.ui!.input.focus();
          });
          qrContainer.appendChild(btn);
        });

        wrapper.appendChild(qrContainer);
      }

      // Mark typing as complete and process next message
      isTyping = false;
      processMessageQueue();
    });
  } else {
    // User messages appear immediately
    bubble.textContent = message.text;
    isTyping = false;
    processMessageQueue();
  }

  wrapper.appendChild(bubble);
  message.chatElement.appendChild(wrapper);
  message.chatElement.scrollTop = message.chatElement.scrollHeight;
}

function typewriterEffect(element: HTMLElement, text: string, onComplete?: () => void) {
  let index = 0;
  const speed = 20; // milliseconds per character

  function typeNextChar() {
    if (index < text.length) {
      element.textContent += text[index];
      index++;

      // Auto-scroll to bottom as text is being typed
      const chatElement = element.closest('#chat');
      if (chatElement) {
        chatElement.scrollTop = chatElement.scrollHeight;
      }

      setTimeout(typeNextChar, speed);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  }

  // Start typing
  typeNextChar();
}

function attachEventListeners(ui: ChatUI, socket: Socket) {
  ui.sendBtn.addEventListener('click', () => sendMessage(ui, socket));
  ui.input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage(ui, socket);
  });

  // ui.chatBubble.addEventListener('click', () => {
  //   const isOpen = ui.chatContainer.style.display === 'flex';
  //   ui.chatContainer.style.display = isOpen ? 'none' : 'flex';
  //   if (!isOpen) ui.input.focus();
  // });

}

function setupDevTestMode(ui: ChatUI) {
  // Simulate initial bot message
  setTimeout(() => {
    addMessage(ui.chat, "Hello! I'm a dev test bot. How can I help you today?", 'bot', ['Tell me more', 'What can you do?', 'Goodbye']);
  }, 1000);

  // Add event listeners for dev test mode
  ui.sendBtn.addEventListener('click', () => handleDevTestMessage(ui));
  ui.input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleDevTestMessage(ui);
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

  // Close button functionality for dev test mode
  const closeBtn = ui.chatContainer.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      ui.webchatWrapper.classList.remove('webchat-visible');
      ui.chatBubble.classList.remove('chat-open');
    });
  }

  // Plus button functionality for dev test mode
  ui.plusBtn.addEventListener('click', () => {
    const actionArea = document.getElementById('actionArea');
    if (actionArea) {
      // Toggle the action-hidden class
      actionArea.classList.toggle('action-hidden');
      
      // Toggle the rotated class based on whether action area is now visible
      const isHidden = actionArea.classList.contains('action-hidden');
      if (isHidden) {
        ui.plusBtn.classList.remove('rotated');
      } else {
        ui.plusBtn.classList.add('rotated');
      }
    }
  });
}

function handleDevTestMessage(ui: ChatUI) {
  const text = ui.input.value.trim();
  if (!text) return;
  
  // Add user message
  addMessage(ui.chat, text, 'user');
  ui.input.value = '';
  ui.input.focus();

  // Simulate bot response
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
    
    addMessage(ui.chat, randomResponse, 'bot', quickReplies);
  },  Math.random() * 1000); // Random delay between 1-3 seconds
}

function sendMessage(ui: ChatUI, socket: Socket) {
  const text = ui.input.value.trim();
  if (!text) return;
  addMessage(ui.chat, text, 'user');
  socket.emit('message', text);
  ui.input.value = '';
  ui.input.focus();
}

export async function initWebchat(endpointURL: string) {
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

  // Check if we're in dev test mode
  const isDevTestMode = endpointID === 'DEV_TEST_MODE';
  
  if (isDevTestMode) {
    log('🧪 Initializing Webchat in DEV_TEST_MODE');
    const devSettings = {
      flow: "dev-test",
      chatbotName: "Dev Test Bot",
      colors: {
        header: "#667eea",
        message: {
          user: "#667eea"
        }
      },
      inputFieldMessage: "Type your message...",
      sendButton: "Send",
      chatBubbleTheme: 'theme-chatbubble-modern',
      chatContainerTheme: 'theme-container-modern',
      enableJumpAnimation: false
    };
    
    const ui = createChatUI(devSettings);
    setupDevTestMode(ui);
    return;
  }

  let endpointSettings;
  try {
    const response = await fetch(endpointURL);
    if (!response.ok) {
      throw new Error(`GET request failed with status ${response.status}`);
    }
    const data = await response.json();
    endpointSettings = {
      ...data.settings,
      // enableJumpAnimation: false,
      // chatBubbleTheme: 'theme-chatbubble-circle',
      // chatBubbleTheme: 'theme-chatbubble-pill',
      // chatBubbleTheme: 'theme-chatbubble-modern',
      // chatContainerTheme: 'theme-container-big',
      // chatContainerTheme: 'theme-container-small',
      // chatContainerTheme: 'theme-container-modern',
      // chatBubblePillMessage: 'Need help? Chat with us!'
    };
  } catch (error) {
    console.error('❌ Error making GET request:', error);
    return;
  }

  log('Initializing Webchat');

  const ui = createChatUI(endpointSettings);
  let socket: Socket | null = null;

  const getOrCreateSocket = (): Socket => {
    if (socket) return socket;
    socket = setupSocketConnection(basePath, endpointID, ui);
    attachEventListeners(ui, socket);
    return socket;
  };

  // Add event listeners
  ui.chatBubble.addEventListener('click', () => {
    ui.webchatWrapper.classList.toggle('webchat-visible');
    const isOpen = ui.webchatWrapper.classList.contains('webchat-visible');

    if (isOpen) {
      ui.chatBubble.classList.add('chat-open'); // Changed from stop-animation
      ui.input.focus();
      getOrCreateSocket();
    } else {
      ui.chatBubble.classList.remove('chat-open'); // Changed from stop-animation
    }
    
    // Update the chat bubble icon (this call now primarily toggles the 'chat-open' class)
    updateChatBubbleIcon(ui.chatBubble, endpointSettings);
  });

  // Close button functionality
  const closeBtn = ui.chatContainer.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      ui.webchatWrapper.classList.remove('webchat-visible');
      ui.chatBubble.classList.remove('chat-open');
      updateChatBubbleIcon(ui.chatBubble, endpointSettings);
    });
  }

  // Plus button functionality
  ui.plusBtn.addEventListener('click', () => {
    const actionArea = document.getElementById('actionArea');
    if (actionArea) {
      // Toggle the action-hidden class
      actionArea.classList.toggle('action-hidden');
      
      // Toggle the rotated class based on whether action area is now visible
      const isHidden = actionArea.classList.contains('action-hidden');
      if (isHidden) {
        ui.plusBtn.classList.remove('rotated');
      } else {
        ui.plusBtn.classList.add('rotated');
      }
    }
  });
}

declare global {
  interface Window {
    initWebchat?: (url: string) => void;
  }
}

window.initWebchat = initWebchat;