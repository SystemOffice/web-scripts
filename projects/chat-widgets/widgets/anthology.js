// Anthology (Amazon Connect) widget integration
import { BaseWidget } from './base-widget.js';

export class AnthologyWidget extends BaseWidget {
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