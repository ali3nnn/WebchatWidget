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
    }
  };
  inputFieldMessage: string;
}

function log(...args: unknown[]) {
  console.log('[webchat.ts]', ...args);
}

function createChatUI(settings: EndpointSettings): ChatUI {

  const style = document.createElement('style');
  style.textContent = `
    #chatContainer #header {
      background: ${settings.colors.header}
    }
    #chatContainer #sendBtn {
      background: ${settings.colors.header}
    }

    #chatContainer #sendBtn:hover {
      opacity: 0.8;
      background: ${settings.colors.header}
    }

    #chatContainer .message.user .bubble {
      background: ${settings.colors.message.user}
    }
  `;
  document.head.appendChild(style);

  const chatContainer = document.createElement('div');
  chatContainer.id = 'chatContainer';
  chatContainer.innerHTML = `
    <div id="header"><span>${settings.chatbotName}</span></div>
    <div id="chat" class="chat-box">
    </div>
    <div id="inputArea" class="input-area">
      <input id="input" type="text" placeholder="${settings.inputFieldMessage}" autocomplete="off" />
      <button id="sendBtn" disabled>Send</button>
    </div>
  `;

  const chatBubble = document.createElement('div');
  chatBubble.id = 'chatBubble';
  chatBubble.textContent = '💬';

  document.body.appendChild(chatBubble);
  document.body.appendChild(chatContainer);

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

function addMessage(
  chatElement: HTMLElement,
  text: string,
  sender: 'user' | 'bot' = 'user',
  quickReplies: string[] = [],
  socket?: Socket,
  ui?: ChatUI
) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${sender}`;

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  if (sender === 'bot' && quickReplies.length > 0 && socket && ui) {
    const qrContainer = document.createElement('div');
    qrContainer.className = 'quick-replies';

    quickReplies.forEach(reply => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = reply;
      btn.addEventListener('click', () => {
        addMessage(ui.chat, reply, 'user');
        socket.emit('message', reply);
        ui.input.value = '';
        ui.input.focus();
      });
      qrContainer.appendChild(btn);
    });

    wrapper.appendChild(qrContainer);
  }

  chatElement.appendChild(wrapper);
  chatElement.scrollTop = chatElement.scrollHeight;
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
      ui.input.focus();
      getOrCreateSocket();
    }
  });
}

declare global {
  interface Window {
    initWebchat?: (url: string) => void;
  }
}

window.initWebchat = initWebchat;