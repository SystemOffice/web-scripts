// Base widget class for chat service integrations
import { defaultConfig } from '../config.js';
import { defaultErrorHandler } from '../error-handler.js';
import { defaultLogger } from '../logger.js';
import { pollUntil } from '../poll-until.js';

export class BaseWidget {
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
    this.performanceTimers = new Map();

    this.logger.info(`Widget initialized`, { widget_type: this.constructor.name }, this.id);
  }

  // Lifecycle hook management
  onMount(callback) {
    this.lifecycleHooks.onMount.push(callback);
    return this; // Enable chaining
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

        // Execute error hooks if this isn't already an error hook
        if (hookName !== 'onError') {
          await this.executeHooks('onError', error, hookName);
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

    const timer = this.logger.startTimer('mount', this.id);

    try {
      this.logger.logWidgetLifecycle('mounting', this.id);

      // Execute pre-mount hooks
      await this.executeHooks('onMount', 'before');

      // Perform mounting logic
      await this.performMount();

      // Execute post-mount hooks
      await this.executeHooks('onMount', 'after');

      this.state.mounted = true;
      const duration = timer.stop();

      this.logger.logWidgetLifecycle('mounted', this.id, { mount_duration_ms: duration });

    } catch (error) {
      timer.stop();
      this.logger.error(`Widget mount failed`, { error: error.message }, this.id);
      await this.errorHandler.handleWidgetError(error, 'mount', this.id);
      throw error;
    }
  }

  // Unmount widget (cleanup DOM, event listeners, etc.)
  async unmount() {
    if (!this.state.mounted) {
      this.logger.warn(`Widget not mounted, cannot unmount`, {}, this.id);
      return;
    }

    const timer = this.logger.startTimer('unmount', this.id);

    try {
      this.logger.logWidgetLifecycle('unmounting', this.id);

      // Execute pre-unmount hooks
      await this.executeHooks('onUnmount', 'before');

      // Perform unmounting logic
      await this.performUnmount();

      // Execute post-unmount hooks
      await this.executeHooks('onUnmount', 'after');

      this.state.mounted = false;
      const duration = timer.stop();

      this.logger.logWidgetLifecycle('unmounted', this.id, { unmount_duration_ms: duration });

    } catch (error) {
      timer.stop();
      this.logger.error(`Widget unmount failed`, { error: error.message }, this.id);
      await this.errorHandler.handleWidgetError(error, 'unmount', this.id);
    }
  }

  // Abstract methods to be implemented by subclasses
  async performMount() {
    // Default implementation - can be overridden
    this.logger.debug(`Default mount performed`, {}, this.id);
  }

  async performUnmount() {
    // Default implementation - cleanup
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

    const timer = this.startPerformanceTimer('script_inject');

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

      // Add error handling for script loading
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
            'script_load',
            this.id
          );

          resolve({ success: false, error, recovery });
        };

        document.head.appendChild(script);
      });

    } catch (error) {
      timer.stop();
      this.logger.error(`Script injection error`, { error: error.message }, this.id);
      return await this.errorHandler.handleWidgetError(error, 'script_load', this.id);
    }
  }

  async invokeWidget() {
    // Check circuit breaker before attempting invoke
    if (this.errorHandler.isCircuitBreakerActive(this.id, 'invoke')) {
      console.warn(`Widget ${this.id}: Circuit breaker active, skipping invoke`);
      return;
    }

    const launchButton = document.querySelector(this.config.invokeSelector);
    if (launchButton) {
      // Try multiple click approaches for better compatibility with error handling
      const clickMethods = [
        () => launchButton.click(),
        () => {
          const clickEvent = new MouseEvent('click', {
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
            throw new Error('No onclick handler found');
          }
        }
      ];

      let lastError = null;
      for (const method of clickMethods) {
        try {
          method();
          return; // Success
        } catch (error) {
          lastError = error;
        }
      }

      // All methods failed
      await this.errorHandler.handleWidgetError(
        new Error(`All click methods failed: ${lastError?.message}`),
        'invoke',
        this.id
      );

    } else {
      // Retry if button not found yet using configured retry settings
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
      const retryDelay = this.widgetConfig.get('timing.closeListenerRetryDelay');
      setTimeout(() => this.attachCloseListener(), retryDelay);
    }
  }

  removeCloseListener() {
    if (!this.callbacks.closeListener) return;
    
    const closeBtn = document.querySelector(this.config.closeSelector);
    closeBtn?.removeEventListener('click', this.callbacks.closeListener);
    this.callbacks.closeListener = null;
  }

  async activate(onDeactivate) {
    const activationTimer = this.startPerformanceTimer('activation');

    try {
      this.logger.logWidgetLifecycle('activating', this.id);

      // Check circuit breaker before activation
      if (this.errorHandler.isCircuitBreakerActive(this.id, 'widget_init')) {
        this.logger.warn(`Circuit breaker active, activation blocked`, {}, this.id);
        return;
      }

      // Execute pre-activation hooks
      await this.executeHooks('onActivate', 'before');

      // Ensure widget is mounted before activation
      if (!this.state.mounted) {
        await this.mount();
      }

      if (!this.state.initialized) {
        const scriptResult = await this.injectScript();
        if (!scriptResult.success && !scriptResult.recovery?.success) {
          await this.errorHandler.handleWidgetError(
            new Error('Script injection failed and recovery unsuccessful'),
            'widget_init',
            this.id
          );
          return;
        }
      }

      this.state.active = true;
      this.callbacks.onDeactivate = onDeactivate;

      // Poll for invoke selector instead of fixed delay
      const timingConfig = this.widgetConfig.getTimingConfig(this.id);
      const maxWait = this.firstActivation ? timingConfig.firstActivationDelay : timingConfig.subsequentActivationDelay;

      try {
        await pollUntil(
          () => document.querySelector(this.config.invokeSelector),
          { interval: 50, maxWait }
        );
      } catch {
        this.logger.debug('Invoke selector not found within timeout, proceeding with retry', {}, this.id);
      }

      if (this.state.active) {
        try {
          await this.invokeWidget();
          this.toggleVisibility(true);
          this.attachCloseListener();
          this.firstActivation = false;

          await this.executeHooks('onActivate', 'after');

          const duration = activationTimer.stop();
          this.logger.logWidgetActivation(this.id, duration);

        } catch (error) {
          activationTimer.stop();
          await this.errorHandler.handleWidgetError(error, 'widget_init', this.id);
        }
      } else {
        activationTimer.stop();
      }

    } catch (error) {
      activationTimer.stop();
      this.logger.error(`Widget activation failed`, { error: error.message }, this.id);
      await this.errorHandler.handleWidgetError(error, 'widget_init', this.id);
    }
  }

  async deactivate(callback) {
    const deactivationTimer = this.startPerformanceTimer('deactivation');

    try {
      this.logger.logWidgetLifecycle('deactivating', this.id);

      // Execute pre-deactivation hooks
      await this.executeHooks('onDeactivate', 'before');

      this.state.active = false;
      this.removeCloseListener();
      this.toggleVisibility(false);

      // Execute post-deactivation hooks
      await this.executeHooks('onDeactivate', 'after');

      const duration = deactivationTimer.stop();
      this.logger.logWidgetDeactivation(this.id, duration);

      const deactivationDelay = this.widgetConfig.get('timing.deactivationDelay');

      // Call the callback before nullifying the reference
      if (callback) {
        setTimeout(callback, deactivationDelay);
      }

      // Clear callback reference after calling it
      this.callbacks.onDeactivate = null;

    } catch (error) {
      deactivationTimer.stop();
      this.logger.error(`Widget deactivation error`, { error: error.message }, this.id);
      await this.errorHandler.handleWidgetError(error, 'deactivate', this.id);
    }
  }

  hide() {
    this.deactivate();
  }
} 