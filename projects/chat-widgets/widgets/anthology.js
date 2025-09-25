// Anthology (Amazon Connect) widget integration
import { BaseWidget } from './base-widget.js';

export class AnthologyWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'anthology',
      displayName: 'Student Support Bot',
      scriptId: config.scriptId || 'demo-anthology-script',
      invokeSelector: '#amazon-connect-open-widget-button'
    });

    this.active = false;
    this.initialized = false;
    this.scriptLoaded = false;
    this.firstClose = true;
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
      console.log('🔍 Anthology: Script already loaded, skipping');
      return;
    }

    console.log('🔍 Anthology: Loading Amazon Connect script...');
    this.scriptLoaded = true;

    // Load Amazon Connect script
    (function(w, d, x, id, config, originalConfig) {
      console.log('🔍 Anthology: Creating script element');
      var s = d.createElement('script');
      s.src = 'https://dtn7rvxwwlhud.cloudfront.net/amazon-connect-chat-interface-client.js';
      s.async = true;
      s.id = id;

      s.onload = function() {
        console.log('🔍 Anthology: Amazon Connect script loaded successfully');
      };

      s.onerror = function() {
        console.log('❌ Anthology: Amazon Connect script failed to load');
      };

      d.getElementsByTagName('head')[0].appendChild(s);
      console.log('🔍 Anthology: Script element added to head');

      w[x] = w[x] || function() {
        console.log('🔍 Anthology: Amazon Connect function called with args:', arguments);
        (w[x].ac = w[x].ac || []).push(arguments);
      };

      // Apply configuration
      console.log('🔍 Anthology: Checking config:', originalConfig);
      if (originalConfig.snippetId) {
        console.log('🔍 Anthology: SnippetId found, applying configuration...');
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
      'button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa',
      'button[class*="acCloseButtonStyles"]',
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]'
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

  activate(onDeactivate) {
    console.log('🔍 Anthology: Activating widget', { scriptLoaded: this.scriptLoaded });
    this.state.active = true;
    this.callbacks.onDeactivate = onDeactivate;

    if (!this.scriptLoaded) {
      console.log('🔍 Anthology: Loading script for first time');
      this.loadScriptOnce();
      // Wait longer for first load
      setTimeout(() => {
        if (this.state.active) {
          console.log('🔍 Anthology: First activation - invoking widget');
          this.invokeWidget();
          this.toggleVisibility(true);
          this.attachCloseListener();
        }
      }, 3000);
    } else {
      console.log('🔍 Anthology: Script already loaded, quick activation');
      // Subsequent activations
      setTimeout(() => {
        if (this.state.active) {
          console.log('🔍 Anthology: Subsequent activation - invoking widget');
          this.invokeWidget();
          this.toggleVisibility(true);
          this.attachCloseListener();
        }
      }, 100);
    }
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => {
      const delay = this.firstClose ? 500 : 0;
      setTimeout(() => {
        if (this.state.active) {
          this.deactivate(this.callbacks.onDeactivate);
          this.firstClose = false;
        }
      }, delay);
    };

    // Document-level click listener for Amazon Connect buttons
    this.callbacks.documentClickListener = (event) => {
      const target = event.target;

      // Check if clicked element is a CLOSE button (should return to unified menu)
      const isCloseButton = target.matches('button[data-testid="close-chat-button"]') ||
                            target.matches('button[aria-label="Close chat"]') ||
                            target.matches('button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa') ||  // Close button specific classes
                            target.matches('button[class*="acCloseButtonStyles"]') ||  // Generic match for acCloseButtonStyles-X-X-XX
                            (target.textContent && target.textContent.trim() === 'Close') ||  // Any button with "Close" text
                            target.closest('button[data-testid="close-chat-button"]') ||
                            target.closest('button[aria-label="Close chat"]') ||
                            target.closest('button[class*="acCloseButtonStyles"]');

      // Check if clicked element is a MINIMIZE button (should just minimize, not return to unified menu)
      const isMinimizeButton = (target.matches('button[aria-label="Minimize Chat"]') ||
                               target.matches('#amazon-connect-close-widget-button') ||
                               target.matches('button[id="amazon-connect-close-widget-button"]') ||
                               target.matches('button[class*="acCloseButton"]') ||
                               (target.textContent && target.textContent.includes('Minimize')) ||
                               target.closest('button[aria-label="Minimize Chat"]') ||
                               target.closest('#amazon-connect-close-widget-button') ||
                               target.closest('button[class*="acCloseButton"]')) &&
                               !target.matches('button[class*="acCloseButtonStyles"]') &&  // Exclude close button styles
                               !(target.textContent && target.textContent.trim() === 'Close');  // Exclude "Close" text

      // Check if clicked element is the "Start Chat" button (reopening from minimized state)
      const isStartChatButton = target.matches('#amazon-connect-open-widget-button') ||
                                target.matches('button[id="amazon-connect-open-widget-button"]') ||
                                target.matches('button[aria-label="Start Chat"]') ||
                                target.closest('#amazon-connect-open-widget-button') ||
                                target.closest('button[aria-label="Start Chat"]');

      if (isCloseButton && this.state.active) {
        console.log('🔍 Anthology: Close button clicked - returning to unified menu');
        this.callbacks.closeListener();
      } else if (isMinimizeButton && this.state.active) {
        console.log('🔍 Anthology: Minimize button clicked - keeping session active, just minimizing');
        // Don't call closeListener() - just let Amazon Connect handle the minimize
        // The session stays active and the unified menu doesn't return
      } else if (isStartChatButton && this.state.active) {
        console.log('🔍 Anthology: Start Chat button clicked - reopening from minimized state, keeping session active');
        // Don't call closeListener() - this is just reopening a minimized chat
        // The session continues and the unified menu should not return
      }
    };

    document.addEventListener('click', this.callbacks.documentClickListener, true);

    // Also try direct attachment for existing buttons (as backup)
    this.attachDirectListeners();
  }

  attachDirectListeners() {
    // Close buttons that should return to unified menu (removed End chat)
    const closeSelectors = [
      'button[data-testid="close-chat-button"]',
      'button[aria-label="Close chat"]',
      'button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa',
      'button[class*="acCloseButtonStyles"]'  // Generic catch for all acCloseButtonStyles variants
    ];

    // Minimize buttons that should just minimize (no return to unified menu)
    const minimizeSelectors = [
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]:not([class*="acCloseButtonStyles"])'  // acCloseButton but not acCloseButtonStyles
    ];

    // Start Chat buttons that should just reopen (no return to unified menu)
    const startChatSelectors = [
      '#amazon-connect-open-widget-button',
      'button[id="amazon-connect-open-widget-button"]',
      'button[aria-label="Start Chat"]'
    ];

    // Attach close listeners (return to unified menu)
    closeSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        button.removeEventListener('click', this.callbacks.closeListener);
        button.addEventListener('click', this.callbacks.closeListener);
      });
    });

    // Also find buttons by text content (Close only, not End chat)
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
      const text = button.textContent.trim();
      if (text === 'Close') {
        button.removeEventListener('click', this.callbacks.closeListener);
        button.addEventListener('click', this.callbacks.closeListener);
      }
    });

    // Attach minimize listeners (just minimize, don't return)
    minimizeSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        // Remove any existing close listeners
        button.removeEventListener('click', this.callbacks.closeListener);
        // Don't add any listener - let Amazon Connect handle minimize naturally
      });
    });

    // Attach start chat listeners (just reopen, don't return to unified menu)
    startChatSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        // Remove any existing close listeners
        button.removeEventListener('click', this.callbacks.closeListener);
        // Don't add any listener - let Amazon Connect handle reopening naturally
      });
    });

    // Retry if no buttons found yet
    if (this.state.active && document.querySelectorAll([...closeSelectors, ...minimizeSelectors, ...startChatSelectors].join(',')).length === 0) {
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

    // Remove direct listeners from all button types
    const allButtonSelectors = [
      'button[data-testid="close-chat-button"]',
      'button[aria-label="Close chat"]',
      'button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa',
      'button[class*="acCloseButtonStyles"]',  // Generic match for all variants
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]',
      '#amazon-connect-open-widget-button',
      'button[id="amazon-connect-open-widget-button"]',
      'button[aria-label="Start Chat"]'
    ];

    allButtonSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        button.removeEventListener('click', this.callbacks.closeListener);
      });
    });

    // Also remove listeners from buttons found by text content
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
      const text = button.textContent.trim();
      if (text === 'Close' || text.includes('Minimize')) {
        button.removeEventListener('click', this.callbacks.closeListener);
      }
    });

    this.callbacks.closeListener = null;
  }
}