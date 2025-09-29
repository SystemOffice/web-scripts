// Chat Widgets - Manual Bundle

// === Styles ===
function injectStyles() {
  const css = `
#chat-widget-container {
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
  min-width: 240px;
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
`;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// === Config ===
class WidgetConfig {
  static DEFAULTS = {
    ui: {
      position: {
        bottom: '32px',
        right: '32px',
        zIndex: '9999'
      }
    },
    timing: {
      firstActivationDelay: 1500,
      subsequentActivationDelay: 300,
      deactivationDelay: 300,
      closeListenerRetryDelay: 500
    },
    retry: {
      invokeRetryDelay: 200,
      invokeMaxRetries: 50,
      exponentialBackoffBase: 1.2,
      maxRetryDelay: 2000
    },
    errorHandling: {
      enableGracefulDegradation: true,
      logLevel: 'warn',
      enableErrorReporting: false,
      maxConsecutiveErrors: 3
    }
  };

  constructor(overrides = {}) {
    this.config = this.mergeDeep(WidgetConfig.DEFAULTS, overrides);
  }

  get(path) {
    return this.getNestedValue(this.config, path);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  mergeDeep(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

const defaultConfig = new WidgetConfig();

// === Logger ===
class WidgetLogger {
  constructor(config = defaultConfig) {
    this.config = config;
    this.sessionId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logs = [];
  }

  info(message, data = {}, widgetId = null) {
    this.log('info', message, data, widgetId);
  }

  warn(message, data = {}, widgetId = null) {
    this.log('warn', message, data, widgetId);
  }

  error(message, data = {}, widgetId = null) {
    this.log('error', message, data, widgetId);
  }

  log(level, message, data = {}, widgetId = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      widget_id: widgetId,
      data
    };

    this.logs.push(logEntry);

    const consoleMethod = console[level] || console.log;
    const prefix = `[${logEntry.timestamp}] [${widgetId || 'SYSTEM'}]`;
    consoleMethod(`${prefix} ${message}`, data);
  }

  startTimer(name, widgetId = null) {
    const startTime = performance.now();
    return {
      stop: () => {
        const duration = performance.now() - startTime;
        this.info(`Performance: ${name}`, { duration_ms: duration }, widgetId);
        return duration;
      }
    };
  }

  logWidgetLifecycle(event, widgetId, data = {}) {
    this.info(`Widget ${event}`, { event_type: 'lifecycle', ...data }, widgetId);
  }

  logWidgetActivation(widgetId, duration = null) {
    this.logWidgetLifecycle('activated', widgetId, { activation_duration_ms: duration });
  }

  logWidgetDeactivation(widgetId, duration = null) {
    this.logWidgetLifecycle('deactivated', widgetId, { deactivation_duration_ms: duration });
  }

  logScriptLoad(widgetId, src, success, duration = null, error = null) {
    this.info(`Script load`, {
      script_src: src,
      success,
      duration_ms: duration,
      error_message: error?.message
    }, widgetId);
  }

  attachToWindow() {
    if (typeof window !== 'undefined') {
      window.widgetDebug = {
        exportLogs: () => ({
          session_id: this.sessionId,
          total_logs: this.logs.length,
          logs: this.logs
        }),
        getWidgets: () => widgets || [],
        getConfig: () => defaultConfig
      };
    }
  }
}

const defaultLogger = new WidgetLogger();
defaultLogger.attachToWindow();

// === Error Handler ===
class ErrorHandler {
  constructor(config = defaultConfig) {
    this.config = config;
    this.errorCounts = new Map();
  }

  async handleWidgetError(error, context, widgetId = 'unknown') {
    defaultLogger.error(`Widget error [${widgetId}:${context}]`, { error: error.message });
    return { success: false, error };
  }

  setWidgetRegistry(registry) {
    this.widgetRegistry = registry;
  }
}

const defaultErrorHandler = new ErrorHandler();

// === Base Widget ===
class BaseWidget {
  constructor(config) {
    this.id = config.id;
    this.displayName = config.displayName;
    this.scriptId = config.scriptId;
    this.config = config;
    this.widgetConfig = defaultConfig;
    this.errorHandler = defaultErrorHandler;
    this.logger = defaultLogger;
    this.state = { active: false, initialized: false, mounted: false };
    this.callbacks = { onDeactivate: null, closeListener: null };
    this.invokeRetryCount = 0;
    this.firstActivation = true;

    this.logger.info(`Widget initialized`, { widget_type: this.constructor.name }, this.id);
  }

  async mount() {
    this.state.mounted = true;
  }

  async injectScript() {
    if (this.state.initialized) return { success: true };

    const timer = this.logger.startTimer('script_inject', this.id);

    try {
      this.logger.info(`Injecting script`, { src: this.config.src }, this.id);

      const script = document.createElement('script');
      Object.assign(script, {
        id: this.scriptId,
        src: this.config.src,
        async: true
      });

      Object.entries(this.config.attributes || {}).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });

      return new Promise((resolve) => {
        script.onload = () => {
          this.state.initialized = true;
          const duration = timer.stop();
          this.logger.logScriptLoad(this.id, this.config.src, true, duration);
          resolve({ success: true });
        };

        script.onerror = async (error) => {
          const duration = timer.stop();
          this.logger.logScriptLoad(this.id, this.config.src, false, duration, error);
          resolve({ success: false, error });
        };

        document.head.appendChild(script);
      });

    } catch (error) {
      timer.stop();
      this.logger.error(`Script injection error`, { error: error.message }, this.id);
      return { success: false, error };
    }
  }

  async invokeWidget() {
    const launchButton = document.querySelector(this.config.invokeSelector);
    this.logger.info(`Invoking widget`, {
      selector: this.config.invokeSelector,
      buttonFound: !!launchButton,
      retryCount: this.invokeRetryCount
    }, this.id);

    if (launchButton) {
      try {
        launchButton.click();
        this.logger.info(`Widget invoked successfully`, {}, this.id);
      } catch (error) {
        this.logger.error(`Widget invoke failed`, { error: error.message }, this.id);
      }
    } else {
      if (this.invokeRetryCount < 50) {
        this.invokeRetryCount++;
        setTimeout(() => this.invokeWidget(), 200);
      } else {
        this.logger.warn(`Launch button not found after retries`, {
          selector: this.config.invokeSelector,
          totalRetries: this.invokeRetryCount
        }, this.id);
      }
    }
  }

  toggleVisibility(show) {
    const elements = this.getElementsToToggle();
    elements.forEach(el => {
      Object.assign(el.style, {
        display: show ? '' : 'none',
        visibility: show ? 'visible' : 'hidden',
        opacity: show ? '1' : '0'
      });
    });
  }

  getElementsToToggle() {
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

  async activate(onDeactivate) {
    const activationTimer = this.logger.startTimer('activation', this.id);

    try {
      this.logger.logWidgetLifecycle('activating', this.id);

      if (!this.state.mounted) {
        await this.mount();
      }

      if (!this.state.initialized) {
        const scriptResult = await this.injectScript();
        if (!scriptResult.success) {
          this.logger.error(`Script injection failed`, {}, this.id);
          return;
        }
      }

      this.state.active = true;
      this.callbacks.onDeactivate = onDeactivate;

      const delay = this.firstActivation ? 1500 : 300;

      setTimeout(async () => {
        if (this.state.active) {
          try {
            await this.invokeWidget();
            this.toggleVisibility(true);
            this.attachCloseListener();
            this.firstActivation = false;

            const duration = activationTimer.stop();
            this.logger.logWidgetActivation(this.id, duration);

          } catch (error) {
            activationTimer.stop();
            this.logger.error(`Widget activation failed`, { error: error.message }, this.id);
          }
        } else {
          activationTimer.stop();
        }
      }, delay);

    } catch (error) {
      activationTimer.stop();
      this.logger.error(`Widget activation failed`, { error: error.message }, this.id);
    }
  }

  async deactivate(callback) {
    const deactivationTimer = this.logger.startTimer('deactivation', this.id);

    try {
      this.logger.logWidgetLifecycle('deactivating', this.id);

      this.state.active = false;
      this.removeCloseListener();
      this.toggleVisibility(false);

      const duration = deactivationTimer.stop();
      this.logger.logWidgetDeactivation(this.id, duration);

      // Call the callback before nullifying the reference
      if (callback) {
        setTimeout(callback, 300);
      }

      // Clear callback reference after calling it
      this.callbacks.onDeactivate = null;

    } catch (error) {
      deactivationTimer.stop();
      this.logger.error(`Widget deactivation error`, { error: error.message }, this.id);
    }
  }

  hide() {
    this.deactivate();
  }
}

// === Zoom Widget ===
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
      elementSelectors: ['[class*="livesdk"]', '[class*="zcc"]', '[id*="zcc"]', '[class*="zoom"]', 'button[aria-label="Leave"]'],
      invokeRetryDelay: 150,
      invokeMaxRetries: 40
    });
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => this.deactivate(this.callbacks.onDeactivate);

    // Use event delegation on document to catch dynamically created buttons
    this.callbacks.documentClickListener = (event) => {
      const target = event.target;

      // Debug logging for all clicks when Zoom is active
      if (this.state.active && (target.tagName === 'BUTTON' || target.closest('button'))) {
        console.log('🔍 Zoom: Button clicked', {
          tag: target.tagName,
          ariaLabel: target.getAttribute('aria-label'),
          className: target.className,
          id: target.id,
          closestButton: target.closest('button')?.outerHTML?.substring(0, 200)
        });
      }

      // Check if clicked element matches our close button criteria
      const isNextButton = target.matches('button[aria-label="Next"]') ||
                          target.matches('.css-1mv3bnz') ||
                          target.closest('button[aria-label="Next"]') ||
                          target.closest('.css-1mv3bnz');

      const isLeaveButton = target.matches('button[aria-label="Leave"]') ||
                           target.matches('.css-1rzxt70') ||
                           target.closest('button[aria-label="Leave"]') ||
                           target.closest('.css-1rzxt70');

      const isOriginalClose = target.matches('.css-1u2heh6') ||
                             target.closest('.css-1u2heh6');

      if ((isNextButton || isLeaveButton || isOriginalClose) && this.state.active) {
        console.log('✅ Zoom: Close button detected, calling deactivate', {
          isNextButton,
          isLeaveButton,
          isOriginalClose
        });
        this.callbacks.closeListener();
      }
    };

    // Add document-level click listener for dynamic buttons
    document.addEventListener('click', this.callbacks.documentClickListener, true);
  }

  removeCloseListener() {
    if (!this.callbacks.closeListener) return;

    // Remove document-level listener
    if (this.callbacks.documentClickListener) {
      document.removeEventListener('click', this.callbacks.documentClickListener, true);
      this.callbacks.documentClickListener = null;
    }

    this.callbacks.closeListener = null;
  }
}

