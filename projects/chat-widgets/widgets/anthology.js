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
    this.firstClose = true; // Track if this is the first close attempt
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
    // Get all Amazon Connect elements but exclude close buttons from visibility management
    const allElements = Array.from(document.querySelectorAll('iframe[src*="amazon"], [id*="amazon"], [class*="amazon"]'));
    
    // Define close button selectors to exclude
    const closeButtonSelectors = [
      'button[data-testid="close-chat-button"]',
      'button[aria-label="Close chat"]',
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]',
      'button[class*="acButtonStyles"]',
      '.acCloseButton-0-0-125',
      '.acCloseButtonStyles-0-0-39',
      '.acCloseButton-0-0-223',
      '.acButtonStyles-0-0-213',
      '.acCloseButton-0-0-41',
      '.acButtonStyles-0-0-31'
    ];
    
    // Filter out close buttons to prevent them from being hidden during visibility management
    return allElements.filter(el => {
      return !closeButtonSelectors.some(selector => {
        try {
          return el.matches(selector);
        } catch (e) {
          // Handle invalid selectors gracefully
          return false;
        }
      });
    });
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => {
      // Only add delay on first close attempt to prevent race condition
      // Subsequent closes work fine without delay
      const delay = this.firstClose ? 500 : 0;
      
      setTimeout(() => {
        if (this.state.active) {
          this.deactivate(this.callbacks.onDeactivate);
          this.firstClose = false; // Mark first close as complete
        }
      }, delay);
    };
    
    // Use event delegation on document to catch dynamically created buttons
    this.callbacks.documentClickListener = (event) => {
      const target = event.target;
      
      // Check if clicked element matches our Amazon Connect close button criteria
      const isCloseButton = target.matches('button[data-testid="close-chat-button"]') ||
                           target.matches('button[aria-label="Close chat"]') ||
                           target.matches('button.sc-htoDjs') ||  // Match the specific class from your example
                           target.matches('#amazon-connect-close-widget-button') ||
                           target.matches('button[id="amazon-connect-close-widget-button"]') ||
                           target.matches('button[aria-label="Minimize Chat"]') ||
                           target.matches('button[class*="acCloseButton"]') ||
                           target.matches('button[class*="acButtonStyles"]') ||
                           target.matches('.acCloseButton-0-0-125') ||
                           target.matches('.acCloseButtonStyles-0-0-39') ||
                           target.matches('.acCloseButton-0-0-223') ||
                           target.matches('.acButtonStyles-0-0-213') ||
                           target.matches('.acCloseButton-0-0-41') ||
                           target.matches('.acButtonStyles-0-0-31') ||
                           target.closest('button[data-testid="close-chat-button"]') ||
                           target.closest('button[aria-label="Close chat"]') ||
                           target.closest('#amazon-connect-close-widget-button') ||
                           target.closest('button[id="amazon-connect-close-widget-button"]') ||
                           target.closest('button[aria-label="Minimize Chat"]') ||
                           target.closest('button[class*="acCloseButton"]') ||
                           target.closest('button[class*="acButtonStyles"]');
      
      if (isCloseButton && this.state.active) {
        this.callbacks.closeListener();
      }
    };
    
    // Add document-level click listener for dynamic buttons
    document.addEventListener('click', this.callbacks.documentClickListener, true);
    
    // Also try direct attachment for existing buttons (as backup)
    this.attachDirectListeners();
  }
  
  attachDirectListeners() {
    const closeSelectors = [
      'button[data-testid="close-chat-button"]',
      'button[aria-label="Close chat"]',
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]',
      'button[class*="acButtonStyles"]',
      '.acCloseButton-0-0-125',
      '.acCloseButtonStyles-0-0-39',
      '.acCloseButton-0-0-223',
      '.acButtonStyles-0-0-213',
      '.acCloseButton-0-0-41',
      '.acButtonStyles-0-0-31'
    ];
    
    closeSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        button.removeEventListener('click', this.callbacks.closeListener);
        button.addEventListener('click', this.callbacks.closeListener);
      });
    });
    
    // Retry if no buttons found yet
    if (this.state.active && document.querySelectorAll(closeSelectors.join(',')).length === 0) {
      setTimeout(() => this.attachDirectListeners(), 500);
    }
  }

  removeCloseListener() {
    if (!this.callbacks.closeListener) return;
    
    // Remove document-level listener
    if (this.callbacks.documentClickListener) {
      document.removeEventListener('click', this.callbacks.documentClickListener, true);
      this.callbacks.documentClickListener = null;
    }
    
    // Remove direct listeners
    const closeSelectors = [
      'button[data-testid="close-chat-button"]',
      'button[aria-label="Close chat"]',
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]',
      'button[class*="acButtonStyles"]',
      '.acCloseButton-0-0-125',
      '.acCloseButtonStyles-0-0-39',
      '.acCloseButton-0-0-223',
      '.acButtonStyles-0-0-213',
      '.acCloseButton-0-0-41',
      '.acButtonStyles-0-0-31'
    ];
    
    closeSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        button.removeEventListener('click', this.callbacks.closeListener);
      });
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