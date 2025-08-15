// Anthology (Amazon Connect) widget integration
import { BaseWidget } from './base-widget.js';

export class AnthologyWidget extends BaseWidget {
  constructor(config = {}) {
    const widgetConfig = {
      id: 'anthology',
      displayName: 'Student Support Bot',
      scriptId: config.scriptId || 'demo-anthology-script',
      invokeSelector: '#amazon-connect-open-widget-button'
    };
    
    super(widgetConfig);
    
    this.active = false;
    this.initialized = false;
    this.scriptLoaded = false; // Track if script has been loaded
    // Store the original config separately, don't overwrite the widget config
    this.originalConfig = config;
    
    // Validate required config
    if (!this.originalConfig.snippetId) {
      console.warn('Anthology: Snippet ID not configured. Please add your Amazon Connect snippet ID to the configuration.');
    }
    if (!this.originalConfig.scriptId) {
      console.warn('Anthology: Script ID not configured. Please add your Amazon Connect script ID to the configuration.');
    }
    if (!this.originalConfig.institutionAlias) {
      console.warn('Anthology: Institution alias not configured. Please add your institution alias to the configuration.');
    }
  }

  loadScriptOnce() {
    if (this.scriptLoaded || document.getElementById(this.scriptId)) {
      return;
    }
    
    this.scriptLoaded = true;
    
    // Load the script and immediately configure - mimic the working static approach
    (function(w, d, x, id, config, originalConfig) {
      var s = d.createElement('script');
      s.src = 'https://dtn7rvxwlhud.cloudfront.net/amazon-connect-chat-interface-client.js';
      s.async = true;
      s.id = id;
      d.getElementsByTagName('head')[0].appendChild(s);
      w[x] = w[x] || function() {
        (w[x].ac = w[x].ac || []).push(arguments);
      };
      
      // Apply configuration immediately after setting up the queue function
      // This mimics the timing of the working static code
      if (originalConfig.snippetId) {
        w[x]('styles', {
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

        w[x]('snippetId', originalConfig.snippetId);

        w[x]('supportedMessagingContentTypes', [
          'text/plain',
          'text/markdown',
          'application/vnd.amazonaws.connect.message.interactive',
          'application/vnd.amazonaws.connect.message.interactive.response'
        ]);

        w[x]('customDisplayNames', {
          transcript: {
            botMessageDisplayName: 'Virtual Agent'
          }
        });

        w[x]('mockLexBotTyping', true);

        w[x]('contactAttributes', {
          institutionAlias: originalConfig.institutionAlias || 'default'
        });

        w[x]('customizationObject', {
          composer: {
            disableEmojiPicker: true
          }
        });
        
        config.initialized = true;
        
        // Start hidden by default - we'll show it when activated
        setTimeout(() => {
          const elements = config.getElementsToToggle();
          elements.forEach(el => el.style.display = 'none');
        }, 2000);
      }
    })(window, document, 'amazon_connect', this.scriptId, this, this.originalConfig);
  }

  getElementsToToggle() {
    return document.querySelectorAll('iframe[src*="amazon"], [id*="amazon"], [class*="amazon"]');
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => this.deactivate(this.callbacks.onDeactivate);
    
    // Look for Amazon Connect close buttons with more flexible selectors
    const closeSelectors = [
      'button[data-testid="close-chat-button"]',
      'button[aria-label="Close chat"]',
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
      'button[data-testid="close-chat-button"]',
      'button[aria-label="Close chat"]',
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
    this.state.active = true;
    this.callbacks.onDeactivate = onDeactivate;
    
    if (!this.scriptLoaded) {
      // First time activation - load script and wait for it to initialize
      this.loadScriptOnce();
      
      // Wait longer for first load
      setTimeout(() => {
        if (this.state.active) {
          this.invokeWidget();
          this.toggleVisibility(true);
          this.attachCloseListener();
        }
      }, 3000);
    } else {
      // Subsequent activations - just show the existing widget
      setTimeout(() => {
        if (this.state.active) {
          this.invokeWidget();
          this.toggleVisibility(true);
          this.attachCloseListener();
        }
      }, 100);
    }
  }
}