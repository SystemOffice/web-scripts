// Main entry for the modular unified chat widget
import './styles.css';
import { ChatWidgetState } from './state.js';
import { ZoomWidget } from './widgets/zoom.js';
import { AnthologyWidget } from './widgets/anthology.js';
import { ChatbotWidget } from './widgets/chatbot.js';
import { LinkWidget } from './widgets/link.js';
import { defaultConfig } from './config.js';
import { defaultErrorHandler } from './error-handler.js';
import { defaultLogger } from './logger.js';
import { mountAllWidgets } from './mount-widgets.js';
import { loadClientConfig } from './fetch-config.js';

function getClientConfig() {
  const configService = defaultConfig.get('configService');
  return loadClientConfig(window, configService.baseUrl, configService.timeout);
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
    const config = await getClientConfig();

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

    if (config.links?.length) {
      for (const linkConfig of config.links) {
        if (!linkConfig.enabled) continue;
        const linkWidget = new LinkWidget(linkConfig);
        widgets.push(linkWidget);
      }
    }

    // Sort widgets by order property (if specified), otherwise maintain default order
    widgets.sort((a, b) => {
      const orderA = a.config?.order ?? 999;
      const orderB = b.config?.order ?? 999;
      return orderA - orderB;
    });

    // Connect widget registry to error handler
    defaultErrorHandler.setWidgetRegistry(widgetRegistry);

    if (widgets.length === 0) {
      defaultLogger.warn('No chat widgets configured for this domain');
      return;
    }

    defaultLogger.info(`Initialized ${widgets.length} widgets: ${widgets.map(w => w.id).join(', ')}`);

    const mountableWidgets = widgets.filter(w => typeof w.mount === 'function');
    await mountAllWidgets(mountableWidgets, defaultLogger);

    const statefulWidgets = widgets.filter(w => !w.url);
    const state = new ChatWidgetState(statefulWidgets);
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

// --- Menu state helpers ---

function isMenuOpen() {
  return menu.style.display === 'block';
}

function openMenu() {
  menu.style.display = 'block';
  unifiedButton.setAttribute('aria-expanded', 'true');

  const firstItem = menu.querySelector('[role="menuitem"]');
  if (firstItem) firstItem.focus();
}

function closeMenu() {
  menu.style.display = 'none';
  unifiedButton.setAttribute('aria-expanded', 'false');
}

function toggleMenu() {
  if (isMenuOpen()) {
    closeMenu();
  } else {
    openMenu();
  }
}

// --- Keyboard handlers ---

function handleButtonKeydown(event) {
  if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    openMenu();
    return;
  }

  if (event.key === 'Escape' && isMenuOpen()) {
    event.preventDefault();
    closeMenu();
    unifiedButton.focus();
  }
}

function handleMenuKeydown(event) {
  const items = [...menu.querySelectorAll('[role="menuitem"]')];
  const index = items.indexOf(document.activeElement);

  const keyActions = {
    'Escape': () => { closeMenu(); unifiedButton.focus(); },
    'Home': () => items[0]?.focus(),
    'End': () => items[items.length - 1]?.focus(),
    'ArrowDown': () => items[(index + 1) % items.length]?.focus(),
    'ArrowUp': () => items[(index - 1 + items.length) % items.length]?.focus(),
  };

  const action = keyActions[event.key];
  if (!action) return;

  event.preventDefault();
  action();
}

function setupOutsideClickHandler() {
  document.addEventListener('click', (event) => {
    if (!isMenuOpen()) return;
    if (unifiedButtonContainer.contains(event.target)) return;
    closeMenu();
  });
}

// --- DOM creation helpers ---

function createContainer(uiConfig) {
  const container = document.createElement('div');
  container.id = 'chat-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = uiConfig.bottom;
  container.style.right = uiConfig.right;
  container.style.zIndex = uiConfig.zIndex;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end';
  return container;
}

function createMainButton() {
  const button = document.createElement('button');
  button.id = 'chat-widget-main-btn';
  button.innerHTML = '<span class="chat-widget-icon"></span><span class="chat-widget-label">Chat</span>';
  button.className = 'chat-widget-btn chat-widget-btn-modern';
  button.setAttribute('aria-label', 'Open chat options menu');
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', toggleMenu);
  button.addEventListener('keydown', handleButtonKeydown);
  return button;
}

function createMenuItem(widget, state) {
  const item = document.createElement('button');
  item.innerText = widget.displayName;
  item.className = 'chat-widget-menu-item chat-widget-menu-item-modern';
  item.setAttribute('role', 'menuitem');
  item.setAttribute('tabindex', '0');

  if (widget.url) {
    item.onclick = () => {
      widget.open();
      closeMenu();
    };
  } else {
    item.onclick = () => {
      closeMenu();
      setUnifiedButtonVisibility(false);
      state.activateWidget(widget.id, () => setUnifiedButtonVisibility(true));
    };
  }

  return item;
}

function createMenuElement(state) {
  const menuElement = document.createElement('div');
  menuElement.id = 'chat-widget-menu';
  menuElement.style.display = 'none';
  menuElement.className = 'chat-widget-menu chat-widget-menu-modern';
  menuElement.setAttribute('role', 'menu');
  menuElement.setAttribute('aria-label', 'Chat options');

  widgets.forEach(widget => {
    menuElement.appendChild(createMenuItem(widget, state));
  });

  menuElement.addEventListener('keydown', handleMenuKeydown);
  return menuElement;
}

// --- Main UI assembly ---

function createUnifiedButton(state) {
  const uiConfig = defaultConfig.get('ui.position');

  unifiedButtonContainer = createContainer(uiConfig);
  unifiedButton = createMainButton();
  menu = createMenuElement(state);

  unifiedButtonContainer.appendChild(unifiedButton);
  unifiedButtonContainer.appendChild(menu);
  document.body.appendChild(unifiedButtonContainer);

  setupOutsideClickHandler();
}

window.addEventListener('DOMContentLoaded', initializeWidgets); 