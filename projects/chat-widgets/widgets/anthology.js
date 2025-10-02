// Anthology (Amazon Connect) widget integration
import { BaseWidget } from './base-widget.js';

export class AnthologyWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'anthology',
      displayName: config.displayName || 'Live Chat Support',
      order: config.order,
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

    console.log('🔍 Anthology: Production mode - button click detection disabled, relying on widget frame state monitoring only');

    // Setup Amazon Connect widget state monitoring (for iframe-isolated close detection)
    this.setupAmazonConnectStateMonitoring();
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

  setupAmazonConnectStateMonitoring() {
    if (!this.state.active) return;

    console.log('🔍 Anthology: Setting up Amazon Connect widget state monitoring');

    // Monitor the Amazon Connect widget frame for class changes
    const monitorWidgetFrame = () => {
      const widgetFrame = document.getElementById('amazon-connect-widget-frame');

      if (widgetFrame) {
        const initialClass = widgetFrame.className;
        const hasShowClass = initialClass.includes('show');

        console.log('🔍 Anthology: Found Amazon Connect widget frame:', {
          className: initialClass,
          hasShowClass: hasShowClass
        });

        // Set up MutationObserver to watch for class changes on the widget frame
        this.callbacks.widgetFrameObserver = new MutationObserver((mutations) => {
          if (!this.state.active) return;

          mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const currentClass = widgetFrame.className;
              const currentlyHasShow = currentClass.includes('show');
              const previouslyHadShow = mutation.oldValue?.includes('show') ?? false;

              console.log('🔍 Anthology: Widget frame class changed:', {
                oldClass: mutation.oldValue,
                newClass: currentClass,
                previouslyHadShow: previouslyHadShow,
                currentlyHasShow: currentlyHasShow
              });

              // If the 'show' class was removed, the chat was closed/minimized
              if (previouslyHadShow && !currentlyHasShow) {
                console.log('🔍 Anthology: Amazon Connect chat closed/minimized - returning to unified menu');

                // Add a small delay to ensure the state change is complete
                setTimeout(() => {
                  if (this.state.active) {
                    this.callbacks.closeListener();
                  }
                }, 300);
              }
            }
          });
        });

        // Start observing the widget frame for class attribute changes
        this.callbacks.widgetFrameObserver.observe(widgetFrame, {
          attributes: true,
          attributeFilter: ['class'],
          attributeOldValue: true
        });

        console.log('🔍 Anthology: Widget frame monitoring active');

      } else {
        // Widget frame not found yet, retry
        if (this.state.active) {
          console.log('🔍 Anthology: Amazon Connect widget frame not found yet, retrying...');
          setTimeout(monitorWidgetFrame, 1000);
        }
      }
    };

    // Also monitor for complete widget removal
    this.callbacks.widgetContainerObserver = new MutationObserver((mutations) => {
      if (!this.state.active) return;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          for (let node of mutation.removedNodes) {
            if (node.nodeType === 1 && (
              node.id === 'amazon-connect-chat-widget' ||
              node.id === 'amazon-connect-widget-frame' ||
              node.querySelector('#amazon-connect-chat-widget') ||
              node.querySelector('#amazon-connect-widget-frame')
            )) {
              console.log('🔍 Anthology: Amazon Connect widget removed from DOM');
              if (this.state.active) {
                this.callbacks.closeListener();
              }
              return;
            }
          }
        }
      });
    });

    // Watch the document for widget removal
    this.callbacks.widgetContainerObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Start monitoring
    monitorWidgetFrame();
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

    // Remove Amazon Connect state monitoring observers
    if (this.callbacks.widgetFrameObserver) {
      this.callbacks.widgetFrameObserver.disconnect();
      this.callbacks.widgetFrameObserver = null;
      console.log('🔍 Anthology: Widget frame observer disconnected');
    }

    if (this.callbacks.widgetContainerObserver) {
      this.callbacks.widgetContainerObserver.disconnect();
      this.callbacks.widgetContainerObserver = null;
      console.log('🔍 Anthology: Widget container observer disconnected');
    }

    this.callbacks.closeListener = null;
  }
}