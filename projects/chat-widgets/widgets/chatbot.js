// Chatbot widget integration
import { BaseWidget } from './base-widget.js';

export class ChatbotWidget extends BaseWidget {
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
    
    // Validate required config
    if (!config.org || config.org === 'DEMO_ORG') {
      console.warn('Chatbot: Organization not configured. Please add your organization ID to the configuration.');
    }
    
    // Load script immediately but hide elements aggressively
    this.injectScript();
    this.hideElementsAggressively();
  }

  hideElementsAggressively() {
    // Hide elements multiple times as they appear
    const hideAttempts = [500, 1000, 1500, 2000, 2500, 3000];
    hideAttempts.forEach(delay => {
      setTimeout(() => {
        this.toggleVisibility(false);
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
    }, 100); // Fast since script is pre-loaded
  }

  getElementsToToggle() {
    // Include the launcher element plus all matching selectors
    return [
      document.getElementById(this.config.launcherId),
      ...this.config.elementSelectors.flatMap(selector => 
        Array.from(document.querySelectorAll(selector))
      )
    ].filter(Boolean);
  }
}