// === Chatbot Widget ===
class ChatbotWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'chatbot',
      displayName: 'Live Chat Support',
      scriptId: config.scriptId || 'IS_CV_PUBLIC_HOOK',
      src: config.src || 'https://vccs-ws.iuc.intrasee.com/vccsoda/IS_CV_PUBLIC_HOOK.js',
      attributes: {
        'data-org': config.org || 'DEMO_ORG',
        'type': 'text/javascript'
      },
      launcherId: config.launcherId || 'idalogin',
      invokeSelector: '#idalogin',
      closeSelector: '.oda-chat-popup-action.oda-chat-filled.oda-chat-flex',
      elementSelectors: ['[class*="oda-chat"]', '[id*="oda"]', '[class*="isCV"]', '[id*="isChat"]', '#isChatWelcomeBubble', '#isChatIconWrapper']
    });

    // Load script immediately but hide elements aggressively
    this.injectScript();
    this.hideElementsAggressively();
  }

  hideElementsAggressively() {
    const hideAttempts = [500, 1000, 1500, 2000, 2500, 3000];
    hideAttempts.forEach(delay => {
      setTimeout(() => {
        if (!this.state.active) {
          this.toggleVisibility(false);
        }
      }, delay);
    });
  }

  activate(onDeactivate) {
    // Script is already loaded, just activate quickly
    this.state.active = true;
    this.callbacks.onDeactivate = onDeactivate;

    setTimeout(() => {
      if (this.state.active) {
        this.invokeWidget();
        this.toggleVisibility(true);
        this.attachCloseListener();
        this.firstActivation = false;
      }
    }, 100);
  }

  getElementsToToggle() {
    // Get all matching elements but exclude the main launcher button from hiding
    // This ensures the chat button remains visible when minimized
    const launcherButton = document.getElementById(this.config.launcherId);

    const allElements = this.config.elementSelectors.flatMap(selector =>
      Array.from(document.querySelectorAll(selector))
    );

    // Filter out the launcher button - we don't want to hide it
    // because it needs to remain visible when chat is minimized
    return allElements.filter(element => element !== launcherButton);
  }

  attachCloseListener() {
    if (!this.state.active) return;

    this.callbacks.closeListener = () => {
      setTimeout(() => {
        if (this.state.active) {
          this.deactivate(this.callbacks.onDeactivate);
        }
      }, 100);
    };

    // Document-level click listener for both close AND minimize buttons
    // Since minimize actually closes the chat anyway, treat both the same way
    this.callbacks.documentClickListener = (event) => {
      const target = event.target;

      const isCloseOrMinimizeButton = target.matches('.oda-chat-popup-action.oda-chat-filled.oda-chat-flex') ||
                                      target.matches('#oda-chat-collapse') ||
                                      target.matches('li[data-value="collapse"]') ||
                                      target.closest('.oda-chat-popup-action.oda-chat-filled.oda-chat-flex') ||
                                      target.closest('#oda-chat-collapse') ||
                                      target.closest('li[data-value="collapse"]') ||
                                      (target.textContent && target.textContent.includes('Minimize conversation'));

      if (isCloseOrMinimizeButton && this.state.active) {
        console.log('🔍 Chatbot: Close or minimize button clicked - returning to unified menu');
        this.callbacks.closeListener();
      }
    };

    document.addEventListener('click', this.callbacks.documentClickListener, true);
  }

  removeCloseListener() {
    if (!this.callbacks.closeListener) return;

    // Remove document-level listener
    if (this.callbacks.documentClickListener) {
      document.removeEventListener('click', this.callbacks.documentClickListener, true);
      this.callbacks.documentClickListener = null;
    }

    this.callbacks.closeListener = null;
  }
}

