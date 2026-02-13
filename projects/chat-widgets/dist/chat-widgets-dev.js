(() => {
  // styles.css
  var style = document.createElement("style");
  style.textContent = "#chat-widget-container {\n  font-family: 'Segoe UI', Arial, sans-serif;\n}\n\n.chat-widget-btn {\n  background: #31435d;\n  color: #fff;\n  border: none;\n  border-radius: 50%;\n  width: 80px;\n  height: 80px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 36px;\n  cursor: pointer;\n  box-shadow: 0 4px 24px rgba(80, 80, 180, 0.18), 0 1.5px 6px rgba(0,0,0,0.08);\n  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;\n  position: relative;\n  outline: none;\n  padding: 0;\n}\n\n.chat-widget-btn-modern .chat-widget-icon::before {\n  content: '\\1F4AC'; /* \u{1F4AC} */\n  font-size: 36px;\n  display: block;\n}\n\n.chat-widget-btn-modern .chat-widget-label {\n  display: none;\n}\n\n.chat-widget-btn:hover, .chat-widget-btn:focus {\n  background: #a20b34;\n  box-shadow: 0 8px 32px rgba(80, 80, 180, 0.22), 0 2px 8px rgba(0,0,0,0.10);\n  transform: scale(1.06);\n}\n\n.chat-widget-btn:focus-visible {\n  outline: 3px solid #2575fc;\n  outline-offset: 2px;\n}\n\n.chat-widget-menu {\n  display: block;\n  position: absolute;\n  bottom: 80px;\n  right: 0;\n  background: #fff;\n  border-radius: 16px;\n  box-shadow: 0 4px 24px rgba(80, 80, 180, 0.12), 0 1.5px 6px rgba(0,0,0,0.08);\n  min-width: 240px;\n  padding: 12px 0;\n  z-index: 10000;\n  animation: fadeInMenu 0.18s;\n}\n\n@keyframes fadeInMenu {\n  from { opacity: 0; transform: translateY(16px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n.chat-widget-menu-item {\n  display: block;\n  width: 100%;\n  background: none;\n  border: none;\n  text-align: left;\n  padding: 16px 32px;\n  font-size: 17px;\n  color: #333;\n  cursor: pointer;\n  transition: background 0.18s, color 0.18s;\n  border-radius: 0;\n}\n\n.chat-widget-menu-item-modern {\n  font-weight: 500;\n  letter-spacing: 0.01em;\n}\n\n.chat-widget-menu-item:hover, .chat-widget-menu-item:focus {\n  background: linear-gradient(90deg, #f3f3fd 0%, #eaf6ff 100%);\n  color: #2575fc;\n}\n\n/* Demo overlay for widget simulation */\n.chat-widget-demo-overlay {\n  position: fixed;\n  bottom: 100px;\n  right: 40px;\n  width: 340px;\n  height: 420px;\n  background: rgba(30, 34, 90, 0.12);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 10001;\n  border-radius: 18px;\n  box-shadow: 0 8px 32px rgba(80, 80, 180, 0.18);\n}\n\n.chat-widget-demo-box {\n  background: #fff;\n  border-radius: 14px;\n  box-shadow: 0 2px 8px rgba(0,0,0,0.10);\n  padding: 32px 24px 24px 24px;\n  text-align: center;\n  width: 90%;\n  max-width: 300px;\n  font-size: 18px;\n  color: #333;\n  position: relative;\n}\n\n.chat-widget-demo-box.zoom { border-top: 4px solid #2575fc; }\n.chat-widget-demo-box.anthology { border-top: 4px solid #830065; }\n.chat-widget-demo-box.chatbot { border-top: 4px solid #1e90ff; }\n\n.chat-widget-demo-close {\n  margin-top: 24px;\n  background: #2575fc;\n  color: #fff;\n  border: none;\n  border-radius: 8px;\n  padding: 10px 24px;\n  font-size: 16px;\n  cursor: pointer;\n  transition: background 0.18s;\n}\n\n.chat-widget-demo-close:hover {\n  background: #6a11cb;\n} ";
  document.head.appendChild(style);

  // state.js
  var ChatWidgetState = class {
    constructor(widgets2) {
      this.widgets = widgets2;
      this.activeWidgetId = null;
      this.onDeactivateCallback = null;
    }
    activateWidget(widgetId, onDeactivate) {
      this.onDeactivateCallback = onDeactivate;
      this.widgets.forEach((widget) => {
        if (widget.id === widgetId) {
          widget.activate(() => {
            this.activeWidgetId = null;
            if (typeof this.onDeactivateCallback === "function") {
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
      this.widgets.forEach((widget) => widget.hide());
      this.activeWidgetId = null;
    }
  };

  // config.js
  var WidgetConfig = class _WidgetConfig {
    static DEFAULTS = {
      // UI positioning and styling
      ui: {
        position: {
          bottom: "32px",
          right: "32px",
          zIndex: "9999"
        }
      },
      // Widget lifecycle timing
      timing: {
        firstActivationDelay: 1500,
        subsequentActivationDelay: 300,
        deactivationDelay: 300,
        closeListenerRetryDelay: 500
      },
      // Retry mechanism configuration
      retry: {
        invokeRetryDelay: 200,
        invokeMaxRetries: 20,
        exponentialBackoffBase: 1.2,
        maxRetryDelay: 2e3
      },
      // Error handling
      errorHandling: {
        enableGracefulDegradation: true,
        logLevel: "warn",
        // 'error', 'warn', 'info', 'debug'
        enableErrorReporting: false,
        maxConsecutiveErrors: 3
      },
      // Configuration service
      configService: {
        baseUrl: "https://your-config-service.com",
        timeout: 5e3,
        retryAttempts: 2
      }
    };
    constructor(overrides = {}) {
      this.config = this.mergeDeep(_WidgetConfig.DEFAULTS, overrides);
      this.validateConfig();
    }
    get(path) {
      return this.getNestedValue(this.config, path);
    }
    set(path, value) {
      this.setNestedValue(this.config, path, value);
    }
    // Get timing configuration with optional widget-specific overrides
    getTimingConfig(widgetId = null) {
      const base = this.get("timing");
      if (widgetId && this.config.widgets && this.config.widgets[widgetId]?.timing) {
        return { ...base, ...this.config.widgets[widgetId].timing };
      }
      return base;
    }
    // Get retry configuration with optional widget-specific overrides
    getRetryConfig(widgetId = null) {
      const base = this.get("retry");
      if (widgetId && this.config.widgets && this.config.widgets[widgetId]?.retry) {
        return { ...base, ...this.config.widgets[widgetId].retry };
      }
      return base;
    }
    // Calculate exponential backoff delay
    calculateBackoffDelay(attempt, widgetId = null) {
      const retryConfig = this.getRetryConfig(widgetId);
      const baseDelay = retryConfig.invokeRetryDelay;
      const backoffBase = retryConfig.exponentialBackoffBase;
      const maxDelay = retryConfig.maxRetryDelay;
      const delay = Math.min(
        baseDelay * Math.pow(backoffBase, attempt),
        maxDelay
      );
      return Math.floor(delay);
    }
    // Validate configuration values
    validateConfig() {
      const timing = this.get("timing");
      const retry = this.get("retry");
      if (timing.firstActivationDelay < 0 || timing.subsequentActivationDelay < 0) {
        throw new Error("Activation delays must be non-negative");
      }
      if (retry.invokeMaxRetries < 1 || retry.invokeRetryDelay < 0) {
        throw new Error("Retry configuration must be positive");
      }
      if (retry.exponentialBackoffBase <= 1) {
        throw new Error("Exponential backoff base must be greater than 1");
      }
    }
    // Deep merge utility for nested configuration objects
    mergeDeep(target, source) {
      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          result[key] = this.mergeDeep(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    }
    // Get nested value using dot notation (e.g., 'ui.position.bottom')
    getNestedValue(obj, path) {
      return path.split(".").reduce((current, key) => current?.[key], obj);
    }
    // Set nested value using dot notation
    setNestedValue(obj, path, value) {
      const keys = path.split(".");
      const lastKey = keys.pop();
      const target = keys.reduce((current, key) => {
        if (!current[key] || typeof current[key] !== "object") {
          current[key] = {};
        }
        return current[key];
      }, obj);
      target[lastKey] = value;
    }
    // Load environment-specific overrides
    static loadEnvironmentConfig() {
      const env = "development";
      const envOverrides = {
        development: {
          errorHandling: { logLevel: "debug" },
          timing: { firstActivationDelay: 500 }
          // Faster for development
        },
        production: {
          errorHandling: { logLevel: "warn", enableErrorReporting: true }
        }
      };
      return envOverrides[env] || {};
    }
    // Create instance with environment-specific configuration
    static createWithEnvironment(overrides = {}) {
      const envConfig = _WidgetConfig.loadEnvironmentConfig();
      const mergedOverrides = new _WidgetConfig().mergeDeep(envConfig, overrides);
      return new _WidgetConfig(mergedOverrides);
    }
  };
  var defaultConfig = new WidgetConfig();

  // error-handler.js
  var ErrorHandler = class {
    constructor(config = defaultConfig) {
      this.config = config;
      this.errorCounts = /* @__PURE__ */ new Map();
      this.circuitBreakers = /* @__PURE__ */ new Map();
      this.setupGlobalErrorHandler();
    }
    setupGlobalErrorHandler() {
      if (this.config.get("errorHandling.enableGracefulDegradation")) {
        window.addEventListener("error", (event) => {
          if (this.isWidgetRelatedError(event)) {
            this.handleWidgetError(event.error, "global");
          }
        });
        window.addEventListener("unhandledrejection", (event) => {
          if (this.isWidgetRelatedPromiseRejection(event)) {
            this.handleWidgetError(event.reason, "promise");
          }
        });
      }
    }
    handleWidgetError(error, context, widgetId = "unknown") {
      const errorKey = `${widgetId}_${context}`;
      const currentCount = (this.errorCounts.get(errorKey) || 0) + 1;
      const maxErrors = this.config.get("errorHandling.maxConsecutiveErrors");
      this.errorCounts.set(errorKey, currentCount);
      this.logError(error, context, widgetId, currentCount);
      if (currentCount >= maxErrors) {
        this.activateCircuitBreaker(widgetId, context);
        return { success: false, circuitBreakerActive: true };
      }
      return { success: false, error };
    }
    activateCircuitBreaker(widgetId, context) {
      const breakerKey = `${widgetId}_${context}`;
      const breakerTimeout = 6e4;
      this.circuitBreakers.set(breakerKey, {
        active: true,
        activatedAt: Date.now(),
        timeout: breakerTimeout
      });
      setTimeout(() => this.resetCircuitBreaker(breakerKey), breakerTimeout);
    }
    resetCircuitBreaker(breakerKey) {
      this.circuitBreakers.delete(breakerKey);
    }
    isCircuitBreakerActive(widgetId, context) {
      const breakerKey = `${widgetId}_${context}`;
      const breaker = this.circuitBreakers.get(breakerKey);
      if (!breaker) return false;
      if (Date.now() - breaker.activatedAt > breaker.timeout) {
        this.resetCircuitBreaker(breakerKey);
        return false;
      }
      return breaker.active;
    }
    resetErrorCount(widgetId, context) {
      this.errorCounts.set(`${widgetId}_${context}`, 0);
    }
    setWidgetRegistry(registry) {
      this.widgetRegistry = registry;
    }
    findWidget(widgetId) {
      if (!this.widgetRegistry) return null;
      return this.widgetRegistry.get(widgetId) || null;
    }
    isWidgetRelatedError(event) {
      const errorSource = event.filename || event.error?.stack || "";
      return errorSource.includes("widget") || errorSource.includes("zoom") || errorSource.includes("anthology") || errorSource.includes("chatbot");
    }
    isWidgetRelatedPromiseRejection(event) {
      const reason = event.reason?.stack || event.reason?.message || "";
      return reason.includes("widget") || reason.includes("zoom") || reason.includes("anthology") || reason.includes("chatbot");
    }
    logError(error, context, widgetId, count = 1) {
      const logLevel = this.config.get("errorHandling.logLevel");
      const message = `Widget Error [${widgetId}:${context}:${count}]: ${error.message}`;
      if (logLevel === "warn") {
        console.warn(message);
      } else {
        console.error(message, error);
      }
    }
  };
  var defaultErrorHandler = new ErrorHandler();

  // logger.js
  var WidgetLogger = class {
    constructor(config = defaultConfig) {
      this.config = config;
    }
    debug(message, data = {}, widgetId = null) {
      if (this.shouldLog("debug")) {
        console.debug(this.format(widgetId, message), data);
      }
    }
    info(message, data = {}, widgetId = null) {
      if (this.shouldLog("info")) {
        console.info(this.format(widgetId, message), data);
      }
    }
    warn(message, data = {}, widgetId = null) {
      if (this.shouldLog("warn")) {
        console.warn(this.format(widgetId, message), data);
      }
    }
    error(message, data = {}, widgetId = null) {
      console.error(this.format(widgetId, message), data);
    }
    shouldLog(level) {
      const levels = { debug: 0, info: 1, warn: 2, error: 3 };
      const configLevel = this.config.get("errorHandling.logLevel");
      return levels[level] >= levels[configLevel];
    }
    format(widgetId, message) {
      return `[${widgetId || "SYSTEM"}] ${message}`;
    }
    startTimer(name, widgetId = null) {
      const startTime = performance.now();
      return {
        stop: () => performance.now() - startTime
      };
    }
    logWidgetLifecycle(event, widgetId, data = {}) {
      this.info(`Widget ${event}`, data, widgetId);
    }
    logWidgetActivation(widgetId, duration = null) {
      this.info("Widget activated", { activation_duration_ms: duration }, widgetId);
    }
    logWidgetDeactivation(widgetId, duration = null) {
      this.info("Widget deactivated", { deactivation_duration_ms: duration }, widgetId);
    }
    logScriptLoad(widgetId, src, success, duration = null, error = null) {
      if (success) {
        this.info("Script loaded", { src, duration_ms: duration }, widgetId);
      } else {
        this.error("Script load failed", { src, duration_ms: duration, error: error?.message }, widgetId);
      }
    }
    logPerformance(metric, value, widgetId = null, data = {}) {
      this.debug(`Performance: ${metric}`, { ...data, value }, widgetId);
    }
    logUserInteraction(action, widgetId = null, data = {}) {
      this.debug(`User ${action}`, data, widgetId);
    }
    logNetworkActivity(operation, url, status, duration = null, data = {}) {
      this.debug(`Network: ${operation}`, { url, status, duration_ms: duration, ...data });
    }
    logConfigChange(key, oldValue, newValue, widgetId = null) {
      this.debug(`Config changed: ${key}`, { old_value: oldValue, new_value: newValue }, widgetId);
    }
  };
  var defaultLogger = new WidgetLogger();

  // poll-until.js
  function pollUntil(predicate, { interval = 50, maxWait = 5e3 } = {}) {
    return new Promise((resolve, reject) => {
      const result = predicate();
      if (result) return resolve(result);
      const startTime = Date.now();
      const timer = setInterval(() => {
        const current = predicate();
        if (current) {
          clearInterval(timer);
          resolve(current);
          return;
        }
        if (Date.now() - startTime >= maxWait) {
          clearInterval(timer);
          reject(new Error(`pollUntil timed out after ${maxWait}ms`));
        }
      }, interval);
    });
  }

  // widgets/base-widget.js
  var BaseWidget = class {
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
      this.lifecycleHooks = { onMount: [], onUnmount: [], onActivate: [], onDeactivate: [], onError: [] };
      this.invokeRetryCount = 0;
      this.firstActivation = true;
      this.performanceTimers = /* @__PURE__ */ new Map();
      this.logger.info(`Widget initialized`, { widget_type: this.constructor.name }, this.id);
    }
    // Lifecycle hook management
    onMount(callback) {
      this.lifecycleHooks.onMount.push(callback);
      return this;
    }
    onUnmount(callback) {
      this.lifecycleHooks.onUnmount.push(callback);
      return this;
    }
    onActivate(callback) {
      this.lifecycleHooks.onActivate.push(callback);
      return this;
    }
    onDeactivate(callback) {
      this.lifecycleHooks.onDeactivate.push(callback);
      return this;
    }
    onError(callback) {
      this.lifecycleHooks.onError.push(callback);
      return this;
    }
    // Execute lifecycle hooks
    async executeHooks(hookName, ...args) {
      const hooks = this.lifecycleHooks[hookName] || [];
      const results = [];
      for (const hook of hooks) {
        try {
          const result = await hook.call(this, ...args);
          results.push({ success: true, result });
        } catch (error) {
          this.logger.error(`Hook ${hookName} failed`, { error: error.message }, this.id);
          results.push({ success: false, error });
          if (hookName !== "onError") {
            await this.executeHooks("onError", error, hookName);
          }
        }
      }
      return results;
    }
    // Mount widget (setup DOM, event listeners, etc.)
    async mount() {
      if (this.state.mounted) {
        this.logger.warn(`Widget already mounted`, {}, this.id);
        return;
      }
      const timer = this.logger.startTimer("mount", this.id);
      try {
        this.logger.logWidgetLifecycle("mounting", this.id);
        await this.executeHooks("onMount", "before");
        await this.performMount();
        await this.executeHooks("onMount", "after");
        this.state.mounted = true;
        const duration = timer.stop();
        this.logger.logWidgetLifecycle("mounted", this.id, { mount_duration_ms: duration });
      } catch (error) {
        timer.stop();
        this.logger.error(`Widget mount failed`, { error: error.message }, this.id);
        await this.errorHandler.handleWidgetError(error, "mount", this.id);
        throw error;
      }
    }
    // Unmount widget (cleanup DOM, event listeners, etc.)
    async unmount() {
      if (!this.state.mounted) {
        this.logger.warn(`Widget not mounted, cannot unmount`, {}, this.id);
        return;
      }
      const timer = this.logger.startTimer("unmount", this.id);
      try {
        this.logger.logWidgetLifecycle("unmounting", this.id);
        await this.executeHooks("onUnmount", "before");
        await this.performUnmount();
        await this.executeHooks("onUnmount", "after");
        this.state.mounted = false;
        const duration = timer.stop();
        this.logger.logWidgetLifecycle("unmounted", this.id, { unmount_duration_ms: duration });
      } catch (error) {
        timer.stop();
        this.logger.error(`Widget unmount failed`, { error: error.message }, this.id);
        await this.errorHandler.handleWidgetError(error, "unmount", this.id);
      }
    }
    // Abstract methods to be implemented by subclasses
    async performMount() {
      this.logger.debug(`Default mount performed`, {}, this.id);
    }
    async performUnmount() {
      this.removeCloseListener();
      this.clearPerformanceTimers();
      this.logger.debug(`Default unmount performed`, {}, this.id);
    }
    // Performance timer management
    startPerformanceTimer(name) {
      const timer = this.logger.startTimer(name, this.id);
      this.performanceTimers.set(name, timer);
      return timer;
    }
    stopPerformanceTimer(name) {
      const timer = this.performanceTimers.get(name);
      if (timer) {
        const duration = timer.stop();
        this.performanceTimers.delete(name);
        return duration;
      }
      return null;
    }
    clearPerformanceTimers() {
      this.performanceTimers.clear();
    }
    async injectScript() {
      if (this.state.initialized) return { success: true };
      const timer = this.startPerformanceTimer("script_inject");
      try {
        this.logger.info(`Injecting script`, { src: this.config.src }, this.id);
        const script = document.createElement("script");
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
            const recovery = await this.errorHandler.handleWidgetError(
              new Error(`Failed to load script: ${this.config.src}`),
              "script_load",
              this.id
            );
            resolve({ success: false, error, recovery });
          };
          document.head.appendChild(script);
        });
      } catch (error) {
        timer.stop();
        this.logger.error(`Script injection error`, { error: error.message }, this.id);
        return await this.errorHandler.handleWidgetError(error, "script_load", this.id);
      }
    }
    async invokeWidget() {
      if (this.errorHandler.isCircuitBreakerActive(this.id, "invoke")) {
        console.warn(`Widget ${this.id}: Circuit breaker active, skipping invoke`);
        return;
      }
      const launchButton = document.querySelector(this.config.invokeSelector);
      if (launchButton) {
        const clickMethods = [
          () => launchButton.click(),
          () => {
            const clickEvent = new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window
            });
            launchButton.dispatchEvent(clickEvent);
          },
          () => {
            if (launchButton.onclick) {
              launchButton.onclick.call(launchButton);
            } else {
              throw new Error("No onclick handler found");
            }
          }
        ];
        let lastError = null;
        for (const method of clickMethods) {
          try {
            method();
            return;
          } catch (error) {
            lastError = error;
          }
        }
        await this.errorHandler.handleWidgetError(
          new Error(`All click methods failed: ${lastError?.message}`),
          "invoke",
          this.id
        );
      } else {
        const retryConfig = this.widgetConfig.getRetryConfig(this.id);
        const retryDelay = this.config.invokeRetryDelay || this.widgetConfig.calculateBackoffDelay(this.invokeRetryCount, this.id);
        const maxRetries = this.config.invokeMaxRetries || retryConfig.invokeMaxRetries;
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
      elements.forEach((el) => {
        const isLaunchButton = el.id === this.config.launcherId || this.config.invokeSelector && el.matches(this.config.invokeSelector);
        if (isLaunchButton) {
          Object.assign(el.style, {
            visibility: show ? "visible" : "hidden",
            opacity: show ? "1" : "0"
          });
        } else {
          Object.assign(el.style, {
            display: show ? "" : "none",
            visibility: show ? "visible" : "hidden",
            opacity: show ? "1" : "0"
          });
        }
      });
    }
    getElementsToToggle() {
      return this.config.elementSelectors?.flatMap(
        (selector) => Array.from(document.querySelectorAll(selector))
      ) || [];
    }
    attachCloseListener() {
      if (!this.state.active) return;
      this.callbacks.closeListener = () => this.deactivate(this.callbacks.onDeactivate);
      const closeBtn = document.querySelector(this.config.closeSelector);
      if (closeBtn) {
        closeBtn.addEventListener("click", this.callbacks.closeListener);
      } else {
        const retryDelay = this.widgetConfig.get("timing.closeListenerRetryDelay");
        setTimeout(() => this.attachCloseListener(), retryDelay);
      }
    }
    removeCloseListener() {
      if (!this.callbacks.closeListener) return;
      const closeBtn = document.querySelector(this.config.closeSelector);
      closeBtn?.removeEventListener("click", this.callbacks.closeListener);
      this.callbacks.closeListener = null;
    }
    async activate(onDeactivate) {
      const activationTimer = this.startPerformanceTimer("activation");
      try {
        this.logger.logWidgetLifecycle("activating", this.id);
        if (this.errorHandler.isCircuitBreakerActive(this.id, "widget_init")) {
          this.logger.warn(`Circuit breaker active, activation blocked`, {}, this.id);
          return;
        }
        await this.executeHooks("onActivate", "before");
        if (!this.state.mounted) {
          await this.mount();
        }
        if (!this.state.initialized) {
          const scriptResult = await this.injectScript();
          if (!scriptResult.success && !scriptResult.recovery?.success) {
            await this.errorHandler.handleWidgetError(
              new Error("Script injection failed and recovery unsuccessful"),
              "widget_init",
              this.id
            );
            return;
          }
        }
        this.state.active = true;
        this.callbacks.onDeactivate = onDeactivate;
        const timingConfig = this.widgetConfig.getTimingConfig(this.id);
        const maxWait = this.firstActivation ? timingConfig.firstActivationDelay : timingConfig.subsequentActivationDelay;
        try {
          await pollUntil(
            () => document.querySelector(this.config.invokeSelector),
            { interval: 50, maxWait }
          );
        } catch {
          this.logger.debug("Invoke selector not found within timeout, proceeding with retry", {}, this.id);
        }
        if (this.state.active) {
          try {
            await this.invokeWidget();
            this.toggleVisibility(true);
            this.attachCloseListener();
            this.firstActivation = false;
            await this.executeHooks("onActivate", "after");
            const duration = activationTimer.stop();
            this.logger.logWidgetActivation(this.id, duration);
          } catch (error) {
            activationTimer.stop();
            await this.errorHandler.handleWidgetError(error, "widget_init", this.id);
          }
        } else {
          activationTimer.stop();
        }
      } catch (error) {
        activationTimer.stop();
        this.logger.error(`Widget activation failed`, { error: error.message }, this.id);
        await this.errorHandler.handleWidgetError(error, "widget_init", this.id);
      }
    }
    async deactivate(callback) {
      const deactivationTimer = this.startPerformanceTimer("deactivation");
      try {
        this.logger.logWidgetLifecycle("deactivating", this.id);
        await this.executeHooks("onDeactivate", "before");
        this.state.active = false;
        this.removeCloseListener();
        this.toggleVisibility(false);
        await this.executeHooks("onDeactivate", "after");
        const duration = deactivationTimer.stop();
        this.logger.logWidgetDeactivation(this.id, duration);
        const deactivationDelay = this.widgetConfig.get("timing.deactivationDelay");
        if (callback) {
          setTimeout(callback, deactivationDelay);
        }
        this.callbacks.onDeactivate = null;
      } catch (error) {
        deactivationTimer.stop();
        this.logger.error(`Widget deactivation error`, { error: error.message }, this.id);
        await this.errorHandler.handleWidgetError(error, "deactivate", this.id);
      }
    }
    hide() {
      this.deactivate();
    }
  };

  // widgets/zoom.js
  var ZoomWidget = class extends BaseWidget {
    constructor(config = {}) {
      super({
        id: "zoom",
        displayName: config.displayName || "Zoom Contact Center",
        order: config.order,
        scriptId: "zoom-cc-sdk",
        src: "https://us01ccistatic.zoom.us/us01cci/web-sdk/zcc-sdk.js",
        attributes: {
          "data-apikey": config.apiKey || "DEMO_KEY",
          "data-env": config.env || "us01"
        },
        invokeSelector: ".livesdk__invitation",
        closeSelector: ".css-1u2heh6",
        elementSelectors: ['[class*="livesdk"]', '[class*="zcc"]', '[id*="zcc"]', '[class*="zoom"]', 'button[aria-label="Leave"]'],
        invokeRetryDelay: 150,
        invokeMaxRetries: 20
      });
      if (!config.apiKey || config.apiKey === "DEMO_KEY") {
        console.warn("Zoom: API key not configured. Please add your Zoom API key to the configuration.");
      }
    }
    attachCloseListener() {
      if (!this.state.active) return;
      this.callbacks.closeListener = () => this.deactivate(this.callbacks.onDeactivate);
      this.callbacks.documentClickListener = (event) => {
        const target = event.target;
        if (this.state.active && (target.tagName === "BUTTON" || target.closest("button"))) {
          console.log("\u{1F50D} Zoom: Button clicked", {
            tag: target.tagName,
            ariaLabel: target.getAttribute("aria-label"),
            className: target.className,
            id: target.id,
            closestButton: target.closest("button")?.outerHTML?.substring(0, 200)
          });
        }
        const isNextButton = target.matches('button[aria-label="Next"]') || target.matches(".css-1mv3bnz") || target.closest('button[aria-label="Next"]') || target.closest(".css-1mv3bnz");
        const isLeaveButton = target.matches('button[aria-label="Leave"]') || target.matches(".css-1rzxt70") || target.closest('button[aria-label="Leave"]') || target.closest(".css-1rzxt70");
        const isOriginalClose = target.matches(".css-1u2heh6") || target.closest(".css-1u2heh6");
        if ((isNextButton || isLeaveButton || isOriginalClose) && this.state.active) {
          console.log("\u2705 Zoom: Close button detected, calling deactivate", {
            isNextButton,
            isLeaveButton,
            isOriginalClose
          });
          this.callbacks.closeListener();
        }
      };
      document.addEventListener("click", this.callbacks.documentClickListener, true);
      this.attachDirectListeners();
    }
    attachDirectListeners() {
      const closeSelectors = [
        ".css-1u2heh6",
        'button[aria-label="Next"]',
        'button[aria-label="Leave"]',
        ".css-1mv3bnz",
        ".css-1rzxt70"
      ];
      closeSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          button.removeEventListener("click", this.callbacks.closeListener);
          button.addEventListener("click", this.callbacks.closeListener);
        });
      });
      if (this.state.active && document.querySelectorAll(closeSelectors.join(",")).length === 0) {
        setTimeout(() => this.attachDirectListeners(), 500);
      }
    }
    removeCloseListener() {
      if (!this.callbacks.closeListener) return;
      if (this.callbacks.documentClickListener) {
        document.removeEventListener("click", this.callbacks.documentClickListener, true);
        this.callbacks.documentClickListener = null;
      }
      const closeSelectors = [
        ".css-1u2heh6",
        'button[aria-label="Next"]',
        'button[aria-label="Leave"]',
        ".css-1mv3bnz",
        ".css-1rzxt70"
      ];
      closeSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          button.removeEventListener("click", this.callbacks.closeListener);
        });
      });
      this.callbacks.closeListener = null;
    }
  };

  // widgets/anthology.js
  var AnthologyWidget = class extends BaseWidget {
    constructor(config = {}) {
      super({
        id: "anthology",
        displayName: config.displayName || "Live Chat Support",
        order: config.order,
        scriptId: config.scriptId || "demo-anthology-script",
        invokeSelector: "#amazon-connect-open-widget-button"
      });
      this.active = false;
      this.initialized = false;
      this.scriptLoaded = false;
      this.firstClose = true;
      this.originalConfig = config;
      if (!this.originalConfig.snippetId) {
        console.warn("Anthology: Snippet ID not configured. Please add your Amazon Connect snippet ID to the configuration.");
      }
      if (!this.originalConfig.scriptId) {
        console.warn("Anthology: Script ID not configured. Please add your Amazon Connect script ID to the configuration.");
      }
      if (!this.originalConfig.institutionAlias) {
        console.warn("Anthology: Institution alias not configured. Please add your institution alias to the configuration.");
      }
    }
    loadScriptOnce() {
      if (this.scriptLoaded || document.getElementById(this.scriptId)) {
        console.log("\u{1F50D} Anthology: Script already loaded, skipping");
        return;
      }
      console.log("\u{1F50D} Anthology: Loading Amazon Connect script...");
      this.scriptLoaded = true;
      (function(w, d, x, id, config, originalConfig) {
        console.log("\u{1F50D} Anthology: Creating script element");
        var s = d.createElement("script");
        s.src = "https://dtn7rvxwwlhud.cloudfront.net/amazon-connect-chat-interface-client.js";
        s.async = true;
        s.id = id;
        s.onload = function() {
          console.log("\u{1F50D} Anthology: Amazon Connect script loaded successfully");
        };
        s.onerror = function() {
          console.log("\u274C Anthology: Amazon Connect script failed to load");
        };
        d.getElementsByTagName("head")[0].appendChild(s);
        console.log("\u{1F50D} Anthology: Script element added to head");
        w[x] = w[x] || function() {
          console.log("\u{1F50D} Anthology: Amazon Connect function called with args:", arguments);
          (w[x].ac = w[x].ac || []).push(arguments);
        };
        console.log("\u{1F50D} Anthology: Checking config:", originalConfig);
        if (originalConfig.snippetId) {
          console.log("\u{1F50D} Anthology: SnippetId found, applying configuration...");
          w[x]("styles", {
            iconType: "CHAT",
            openChat: {
              color: "#ffffff",
              backgroundColor: "#830065"
            },
            closeChat: {
              color: "#ffffff",
              backgroundColor: "#830065"
            }
          });
          w[x]("snippetId", originalConfig.snippetId);
          w[x]("supportedMessagingContentTypes", [
            "text/plain",
            "text/markdown",
            "application/vnd.amazonaws.connect.message.interactive",
            "application/vnd.amazonaws.connect.message.interactive.response"
          ]);
          w[x]("customDisplayNames", {
            transcript: {
              botMessageDisplayName: "Virtual Agent"
            }
          });
          w[x]("mockLexBotTyping", true);
          w[x]("contactAttributes", {
            institutionAlias: originalConfig.institutionAlias || "default"
          });
          w[x]("customizationObject", {
            composer: {
              disableEmojiPicker: true
            }
          });
          config.initialized = true;
          setTimeout(() => {
            const elements = config.getElementsToToggle();
            elements.forEach((el) => el.style.display = "none");
          }, 2e3);
        }
      })(window, document, "amazon_connect", this.scriptId, this, this.originalConfig);
    }
    getElementsToToggle() {
      const allElements = Array.from(document.querySelectorAll('iframe[src*="amazon"], [id*="amazon"], [class*="amazon"]'));
      const closeButtonSelectors = [
        'button[data-testid="close-chat-button"]',
        'button[aria-label="Close chat"]',
        "button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa",
        'button[class*="acCloseButtonStyles"]',
        "#amazon-connect-close-widget-button",
        'button[id="amazon-connect-close-widget-button"]',
        'button[aria-label="Minimize Chat"]',
        'button[class*="acCloseButton"]'
      ];
      return allElements.filter((el) => {
        return !closeButtonSelectors.some((selector) => {
          try {
            return el.matches(selector);
          } catch (e) {
            return false;
          }
        });
      });
    }
    async activate(onDeactivate) {
      console.log("\u{1F50D} Anthology: Activating widget", { scriptLoaded: this.scriptLoaded });
      this.state.active = true;
      this.callbacks.onDeactivate = onDeactivate;
      if (!this.scriptLoaded) {
        console.log("\u{1F50D} Anthology: Loading script for first time");
        this.loadScriptOnce();
      }
      const maxWait = this.scriptLoaded ? 500 : 5e3;
      try {
        await pollUntil(
          () => document.querySelector(this.config.invokeSelector),
          { interval: 50, maxWait }
        );
      } catch {
        console.log("\u{1F50D} Anthology: Invoke selector not found within timeout, proceeding with retry");
      }
      if (this.state.active) {
        console.log("\u{1F50D} Anthology: Invoking widget");
        this.invokeWidget();
        this.toggleVisibility(true);
        this.attachCloseListener();
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
      console.log("\u{1F50D} Anthology: Production mode - button click detection disabled, relying on widget frame state monitoring only");
      this.setupAmazonConnectStateMonitoring();
    }
    attachDirectListeners() {
      const closeSelectors = [
        'button[data-testid="close-chat-button"]',
        'button[aria-label="Close chat"]',
        "button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa",
        'button[class*="acCloseButtonStyles"]'
        // Generic catch for all acCloseButtonStyles variants
      ];
      const minimizeSelectors = [
        "#amazon-connect-close-widget-button",
        'button[id="amazon-connect-close-widget-button"]',
        'button[aria-label="Minimize Chat"]',
        'button[class*="acCloseButton"]:not([class*="acCloseButtonStyles"])'
        // acCloseButton but not acCloseButtonStyles
      ];
      const startChatSelectors = [
        "#amazon-connect-open-widget-button",
        'button[id="amazon-connect-open-widget-button"]',
        'button[aria-label="Start Chat"]'
      ];
      closeSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          button.removeEventListener("click", this.callbacks.closeListener);
          button.addEventListener("click", this.callbacks.closeListener);
        });
      });
      const allButtons = document.querySelectorAll("button");
      allButtons.forEach((button) => {
        const text = button.textContent.trim();
        if (text === "Close") {
          button.removeEventListener("click", this.callbacks.closeListener);
          button.addEventListener("click", this.callbacks.closeListener);
        }
      });
      minimizeSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          button.removeEventListener("click", this.callbacks.closeListener);
        });
      });
      startChatSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          button.removeEventListener("click", this.callbacks.closeListener);
        });
      });
      if (this.state.active && document.querySelectorAll([...closeSelectors, ...minimizeSelectors, ...startChatSelectors].join(",")).length === 0) {
        setTimeout(() => this.attachDirectListeners(), 500);
      }
    }
    setupAmazonConnectStateMonitoring() {
      if (!this.state.active) return;
      console.log("\u{1F50D} Anthology: Setting up Amazon Connect widget state monitoring");
      const monitorWidgetFrame = () => {
        const widgetFrame = document.getElementById("amazon-connect-widget-frame");
        if (widgetFrame) {
          const initialClass = widgetFrame.className;
          const hasShowClass = initialClass.includes("show");
          console.log("\u{1F50D} Anthology: Found Amazon Connect widget frame:", {
            className: initialClass,
            hasShowClass
          });
          this.callbacks.widgetFrameObserver = new MutationObserver((mutations) => {
            if (!this.state.active) return;
            mutations.forEach((mutation) => {
              if (mutation.type === "attributes" && mutation.attributeName === "class") {
                const currentClass = widgetFrame.className;
                const currentlyHasShow = currentClass.includes("show");
                const previouslyHadShow = mutation.oldValue?.includes("show") ?? false;
                console.log("\u{1F50D} Anthology: Widget frame class changed:", {
                  oldClass: mutation.oldValue,
                  newClass: currentClass,
                  previouslyHadShow,
                  currentlyHasShow
                });
                if (previouslyHadShow && !currentlyHasShow) {
                  console.log("\u{1F50D} Anthology: Amazon Connect chat closed/minimized - returning to unified menu");
                  setTimeout(() => {
                    if (this.state.active) {
                      this.callbacks.closeListener();
                    }
                  }, 300);
                }
              }
            });
          });
          this.callbacks.widgetFrameObserver.observe(widgetFrame, {
            attributes: true,
            attributeFilter: ["class"],
            attributeOldValue: true
          });
          console.log("\u{1F50D} Anthology: Widget frame monitoring active");
        } else {
          if (this.state.active) {
            console.log("\u{1F50D} Anthology: Amazon Connect widget frame not found yet, retrying...");
            setTimeout(monitorWidgetFrame, 1e3);
          }
        }
      };
      this.callbacks.widgetContainerObserver = new MutationObserver((mutations) => {
        if (!this.state.active) return;
        mutations.forEach((mutation) => {
          if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
            for (let node of mutation.removedNodes) {
              if (node.nodeType === 1 && (node.id === "amazon-connect-chat-widget" || node.id === "amazon-connect-widget-frame" || node.querySelector("#amazon-connect-chat-widget") || node.querySelector("#amazon-connect-widget-frame"))) {
                console.log("\u{1F50D} Anthology: Amazon Connect widget removed from DOM");
                if (this.state.active) {
                  this.callbacks.closeListener();
                }
                return;
              }
            }
          }
        });
      });
      this.callbacks.widgetContainerObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
      monitorWidgetFrame();
    }
    removeCloseListener() {
      if (!this.callbacks.closeListener) return;
      if (this.callbacks.documentClickListener) {
        document.removeEventListener("click", this.callbacks.documentClickListener, true);
        this.callbacks.documentClickListener = null;
      }
      const allButtonSelectors = [
        'button[data-testid="close-chat-button"]',
        'button[aria-label="Close chat"]',
        "button.sc-htoDjs.jkDoJG.sc-iAyFgw.gswgLa",
        'button[class*="acCloseButtonStyles"]',
        // Generic match for all variants
        "#amazon-connect-close-widget-button",
        'button[id="amazon-connect-close-widget-button"]',
        'button[aria-label="Minimize Chat"]',
        'button[class*="acCloseButton"]',
        "#amazon-connect-open-widget-button",
        'button[id="amazon-connect-open-widget-button"]',
        'button[aria-label="Start Chat"]'
      ];
      allButtonSelectors.forEach((selector) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach((button) => {
          button.removeEventListener("click", this.callbacks.closeListener);
        });
      });
      const allButtons = document.querySelectorAll("button");
      allButtons.forEach((button) => {
        const text = button.textContent.trim();
        if (text === "Close" || text.includes("Minimize")) {
          button.removeEventListener("click", this.callbacks.closeListener);
        }
      });
      if (this.callbacks.widgetFrameObserver) {
        this.callbacks.widgetFrameObserver.disconnect();
        this.callbacks.widgetFrameObserver = null;
        console.log("\u{1F50D} Anthology: Widget frame observer disconnected");
      }
      if (this.callbacks.widgetContainerObserver) {
        this.callbacks.widgetContainerObserver.disconnect();
        this.callbacks.widgetContainerObserver = null;
        console.log("\u{1F50D} Anthology: Widget container observer disconnected");
      }
      this.callbacks.closeListener = null;
    }
  };

  // widgets/chatbot.js
  var ChatbotWidget = class extends BaseWidget {
    constructor(config = {}) {
      super({
        id: "chatbot",
        displayName: config.displayName || "Student Support Bot",
        order: config.order,
        scriptId: config.scriptId || "IS_CV_PUBLIC_HOOK",
        src: config.src || "https://vccs-ws.iuc.intrasee.com/vccsoda/IS_CV_PUBLIC_HOOK.js",
        attributes: {
          "data-org": config.org || "DEMO_ORG",
          "type": "text/javascript"
        },
        launcherId: config.launcherId || "idalogin",
        invokeSelector: "#idalogin",
        closeSelector: ".oda-chat-popup-action.oda-chat-filled.oda-chat-flex",
        elementSelectors: ['[class*="oda-chat"]', '[id*="oda"]', '[class*="isCV"]', '[id*="isChat"]', "#isChatWelcomeBubble", "#isChatIconWrapper"]
      });
      if (!config.org || config.org === "DEMO_ORG") {
        console.warn("Chatbot: Organization not configured. Please add your organization ID to the configuration.");
      }
    }
    async activate(onDeactivate) {
      this.state.active = true;
      this.callbacks.onDeactivate = onDeactivate;
      if (!this.state.initialized) {
        await this.injectScript();
      }
      const maxWait = this.firstActivation ? 5e3 : 2e3;
      try {
        await pollUntil(
          () => document.querySelector(this.config.invokeSelector),
          { interval: 50, maxWait }
        );
      } catch {
        console.log("\u{1F50D} Chatbot: Invoke selector not found within timeout, proceeding with retry");
      }
      if (this.state.active) {
        this.invokeWidget();
        this.toggleVisibility(true);
        this.attachCloseListener();
        this.firstActivation = false;
      }
    }
    getElementsToToggle() {
      const launcherButton = document.getElementById(this.config.launcherId);
      const allElements = this.config.elementSelectors.flatMap(
        (selector) => Array.from(document.querySelectorAll(selector))
      );
      return allElements.filter((element) => element !== launcherButton);
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
      this.callbacks.documentClickListener = (event) => {
        const target = event.target;
        const isCloseOrMinimizeButton = target.matches(".oda-chat-popup-action.oda-chat-filled.oda-chat-flex") || target.matches("#oda-chat-collapse") || target.matches('li[data-value="collapse"]') || target.closest(".oda-chat-popup-action.oda-chat-filled.oda-chat-flex") || target.closest("#oda-chat-collapse") || target.closest('li[data-value="collapse"]') || target.textContent && target.textContent.includes("Minimize conversation");
        if (isCloseOrMinimizeButton && this.state.active) {
          console.log("\u{1F50D} Chatbot: Close or minimize button clicked - returning to unified menu");
          this.callbacks.closeListener();
        }
      };
      document.addEventListener("click", this.callbacks.documentClickListener, true);
    }
    removeCloseListener() {
      if (!this.callbacks.closeListener) return;
      if (this.callbacks.documentClickListener) {
        document.removeEventListener("click", this.callbacks.documentClickListener, true);
        this.callbacks.documentClickListener = null;
      }
      this.callbacks.closeListener = null;
    }
  };

  // mount-widgets.js
  async function mountAllWidgets(widgets2, logger) {
    await Promise.all(widgets2.map(
      (widget) => widget.mount().catch((error) => {
        logger.error(`Failed to mount widget ${widget.id}`, { error: error.message });
      })
    ));
  }

  // fetch-config.js
  var DEFAULT_CONFIG = {
    zoom: { enabled: false },
    anthology: { enabled: false },
    chatbot: { enabled: false }
  };
  async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.ok) {
        return await response.json();
      }
    } finally {
      clearTimeout(timer);
    }
    return null;
  }
  async function loadClientConfig(windowRef, configServiceUrl, timeoutMs) {
    if (windowRef.CHAT_WIDGET_CONFIG) {
      return windowRef.CHAT_WIDGET_CONFIG;
    }
    try {
      const domain = windowRef.location.hostname;
      const config = await fetchWithTimeout(`${configServiceUrl}/config/${domain}`, timeoutMs);
      if (config) return config;
    } catch (error) {
      console.warn("Could not load client config, using defaults");
    }
    return DEFAULT_CONFIG;
  }

  // index.js
  function getClientConfig() {
    const configService = defaultConfig.get("configService");
    return loadClientConfig(window, configService.baseUrl, configService.timeout);
  }
  var widgets = [];
  var widgetRegistry = /* @__PURE__ */ new Map();
  var unifiedButtonContainer = null;
  var unifiedButton = null;
  var menu = null;
  async function initializeWidgets() {
    try {
      defaultLogger.info("Initializing chat widget system");
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
      widgets.sort((a, b) => {
        const orderA = a.config?.order ?? 999;
        const orderB = b.config?.order ?? 999;
        return orderA - orderB;
      });
      defaultErrorHandler.setWidgetRegistry(widgetRegistry);
      if (widgets.length === 0) {
        defaultLogger.warn("No chat widgets configured for this domain");
        return;
      }
      defaultLogger.info(`Initialized ${widgets.length} widgets: ${widgets.map((w) => w.id).join(", ")}`);
      await mountAllWidgets(widgets, defaultLogger);
      const state = new ChatWidgetState(widgets);
      createUnifiedButton(state);
    } catch (error) {
      defaultLogger.error("Widget system initialization failed", { error: error.message });
      await defaultErrorHandler.handleWidgetError(error, "system_init");
    }
  }
  function setUnifiedButtonVisibility(visible) {
    if (unifiedButtonContainer) {
      unifiedButtonContainer.style.display = visible ? "flex" : "none";
    }
  }
  function isMenuOpen() {
    return menu.style.display === "block";
  }
  function openMenu() {
    menu.style.display = "block";
    unifiedButton.setAttribute("aria-expanded", "true");
    const firstItem = menu.querySelector('[role="menuitem"]');
    if (firstItem) firstItem.focus();
  }
  function closeMenu() {
    menu.style.display = "none";
    unifiedButton.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  }
  function handleButtonKeydown(event) {
    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
      return;
    }
    if (event.key === "Escape" && isMenuOpen()) {
      event.preventDefault();
      closeMenu();
      unifiedButton.focus();
    }
  }
  function handleMenuKeydown(event) {
    const items = [...menu.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const keyActions = {
      "Escape": () => {
        closeMenu();
        unifiedButton.focus();
      },
      "Home": () => items[0]?.focus(),
      "End": () => items[items.length - 1]?.focus(),
      "ArrowDown": () => items[(index + 1) % items.length]?.focus(),
      "ArrowUp": () => items[(index - 1 + items.length) % items.length]?.focus()
    };
    const action = keyActions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }
  function setupOutsideClickHandler() {
    document.addEventListener("click", (event) => {
      if (!isMenuOpen()) return;
      if (unifiedButtonContainer.contains(event.target)) return;
      closeMenu();
    });
  }
  function createContainer(uiConfig) {
    const container = document.createElement("div");
    container.id = "chat-widget-container";
    container.style.position = "fixed";
    container.style.bottom = uiConfig.bottom;
    container.style.right = uiConfig.right;
    container.style.zIndex = uiConfig.zIndex;
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "flex-end";
    return container;
  }
  function createMainButton() {
    const button = document.createElement("button");
    button.id = "chat-widget-main-btn";
    button.innerHTML = '<span class="chat-widget-icon"></span><span class="chat-widget-label">Chat</span>';
    button.className = "chat-widget-btn chat-widget-btn-modern";
    button.setAttribute("aria-label", "Open chat options menu");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", toggleMenu);
    button.addEventListener("keydown", handleButtonKeydown);
    return button;
  }
  function createMenuItem(widget, state) {
    const item = document.createElement("button");
    item.innerText = widget.displayName;
    item.className = "chat-widget-menu-item chat-widget-menu-item-modern";
    item.setAttribute("role", "menuitem");
    item.setAttribute("tabindex", "0");
    item.onclick = () => {
      closeMenu();
      setUnifiedButtonVisibility(false);
      state.activateWidget(widget.id, () => setUnifiedButtonVisibility(true));
    };
    return item;
  }
  function createMenuElement(state) {
    const menuElement = document.createElement("div");
    menuElement.id = "chat-widget-menu";
    menuElement.style.display = "none";
    menuElement.className = "chat-widget-menu chat-widget-menu-modern";
    menuElement.setAttribute("role", "menu");
    menuElement.setAttribute("aria-label", "Chat options");
    widgets.forEach((widget) => {
      menuElement.appendChild(createMenuItem(widget, state));
    });
    menuElement.addEventListener("keydown", handleMenuKeydown);
    return menuElement;
  }
  function createUnifiedButton(state) {
    const uiConfig = defaultConfig.get("ui.position");
    unifiedButtonContainer = createContainer(uiConfig);
    unifiedButton = createMainButton();
    menu = createMenuElement(state);
    unifiedButtonContainer.appendChild(unifiedButton);
    unifiedButtonContainer.appendChild(menu);
    document.body.appendChild(unifiedButtonContainer);
    setupOutsideClickHandler();
  }
  window.addEventListener("DOMContentLoaded", initializeWidgets);
})();
