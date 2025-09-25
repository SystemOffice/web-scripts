// Main entry for the modular unified chat widget
import './styles.css';
import { ChatWidgetState } from './state.js';
import { ZoomWidget } from './widgets/zoom.js';
import { AnthologyWidget } from './widgets/anthology.js';
import { ChatbotWidget } from './widgets/chatbot.js';
import { defaultConfig } from './config.js';
import { defaultErrorHandler } from './error-handler.js';
import { defaultLogger } from './logger.js';

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
let widgetRegistry = new Map();
let unifiedButtonContainer = null;
let unifiedButton = null;
let menu = null;

async function initializeWidgets() {
  try {
    defaultLogger.info('Initializing chat widget system');
    const config = await loadClientConfig();

    widgets = [];
    widgetRegistry.clear();

    if (config.zoom?.enabled) {
      const zoomWidget = new ZoomWidget(config.zoom);
      widgets.push(zoomWidget);
      widgetRegistry.set(zoomWidget.id, zoomWidget);
    }

    if (config.anthology?.enabled) {
      const anthologyWidget = new AnthologyWidget(config.anthology);
      widgets.push(anthologyWidget);
      widgetRegistry.set(anthologyWidget.id, anthologyWidget);
    }

    if (config.chatbot?.enabled) {
      const chatbotWidget = new ChatbotWidget(config.chatbot);
      widgets.push(chatbotWidget);
      widgetRegistry.set(chatbotWidget.id, chatbotWidget);
    }

    // Connect widget registry to error handler
    defaultErrorHandler.setWidgetRegistry(widgetRegistry);

    if (widgets.length === 0) {
      defaultLogger.warn('No chat widgets configured for this domain');
      return;
    }

    defaultLogger.info(`Initialized ${widgets.length} widgets: ${widgets.map(w => w.id).join(', ')}`);

    // Mount all widgets
    for (const widget of widgets) {
      try {
        await widget.mount();
      } catch (error) {
        defaultLogger.error(`Failed to mount widget ${widget.id}`, { error: error.message });
      }
    }

    const state = new ChatWidgetState(widgets);
    createUnifiedButton(state);

  } catch (error) {
    defaultLogger.error('Widget system initialization failed', { error: error.message });
    await defaultErrorHandler.handleWidgetError(error, 'system_init');
  }
}

function setUnifiedButtonVisibility(visible) {
  if (unifiedButtonContainer) {
    unifiedButtonContainer.style.display = visible ? 'flex' : 'none';
  }
}

function createUnifiedButton(state) {
  const uiConfig = defaultConfig.get('ui.position');

  unifiedButtonContainer = document.createElement('div');
  unifiedButtonContainer.id = 'chat-widget-container';
  unifiedButtonContainer.style.position = 'fixed';
  unifiedButtonContainer.style.bottom = uiConfig.bottom;
  unifiedButtonContainer.style.right = uiConfig.right;
  unifiedButtonContainer.style.zIndex = uiConfig.zIndex;
  unifiedButtonContainer.style.display = 'flex';
  unifiedButtonContainer.style.flexDirection = 'column';
  unifiedButtonContainer.style.alignItems = 'flex-end';

  unifiedButton = document.createElement('button');
  unifiedButton.id = 'chat-widget-main-btn';
  unifiedButton.innerHTML = '<span class="chat-widget-icon"></span><span class="chat-widget-label">Chat</span>';
  unifiedButton.className = 'chat-widget-btn chat-widget-btn-modern';
  unifiedButton.setAttribute('aria-label', 'Open chat options menu');
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