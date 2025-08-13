// CSS Styles (injected as style tag)
(function() {
  "use strict";
  
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `#chat-widget-container {
  font-family: 'Segoe UI', Arial, sans-serif;
}

.chat-widget-btn {
  background: #31435d;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(80, 80, 180, 0.18), 0 1.5px 6px rgba(0,0,0,0.08);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  position: relative;
  outline: none;
  padding: 0;
}

.chat-widget-btn-modern .chat-widget-icon::before {
  content: '\\1F4AC'; /* 💬 */
  font-size: 36px;
  display: block;
}

.chat-widget-btn-modern .chat-widget-label {
  display: none;
}

.chat-widget-btn:hover, .chat-widget-btn:focus {
  background: #a20b34;
  box-shadow: 0 8px 32px rgba(80, 80, 180, 0.22), 0 2px 8px rgba(0,0,0,0.10);
  transform: scale(1.06);
}

.chat-widget-menu {
  display: block;
  position: absolute;
  bottom: 80px;
  right: 0;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(80, 80, 180, 0.12), 0 1.5px 6px rgba(0,0,0,0.08);
  min-width: 220px;
  padding: 12px 0;
  z-index: 10000;
  animation: fadeInMenu 0.18s;
}

@keyframes fadeInMenu {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-widget-menu-item {
  display: block;
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 16px 32px;
  font-size: 17px;
  color: #333;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  border-radius: 0;
}

.chat-widget-menu-item-modern {
  font-weight: 500;
  letter-spacing: 0.01em;
}

.chat-widget-menu-item:hover, .chat-widget-menu-item:focus {
  background: linear-gradient(90deg, #f3f3fd 0%, #eaf6ff 100%);
  color: #2575fc;
}

/* Demo overlay for widget simulation */
.chat-widget-demo-overlay {
  position: fixed;
  bottom: 100px;
  right: 40px;
  width: 340px;
  height: 420px;
  background: rgba(30, 34, 90, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(80, 80, 180, 0.18);
}

.chat-widget-demo-box {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  padding: 32px 24px 24px 24px;
  text-align: center;
  width: 90%;
  max-width: 300px;
  font-size: 18px;
  color: #333;
  position: relative;
}

.chat-widget-demo-box.zoom { border-top: 4px solid #2575fc; }
.chat-widget-demo-box.anthology { border-top: 4px solid #830065; }
.chat-widget-demo-box.chatbot { border-top: 4px solid #1e90ff; }

.chat-widget-demo-close {
  margin-top: 24px;
  background: #2575fc;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.18s;
}

.chat-widget-demo-close:hover {
  background: #6a11cb;
} `;
    document.head.appendChild(style);
  }
})();

// State manager for unified chat widget
class ChatWidgetState {
  constructor(widgets) {
    this.widgets = widgets;
    this.activeWidgetId = null;
    this.onDeactivateCallback = null;
  }

  activateWidget(widgetId, onDeactivate) {
    this.onDeactivateCallback = onDeactivate;
    this.widgets.forEach(widget => {
      if (widget.id === widgetId) {
        widget.activate(() => {
          this.activeWidgetId = null;
          if (typeof this.onDeactivateCallback === 'function') {
            this.onDeactivateCallback();
          }
        });
        this.activeWidgetId = widgetId;
      } else {
        widget.deactivate();
      }
    });
  }

  hideAll() {
    this.widgets.forEach(widget => widget.hide());
    this.activeWidgetId = null;
  }
}

// Base widget class for chat service integrations
class BaseWidget {
  constructor(config) {
    this.id = config.id;
    this.displayName = config.displayName;
    this.scriptId = config.scriptId;
    this.config = config;
    this.state = { active: false, initialized: false };
    this.callbacks = { onDeactivate: null, closeListener: null };
    this.invokeRetryCount = 0; // Initialize retry count
  }

  injectScript() {
    if (this.state.initialized) return;

    const script = document.createElement('script');
    Object.assign(script, { 
      id: this.scriptId, 
      src: this.config.src, 
      async: true 
    });
    
    Object.entries(this.config.attributes || {}).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    document.head.appendChild(script);
    this.state.initialized = true;
  }

  invokeWidget() {
    // Click the launch button to open the chat
    const launchButton = document.querySelector(this.config.invokeSelector);
    if (launchButton) {
      // Try multiple click approaches for better compatibility
      try {
        // Method 1: Standard click
        launchButton.click();
      } catch (error) {
        try {
          // Method 2: MouseEvent click
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          launchButton.dispatchEvent(clickEvent);
        } catch (error2) {
          try {
            // Method 3: Programmatic click via HTMLElement
            if (launchButton.onclick) {
              launchButton.onclick.call(launchButton);
            }
          } catch (error3) {
            console.error(`Widget ${this.id}: All click methods failed:`, error3);
          }
        }
      }
    } else {
      // Retry if button not found yet
      const retryDelay = this.config.invokeRetryDelay || 200;
      const maxRetries = this.config.invokeMaxRetries || 50; // 10 seconds max
      
      if (!this.invokeRetryCount) {
        this.invokeRetryCount = 0;
      }
      
      if (this.invokeRetryCount < maxRetries) {
        this.invokeRetryCount++;
        setTimeout(() => this.invokeWidget(), retryDelay);
      } else {
        console.warn(`Widget ${this.id}: Launch button not found after ${maxRetries} retries. Selector: ${this.config.invokeSelector}`);
      }
    }
  }

