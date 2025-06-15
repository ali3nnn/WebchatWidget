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

function log(...args: unknown[]) {
  console.log('[webchat.ts]', ...args);
}

function createChatUI(): ChatUI {
  const chatContainer = document.createElement('div');
  chatContainer.id = 'chatContainer';
  chatContainer.style.display = 'none';
  chatContainer.innerHTML = `
    <div id="chat" class="chat-box"></div>
    <div id="inputArea" class="input-area">
      <input id="input" type="text" placeholder="Type your message..." autocomplete="off" />
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

  ui.chatBubble.addEventListener('click', () => {
    const isOpen = ui.chatContainer.style.display === 'flex';
    ui.chatContainer.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen) ui.input.focus();
  });
}

function sendMessage(ui: ChatUI, socket: Socket) {
  const text = ui.input.value.trim();
  if (!text) return;
  addMessage(ui.chat, text, 'user');
  socket.emit('message', text);
  ui.input.value = '';
  ui.input.focus();
}

export function initWebchat(endpointURL: string) {
  if (!endpointURL) {
    console.error('⚠️ You must provide the full WebSocket URL to initWebchat()');
    return;
  }

  const url = new URL(endpointURL);
  const basePath = url.origin + url.pathname;
  const params = Object.fromEntries(url.searchParams.entries());

  if (!params.endpointID) {
    console.error('⚠️ Missing "endpointID" in the query parameters.');
    return;
  }

  log('Initializing Webchat');

  const ui = createChatUI();
  const socket = setupSocketConnection(basePath, params.endpointID, ui);
  attachEventListeners(ui, socket);
}

declare global {
  interface Window {
    initWebchat?: (url: string) => void;
  }
}

window.initWebchat = initWebchat;