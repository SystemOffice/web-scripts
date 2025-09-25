// Configuration management for chat widget system
export class WidgetConfig {
  static DEFAULTS = {
    // UI positioning and styling
    ui: {
      position: {
        bottom: '32px',
        right: '32px',
        zIndex: '9999'
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
      invokeMaxRetries: 50,
      exponentialBackoffBase: 1.2,
      maxRetryDelay: 2000
    },

    // Error handling
    errorHandling: {
      enableGracefulDegradation: true,
      logLevel: 'warn', // 'error', 'warn', 'info', 'debug'
      enableErrorReporting: false,
      maxConsecutiveErrors: 3
    },

    // Configuration service
    configService: {
      baseUrl: 'https://your-config-service.com',
      timeout: 5000,
      retryAttempts: 2
    }
  };

  constructor(overrides = {}) {
    this.config = this.mergeDeep(WidgetConfig.DEFAULTS, overrides);
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
    const base = this.get('timing');
    if (widgetId && this.config.widgets && this.config.widgets[widgetId]?.timing) {
      return { ...base, ...this.config.widgets[widgetId].timing };
    }
    return base;
  }

  // Get retry configuration with optional widget-specific overrides
  getRetryConfig(widgetId = null) {
    const base = this.get('retry');
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
    const timing = this.get('timing');
    const retry = this.get('retry');

    if (timing.firstActivationDelay < 0 || timing.subsequentActivationDelay < 0) {
      throw new Error('Activation delays must be non-negative');
    }

    if (retry.invokeMaxRetries < 1 || retry.invokeRetryDelay < 0) {
      throw new Error('Retry configuration must be positive');
    }

    if (retry.exponentialBackoffBase <= 1) {
      throw new Error('Exponential backoff base must be greater than 1');
    }
  }

  // Deep merge utility for nested configuration objects
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

  // Get nested value using dot notation (e.g., 'ui.position.bottom')
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Set nested value using dot notation
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  // Load environment-specific overrides
  static loadEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    const envOverrides = {
      development: {
        errorHandling: { logLevel: 'debug' },
        timing: { firstActivationDelay: 500 } // Faster for development
      },
      production: {
        errorHandling: { logLevel: 'warn', enableErrorReporting: true }
      }
    };

    return envOverrides[env] || {};
  }

  // Create instance with environment-specific configuration
  static createWithEnvironment(overrides = {}) {
    const envConfig = WidgetConfig.loadEnvironmentConfig();
    const mergedOverrides = new WidgetConfig().mergeDeep(envConfig, overrides);
    return new WidgetConfig(mergedOverrides);
  }
}

// Export a default instance for simple use cases
export const defaultConfig = new WidgetConfig();