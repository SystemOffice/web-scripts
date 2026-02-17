// Zoom Contact Center widget integration
import { BaseWidget } from './base-widget.js';

export class ZoomWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'zoom',
      displayName: config.displayName || 'Zoom Contact Center',
      order: config.order,
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
      invokeMaxRetries: 20
    });
    
    // Validate required config
    if (!config.apiKey || config.apiKey === 'DEMO_KEY') {
      console.warn('Zoom: API key not configured. Please add your Zoom API key to the configuration.');
    }
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
    
    // Also try direct attachment for existing buttons (as backup)
    this.attachDirectListeners();
  }
  
  attachDirectListeners() {
    const closeSelectors = [
      '.css-1u2heh6',
      'button[aria-label="Next"]',
      'button[aria-label="Leave"]',
      '.css-1mv3bnz',
      '.css-1rzxt70'
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

  async deactivate(callback) {
    await super.deactivate(callback);

    // Remove the Zoom SDK script tag from the DOM.
    // The IntraSee chatbot SDK refuses to initialize when a Zoom SDK
    // script tag is present. The Zoom SDK remains functional in memory
    // so it will work on re-activation without re-injection.
    const scriptTag = document.getElementById(this.scriptId);
    if (scriptTag) {
      scriptTag.remove();
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
      '.css-1u2heh6',
      'button[aria-label="Next"]',
      'button[aria-label="Leave"]',
      '.css-1mv3bnz',
      '.css-1rzxt70'
    ];
    
    closeSelectors.forEach(selector => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach(button => {
        button.removeEventListener('click', this.callbacks.closeListener);
      });
    });
    
    this.callbacks.closeListener = null;
  }
}