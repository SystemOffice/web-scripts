// Chatbot widget integration
import { BaseWidget } from './base-widget.js';

export class ChatbotWidget extends BaseWidget {
  constructor(config = {}) {
    super({
      id: 'chatbot',
      displayName: 'Chatbot',
      scriptId: config.scriptId || 'IS_CV_PUBLIC_HOOK',
      src: config.src || 'https://vccs-ws.iuc.intrasee.com/vccsoda/IS_CV_PUBLIC_HOOK.js',
      attributes: { 
        'data-org': config.org || 'DEMO_ORG', 
        'type': 'text/javascript' 
      },
      launcherId: config.launcherId || 'idalogin',
      invokeSelector: '#idalogin',
      closeSelector: '.oda-chat-popup-action.oda-chat-filled.oda-chat-flex',
      elementSelectors: ['[class*="oda-chat"]', '[id*="oda"]']
    });
    
    // Validate required config
    if (!config.org || config.org === 'DEMO_ORG') {
      console.warn('Chatbot: Organization not configured. Please add your organization ID to the configuration.');
    }
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