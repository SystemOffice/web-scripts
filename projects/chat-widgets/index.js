// Main entry for the modular unified chat widget
import './styles.css';
import { ChatWidgetState } from './state.js';
import { ZoomWidget } from './widgets/zoom.js';
import { AnthologyWidget } from './widgets/anthology.js';
import { ChatbotWidget } from './widgets/chatbot.js';

// Domain-based configuration loading
async function loadClientConfig() {
  const domain = window.location.hostname;
  
  // Check for client-provided config first
  if (window.CHAT_WIDGET_CONFIG) {
    return window.CHAT_WIDGET_CONFIG;
  }
  
  // Fallback: try to load from config service
  try {
    const response = await fetch(`https://your-config-service.com/config/${domain}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Could not load client config, using defaults');
  }
  
  // Default config (for demo/testing)
  return {
    zoom: { enabled: false },
    anthology: { enabled: false },
    chatbot: { enabled: false }
  };
}

// Initialize widgets with client config
let widgets = [];
let unifiedButtonContainer = null;
let unifiedButton = null;
let menu = null;

async function initializeWidgets() {
  const config = await loadClientConfig();
  
  widgets = [];
  
  if (config.zoom?.enabled) {
    widgets.push(new ZoomWidget(config.zoom));
  }
  
  if (config.anthology?.enabled) {
    widgets.push(new AnthologyWidget(config.anthology));
  }
  
  if (config.chatbot?.enabled) {
    widgets.push(new ChatbotWidget(config.chatbot));
  }
  
  if (widgets.length === 0) {
    console.warn('No chat widgets configured for this domain');
    return;
  }
  
  const state = new ChatWidgetState(widgets);
  createUnifiedButton(state);
}

function setUnifiedButtonVisibility(visible) {
  if (unifiedButtonContainer) {
    unifiedButtonContainer.style.display = visible ? 'flex' : 'none';
  }
}

function createUnifiedButton(state) {
  unifiedButtonContainer = document.createElement('div');
  unifiedButtonContainer.id = 'chat-widget-container';
  unifiedButtonContainer.style.position = 'fixed';
  unifiedButtonContainer.style.bottom = '32px';
  unifiedButtonContainer.style.right = '32px';
  unifiedButtonContainer.style.zIndex = '9999';
  unifiedButtonContainer.style.display = 'flex';
  unifiedButtonContainer.style.flexDirection = 'column';
  unifiedButtonContainer.style.alignItems = 'flex-end';

  unifiedButton = document.createElement('button');
  unifiedButton.id = 'chat-widget-main-btn';
  unifiedButton.innerHTML = '<span class="chat-widget-icon"></span><span class="chat-widget-label">Chat</span>';
  unifiedButton.className = 'chat-widget-btn chat-widget-btn-modern';
  unifiedButton.onclick = () => {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  };

  menu = document.createElement('div');
  menu.id = 'chat-widget-menu';
  menu.style.display = 'none';
  menu.className = 'chat-widget-menu chat-widget-menu-modern';

  widgets.forEach(widget => {
    const item = document.createElement('button');
    item.innerText = widget.displayName;
    item.className = 'chat-widget-menu-item chat-widget-menu-item-modern';
    item.onclick = () => {
      setUnifiedButtonVisibility(false);
      state.activateWidget(widget.id, () => setUnifiedButtonVisibility(true));
      menu.style.display = 'none';
    };
    menu.appendChild(item);
  });

  unifiedButtonContainer.appendChild(unifiedButton);
  unifiedButtonContainer.appendChild(menu);
  document.body.appendChild(unifiedButtonContainer);
}

window.addEventListener('DOMContentLoaded', initializeWidgets); 