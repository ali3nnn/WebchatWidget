// webchat.ts
import { io, Socket } from 'socket.io-client';
import cssText from './style.css';

function injectCSS(css: string) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

injectCSS(cssText);

type ChatUI = {
  chatContainer: HTMLDivElement;
  chat: HTMLElement;
  input: HTMLInputElement;
  sendBtn: HTMLButtonElement;
  chatBubble: HTMLDivElement;
};

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
        const lighterLightness = Math.min(100, lightness * 1.9);
        
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

  const style = document.createElement('style');
  style.textContent = `
    #chatContainer #header {
      background: ${headerGradient}
    }
    #chatContainer #sendBtn {
      background: ${headerGradient}
    }

    #chatContainer #sendBtn:hover {
      opacity: 0.8;
      background: ${headerGradient}
    }

    #chatContainer .message.user .bubble {
      background: ${userMessageGradient}
    }

    #chatBubble {
      background: ${chatBubbleGradient} !important;
    }
  `;
  document.head.appendChild(style);

  const chatContainer = document.createElement('div');
  chatContainer.id = 'chatContainer';
  
  // Check if we're on mobile (width < 600px)
  const isMobile = window.innerWidth < 600;
  
  chatContainer.innerHTML = `
    <div id="header">
      <span>${settings.chatbotName}</span>
      ${isMobile ? '<button class="close-btn">×</button>' : ''}
    </div>
    <div id="chat" class="chat-box">
    </div>
    <div id="inputArea" class="input-area">
      <input id="input" type="text" placeholder="${settings.inputFieldMessage}" autocomplete="off" />
      <button id="sendBtn" disabled>${settings.sendButton}</button>
    </div>
  `;

  const chatBubble = document.createElement('div');
  chatBubble.id = 'chatBubble';
  chatBubble.textContent = '💬';

  document.body.appendChild(chatBubble);
  document.body.appendChild(chatContainer);

  // Add close button functionality for mobile
  if (isMobile) {
    const closeBtn = chatContainer.querySelector('.close-btn') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        chatContainer.classList.remove('webchat-visible');
        chatBubble.classList.remove('stop-animation');
      });
    }
  }

  return {
    chatContainer,
    chat: chatContainer.querySelector<HTMLElement>('#chat')!,
    input: chatContainer.querySelector<HTMLInputElement>('#input')!,
    sendBtn: chatContainer.querySelector<HTMLButtonElement>('#sendBtn')!,
    chatBubble
  };
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
  // const basePath = url.origin + url.pathname;
  const basePath = url.origin;
  // const { endpointID } = Object.fromEntries(url.searchParams.entries());
  const endpointID = url.pathname.replace("/", "");

  if (!endpointID) {
    console.error('⚠️ Missing "endpointID" in the query parameters.');
    return;
  }

  let endpointSettings;
  try {
    const response = await fetch(endpointURL);
    if (!response.ok) {
      throw new Error(`GET request failed with status ${response.status}`);
    }
    const data = await response.json();
    endpointSettings = data.settings;
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

  ui.chatBubble.addEventListener('click', () => {
    ui.chatContainer.classList.toggle('webchat-visible');
    const isOpen = ui.chatContainer.classList.contains('webchat-visible');
    
    if (isOpen) {
      ui.chatBubble.classList.add('stop-animation');
      ui.input.focus();
      getOrCreateSocket();
    } else {
      ui.chatBubble.classList.remove('stop-animation');
    }
  });
}

declare global {
  interface Window {
    initWebchat?: (url: string) => void;
  }
}

window.initWebchat = initWebchat;