  toggleVisibility(show) {
    const elements = this.getElementsToToggle();
    
    elements.forEach(el => {
      // For launch buttons, use visibility instead of display to keep them queryable
      const isLaunchButton = el.id === this.config.launcherId || 
                           (this.config.invokeSelector && el.matches(this.config.invokeSelector));
      
      if (isLaunchButton) {
        // Keep launch buttons in DOM but hidden
        Object.assign(el.style, {
          visibility: show ? 'visible' : 'hidden',
          opacity: show ? '1' : '0'
        });
      } else {
        // For other elements, use display none to completely hide them
        Object.assign(el.style, {
          display: show ? '' : 'none',
          visibility: show ? 'visible' : 'hidden',
          opacity: show ? '1' : '0'
        });
      }
    });
  }

  getElementsToToggle() {
    // Default implementation - can be overridden by subclasses
    return this.config.elementSelectors?.flatMap(selector => 
      Array.from(document.querySelectorAll(selector))
    ) || [];
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => this.deactivate(this.callbacks.onDeactivate);
    
    const closeBtn = document.querySelector(this.config.closeSelector);
    if (closeBtn) {
      closeBtn.addEventListener('click', this.callbacks.closeListener);
    } else {
      setTimeout(() => this.attachCloseListener(), 500);
    }
  }

  removeCloseListener() {
    if (!this.callbacks.closeListener) return;
    
    const closeBtn = document.querySelector(this.config.closeSelector);
    closeBtn?.removeEventListener('click', this.callbacks.closeListener);
    this.callbacks.closeListener = null;
  }

  activate(onDeactivate) {
    if (!this.state.initialized) this.injectScript();
    
    this.state.active = true;
    this.callbacks.onDeactivate = onDeactivate;
    
    setTimeout(() => {
      if (this.state.active) {
        // 1. First INVOKE the widget (click launch button)
        this.invokeWidget();
        
        // 2. Then manage the chat window visibility
        this.toggleVisibility(true);
        this.attachCloseListener();
      }
    }, 500);
  }

  deactivate(callback) {
    this.state.active = false;
    this.removeCloseListener();
    this.toggleVisibility(false);
    this.callbacks.onDeactivate = null;
    
    callback && setTimeout(callback, 300);
  }

  hide() {
    this.deactivate();
  }
}

// Zoom Contact Center widget integration
class ZoomWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'zoom',
      displayName: 'Zoom Contact Center',
      scriptId: 'zoom-cc-sdk',
      src: 'https://us01ccistatic.zoom.us/us01cci/web-sdk/zcc-sdk.js',
      attributes: { 
        'data-apikey': config.apiKey || 'DEMO_KEY', 
        'data-env': config.env || 'us01' 
      },
      invokeSelector: '.livesdk__invitation',
      closeSelector: '.css-1u2heh6',
      elementSelectors: ['[class*="livesdk"]', '[class*="zcc"]', '[id*="zcc"]', '[class*="zoom"]'],
      invokeRetryDelay: 150, // Shorter delay since button appears quickly
      invokeMaxRetries: 40   // Fewer retries (6 seconds total)
    });
    
    // Validate required config
    if (!config.apiKey || config.apiKey === 'DEMO_KEY') {
      console.warn('Zoom: API key not configured. Please add your Zoom API key to the configuration.');
    }
  }
}

// Anthology (Amazon Connect) widget integration
class AnthologyWidget extends BaseWidget {
  constructor(config = {}) {
    const widgetConfig = {
      id: 'anthology',
      displayName: 'Anthology (Purple)',
      scriptId: config.snippetId || 'demo-anthology-script',
      invokeSelector: '#amazon-connect-open-widget-button'
    };
    
    super(widgetConfig);
    
    this.active = false;
    this.initialized = false;
    // Store the original config separately, don't overwrite the widget config
    this.originalConfig = config;
    
    // Validate required config
    if (!this.originalConfig.snippetId) {
      console.warn('Anthology: Snippet ID not configured. Please add your Amazon Connect snippet ID to the configuration.');
    }
  }

