(function() {
  'use strict';

  // Widget configuration
  const config = window.MOCHA_GPT_CONFIG || {};
  const gptId = config.gptId;
  const publicId = config.publicId;
  const mode = config.mode || 'popup'; // 'popup' or 'inline'
  const targetElement = config.targetElement || 'mocha-gpt-widget';
  const apiBase = config.apiBase || 'https://trafficmagnet.mocha.app';
  const position = config.position || 'bottom-right'; // bottom-right, bottom-left
  const theme = config.theme || {
    primaryColor: '#7C5CFC',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
  };
  const greeting = config.greeting || 'Hi! How can I help you today?';
  const buttonText = config.buttonText || 'Chat';
  const avatar = config.avatar || null;

  let isOpen = false;
  let sessionId = generateSessionId();
  let conversationId = null;
  let widgetContainer = null;
  let chatContainer = null;
  let messagesContainer = null;
  let inputField = null;
  let sendButton = null;

  // Generate unique session ID
  function generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Initialize widget
  function init() {
    if (!gptId && !publicId) {
      console.error('Mocha GPT Widget: gptId or publicId is required');
      return;
    }

    injectStyles();
    
    if (mode === 'popup') {
      createPopupWidget();
    } else {
      createInlineWidget();
    }

    // Track widget load
    trackEvent('widget_loaded');
  }

  // Inject widget styles
  function injectStyles() {
    const styleId = 'mocha-gpt-widget-styles';
    if (document.getElementById(styleId)) return;

    const styles = `
      .mocha-gpt-widget-btn {
        position: fixed;
        ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${theme.primaryColor}, ${adjustColor(theme.primaryColor, -20)});
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        z-index: 999999;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .mocha-gpt-widget-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
      }
      .mocha-gpt-widget-popup {
        position: fixed;
        ${position.includes('bottom') ? 'bottom: 90px;' : 'top: 90px;'}
        ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 120px);
        background: ${theme.backgroundColor};
        border-radius: 16px;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
        z-index: 999998;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.8) translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.3s, opacity 0.3s;
      }
      .mocha-gpt-widget-popup.open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: all;
      }
      .mocha-gpt-widget-inline {
        width: 100%;
        height: 600px;
        background: ${theme.backgroundColor};
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .mocha-gpt-header {
        padding: 16px;
        background: linear-gradient(135deg, ${theme.primaryColor}, ${adjustColor(theme.primaryColor, -20)});
        color: white;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      .mocha-gpt-avatar {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 18px;
      }
      .mocha-gpt-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        object-fit: cover;
      }
      .mocha-gpt-title {
        flex: 1;
        font-weight: 600;
        font-size: 15px;
      }
      .mocha-gpt-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s;
      }
      .mocha-gpt-close:hover {
        opacity: 1;
      }
      .mocha-gpt-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .mocha-gpt-message {
        display: flex;
        gap: 8px;
        max-width: 85%;
        animation: messageSlideIn 0.3s ease;
      }
      @keyframes messageSlideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .mocha-gpt-message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .mocha-gpt-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        color: ${theme.textColor};
      }
      .mocha-gpt-message-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        object-fit: cover;
      }
      .mocha-gpt-message-bubble {
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .mocha-gpt-message.user .mocha-gpt-message-bubble {
        background: ${theme.primaryColor};
        color: white;
      }
      .mocha-gpt-message.assistant .mocha-gpt-message-bubble {
        background: rgba(255, 255, 255, 0.1);
        color: ${theme.textColor};
      }
      .mocha-gpt-input-area {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
      .mocha-gpt-input {
        flex: 1;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 10px 12px;
        color: ${theme.textColor};
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      .mocha-gpt-input:focus {
        border-color: ${theme.primaryColor};
      }
      .mocha-gpt-input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      .mocha-gpt-send {
        background: ${theme.primaryColor};
        border: none;
        border-radius: 8px;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: opacity 0.2s;
        color: white;
      }
      .mocha-gpt-send:hover:not(:disabled) {
        opacity: 0.9;
      }
      .mocha-gpt-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .mocha-gpt-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
      }
      .mocha-gpt-typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        animation: typingBounce 1.4s infinite;
      }
      .mocha-gpt-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .mocha-gpt-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes typingBounce {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-8px);
        }
      }
      @media (max-width: 480px) {
        .mocha-gpt-widget-popup {
          width: calc(100vw - 20px);
          height: calc(100vh - 100px);
          left: 10px !important;
          right: 10px !important;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Adjust color brightness
  function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // Create popup mode widget
  function createPopupWidget() {
    // Create toggle button
    const button = document.createElement('button');
    button.className = 'mocha-gpt-widget-btn';
    button.innerHTML = '💬';
    button.onclick = toggleChat;
    document.body.appendChild(button);

    // Create chat container
    chatContainer = document.createElement('div');
    chatContainer.className = 'mocha-gpt-widget-popup';
    createChatInterface(chatContainer);
    document.body.appendChild(chatContainer);
  }

  // Create inline mode widget
  function createInlineWidget() {
    const targetEl = document.getElementById(targetElement);
    if (!targetEl) {
      console.error('Mocha GPT Widget: Target element not found:', targetElement);
      return;
    }

    chatContainer = document.createElement('div');
    chatContainer.className = 'mocha-gpt-widget-inline';
    createChatInterface(chatContainer);
    targetEl.appendChild(chatContainer);

    // Auto-open for inline mode
    isOpen = true;
    addGreetingMessage();
  }

  // Create chat interface
  function createChatInterface(container) {
    // Header
    const header = document.createElement('div');
    header.className = 'mocha-gpt-header';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'mocha-gpt-avatar';
    if (avatar) {
      const img = document.createElement('img');
      img.src = avatar;
      avatarDiv.appendChild(img);
    } else {
      avatarDiv.textContent = '🤖';
    }
    header.appendChild(avatarDiv);

    const title = document.createElement('div');
    title.className = 'mocha-gpt-title';
    title.textContent = buttonText;
    header.appendChild(title);

    if (mode === 'popup') {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'mocha-gpt-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = toggleChat;
      header.appendChild(closeBtn);
    }

    container.appendChild(header);

    // Messages area
    messagesContainer = document.createElement('div');
    messagesContainer.className = 'mocha-gpt-messages';
    container.appendChild(messagesContainer);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.className = 'mocha-gpt-input-area';

    inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.className = 'mocha-gpt-input';
    inputField.placeholder = 'Type your message...';
    inputField.onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };
    inputArea.appendChild(inputField);

    sendButton = document.createElement('button');
    sendButton.className = 'mocha-gpt-send';
    sendButton.innerHTML = '➤';
    sendButton.onclick = sendMessage;
    inputArea.appendChild(sendButton);

    container.appendChild(inputArea);
  }

  // Toggle chat visibility (popup mode)
  function toggleChat() {
    isOpen = !isOpen;
    chatContainer.classList.toggle('open', isOpen);
    
    if (isOpen) {
      inputField.focus();
      if (messagesContainer.children.length === 0) {
        addGreetingMessage();
      }
      trackEvent('widget_opened');
    } else {
      trackEvent('widget_closed');
    }
  }

  // Add greeting message
  function addGreetingMessage() {
    addMessage('assistant', greeting);
  }

  // Add message to UI
  function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `mocha-gpt-message ${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'mocha-gpt-message-avatar';
    if (role === 'assistant' && avatar) {
      const img = document.createElement('img');
      img.src = avatar;
      avatarDiv.appendChild(img);
    } else {
      avatarDiv.textContent = role === 'user' ? 'U' : '🤖';
    }
    messageDiv.appendChild(avatarDiv);

    const bubble = document.createElement('div');
    bubble.className = 'mocha-gpt-message-bubble';
    bubble.textContent = content;
    messageDiv.appendChild(bubble);

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  // Add typing indicator
  function addTypingIndicator() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mocha-gpt-message assistant';
    messageDiv.id = 'mocha-gpt-typing';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'mocha-gpt-message-avatar';
    avatarDiv.textContent = '🤖';
    messageDiv.appendChild(avatarDiv);

    const typing = document.createElement('div');
    typing.className = 'mocha-gpt-typing';
    typing.innerHTML = '<div class="mocha-gpt-typing-dot"></div><div class="mocha-gpt-typing-dot"></div><div class="mocha-gpt-typing-dot"></div>';
    messageDiv.appendChild(typing);

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const typing = document.getElementById('mocha-gpt-typing');
    if (typing) typing.remove();
  }

  // Scroll to bottom
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message
  async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);
    inputField.value = '';
    sendButton.disabled = true;
    addTypingIndicator();

    try {
      const endpoint = publicId 
        ? `${apiBase}/api/gpt/${publicId}/chat`
        : `${apiBase}/api/gpts/${gptId}/chat`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let messageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.conversation_id && !conversationId) {
                conversationId = parsed.conversation_id;
              }

              if (parsed.content) {
                assistantMessage += parsed.content;
                
                if (!messageAdded) {
                  removeTypingIndicator();
                  const messageDiv = document.createElement('div');
                  messageDiv.className = 'mocha-gpt-message assistant';
                  messageDiv.id = 'mocha-gpt-streaming';

                  const avatarDiv = document.createElement('div');
                  avatarDiv.className = 'mocha-gpt-message-avatar';
                  avatarDiv.textContent = '🤖';
                  messageDiv.appendChild(avatarDiv);

                  const bubble = document.createElement('div');
                  bubble.className = 'mocha-gpt-message-bubble';
                  bubble.textContent = assistantMessage;
                  messageDiv.appendChild(bubble);

                  messagesContainer.appendChild(messageDiv);
                  messageAdded = true;
                } else {
                  const streaming = document.getElementById('mocha-gpt-streaming');
                  if (streaming) {
                    const bubble = streaming.querySelector('.mocha-gpt-message-bubble');
                    if (bubble) bubble.textContent = assistantMessage;
                  }
                }
                scrollToBottom();
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Remove streaming ID
      const streaming = document.getElementById('mocha-gpt-streaming');
      if (streaming) streaming.removeAttribute('id');

      trackEvent('message_sent');
    } catch (error) {
      console.error('Error sending message:', error);
      removeTypingIndicator();
      addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      sendButton.disabled = false;
      inputField.focus();
    }
  }

  // Track analytics event
  function trackEvent(eventType) {
    if (!gptId && !publicId) return;

    const endpoint = publicId
      ? `${apiBase}/api/gpt/${publicId}/track`
      : `${apiBase}/api/gpts/${gptId}/track`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silent fail
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