// === Anthology Widget ===
class AnthologyWidget extends BaseWidget {
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
      'button[data-testid="end-chat-button"]',
      'button[aria-label="Close chat"]',
      'button[aria-label="End chat"]',
      'button.sc-htoDjs.jkDoJG',
      'button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa',
      '#amazon-connect-close-widget-button',
      'button[id="amazon-connect-close-widget-button"]',
      'button[aria-label="Minimize Chat"]',
      'button[class*="acCloseButton"]',
      'button[class*="acButtonStyles"]',
      'button.acCloseButtonStyles-0-0-137',
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

// === State ===
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

// === Main ===
async function loadClientConfig() {
  const domain = window.location.hostname;

  if (window.CHAT_WIDGET_CONFIG) {
    return window.CHAT_WIDGET_CONFIG;
  }

  return {
    zoom: { enabled: false },
    anthology: { enabled: false },
    chatbot: { enabled: false }
  };
}

let widgets = [];
let widgetRegistry = new Map();
let unifiedButtonContainer = null;
let unifiedButton = null;
let menu = null;

async function initializeWidgets() {
  try {
    // Inject styles first
    injectStyles();

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

    defaultErrorHandler.setWidgetRegistry(widgetRegistry);

    if (widgets.length === 0) {
      defaultLogger.warn('No chat widgets configured for this domain');
      return;
    }

    defaultLogger.info(`Initialized ${widgets.length} widgets: ${widgets.map(w => w.id).join(', ')}`);

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