  injectScript() {
    if (document.getElementById(this.scriptId)) {
      return;
    }
    
    // Load the script first
    (function(w, d, x, id) {
      var s = d.createElement('script');
      s.src = 'https://dtn7rvxwwlhud.cloudfront.net/amazon-connect-chat-interface-client.js';
      s.async = true;
      s.id = id;
      d.getElementsByTagName('head')[0].appendChild(s);
      w[x] = w[x] || function() {
        (w[x].ac = w[x].ac || []).push(arguments);
      };
    })(window, document, 'amazon_connect', this.scriptId);

    // Wait for script to load, then apply configuration
    const applyConfig = () => {
      if (window.amazon_connect && this.originalConfig.snippetId) {
        // Apply client-specific configuration
        window.amazon_connect('snippetId', this.originalConfig.snippetId);
        
        window.amazon_connect('styles', {
          iconType: 'CHAT',
          openChat: {
            color: '#ffffff',
            backgroundColor: '#830065'
          },
          closeChat: {
            color: '#ffffff',
            backgroundColor: '#830065'
          }
        });

        window.amazon_connect('supportedMessagingContentTypes', [
          'text/plain',
          'text/markdown',
          'application/vnd.amazonaws.connect.message.interactive',
          'application/vnd.amazonaws.connect.message.interactive.response'
        ]);

        window.amazon_connect('customDisplayNames', {
          transcript: {
            botMessageDisplayName: 'Virtual Agent'
          }
        });

        window.amazon_connect('mockLexBotTyping', true);

        window.amazon_connect('contactAttributes', {
          institutionAlias: 'germanna204'
        });

        window.amazon_connect('customizationObject', {
          composer: {
            disableEmojiPicker: true
          }
        });

        this.initialized = true;
      } else {
        // Keep trying until the script is loaded
        setTimeout(applyConfig, 100);
      }
    };
    
    applyConfig();
  }

  getElementsToToggle() {
    return document.querySelectorAll('iframe[src*="amazon"], [id*="amazon"], [class*="amazon"]');
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => this.deactivate(this.callbacks.onDeactivate);
    
    // Look for Amazon Connect close buttons with more flexible selectors
    const closeSelectors = [
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]',
      '.acCloseButton-0-0-125',
      '.acCloseButtonStyles-0-0-39',
      '.acCloseButton-0-0-223',
      '.acButtonStyles-0-0-213'
    ];
    
    let attached = false;
    closeSelectors.forEach(selector => {
      const closeBtn = document.querySelector(selector);
      if (closeBtn && !attached) {
        closeBtn.removeEventListener('click', this.callbacks.closeListener);
        closeBtn.addEventListener('click', this.callbacks.closeListener);
        attached = true;
      }
    });
    
    if (!attached && this.state.active) {
      setTimeout(() => this.attachCloseListener(), 500);
    }
  }

  removeCloseListener() {
    if (!this.callbacks.closeListener) return;
    
    const closeSelectors = [
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]',
      '.acCloseButton-0-0-125',
      '.acCloseButtonStyles-0-0-39',
      '.acCloseButton-0-0-223',
      '.acButtonStyles-0-0-213'
    ];
    
    closeSelectors.forEach(selector => {
      const closeBtn = document.querySelector(selector);
      if (closeBtn) {
        closeBtn.removeEventListener('click', this.callbacks.closeListener);
      }
    });
    
    this.callbacks.closeListener = null;
  }

  activate(onDeactivate) {
    if (!this.initialized) {
      this.injectScript();
    }

    this.state.active = true;
    this.callbacks.onDeactivate = onDeactivate;
    
    // Let Amazon Connect do its thing, then invoke and show
    setTimeout(() => {
      if (this.state.active) {
        // 1. First INVOKE the widget (click launch button)
        this.invokeWidget();
        
        // 2. Then manage the chat window visibility
        this.toggleVisibility(true);
        this.attachCloseListener();
      }
    }, 1500);
  }
}

// Chatbot widget integration
class ChatbotWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'chatbot',
      displayName: 'Chatbot',
      scriptId: config.scriptId || 'IS_CV_PUBLIC_HOOK',
      src: config.src || 'https://vccs-ws.iuc.intrasee.com/vccsoda/IS_CV_PUBLIC_HOOK.js',
      attributes: { 
        'data-org': config.org || 'DEMO_ORG', 
        'type': 'text/javascript' 
      },
      launcherId: config.launcherId || 'idalogin',
      invokeSelector: '#idalogin',
      closeSelector: '.oda-chat-popup-action.oda-chat-filled.oda-chat-flex',
      elementSelectors: ['[class*="oda-chat"]', '[id*="oda"]']
    });
    
    // Validate required config
    if (!config.org || config.org === 'DEMO_ORG') {
      console.warn('Chatbot: Organization not configured. Please add your organization ID to the configuration.');
    }
  }

  getElementsToToggle() {
    // Include the launcher element plus all matching selectors
    return [
      document.getElementById(this.config.launcherId),
      ...this.config.elementSelectors.flatMap(selector => 
        Array.from(document.querySelectorAll(selector))
      )
    ].filter(Boolean);
  }
}

// Main initialization code
let widgets = [];
let unifiedButtonContainer = null;
let unifiedButton = null;
let menu = null;

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

// Initialize widgets with client config
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

window.addEventListener('DOMContentLoaded', initializeWidgets); 