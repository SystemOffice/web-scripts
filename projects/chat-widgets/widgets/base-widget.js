// Base widget class for chat service integrations
export class BaseWidget {
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