// Zoom Contact Center widget integration
import { BaseWidget } from './base-widget.js';

export class ZoomWidget extends BaseWidget {
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
      elementSelectors: ['[class*="livesdk"]', '[class*="zcc"]', '[id*="zcc"]', '[class*="zoom"]'],
      invokeRetryDelay: 150, // Shorter delay since button appears quickly
      invokeMaxRetries: 40   // Fewer retries (6 seconds total)
    });
    
    // Validate required config
    if (!config.apiKey || config.apiKey === 'DEMO_KEY') {
      console.warn('Zoom: API key not configured. Please add your Zoom API key to the configuration.');
    }
  }
}