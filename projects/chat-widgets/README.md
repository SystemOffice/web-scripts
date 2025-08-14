# Chat Widget

A unified chat widget that integrates multiple chat services into a single embeddable button. This project leverages minification and script deployment via [jsdelivr](https://www.jsdelivr.com/).

## Quick Start

### Basic Embedding

> **Note**: All API keys must be domain-restricted in your service provider's dashboard to ensure security. Only use keys that are configured to work exclusively on your authorized domain(s) that will call this script.

```html
<script>
window.CHAT_WIDGET_CONFIG = {
  zoom: { 
    enabled: true, 
    apiKey: 'YOUR_ZOOM_API_KEY'
  },
  anthology: { 
    enabled: true, 
    snippetId: 'YOUR_ANTHOLOGY_SNIPPET_ID'
  },
  chatbot: { 
    enabled: true, 
    org: 'YOUR_ORG_ID'
  }
};
</script>
<script src="https://cdn.jsdelivr.net/gh/SystemOffice/chat-widgets/dist/chat-widgets.min.js"></script>
```

## Supported Services

### Zoom Contact Center
```javascript
zoom: {
  enabled: true,
  apiKey: 'YOUR_ZOOM_API_KEY',
  env: 'us01' // optional
}
```

### Anthology (Amazon Connect)
```javascript
anthology: {
  enabled: true,
  snippetId: 'YOUR_ANTHOLOGY_SNIPPET_ID'
}
```

### Chatbot
```javascript
chatbot: {
  enabled: true,
  org: 'YOUR_ORG_ID',
  launcherId: 'idalogin' // optional
}
```

## Features

- **Single file**
- **No dependencies**
- **Multiple services**
- **Domain-based config**
- **Mobile responsive**

## Development

### Development Workflow

1. **Make changes**:
- **Source files** (`index.js`, `widgets/*.js`, etc.) are for development and reference
- **Bundled file** (`dist/chat-widgets.js`) is the actual file served to users and used in demo to test
- **Manual updates required**: Changes to source files must be manually applied to the bundled file
- **Testing**: Always test with the bundled file to ensure it works as expected

2. **Test locally**:
  - Make changes to project files.
  - If changes were not pushed to chat-widgets.js, then do so.
  - Create a temporary test.html file (do not commit this file):

   ```html
   <!DOCTYPE html>
   <html>
   <head><title>Chat Widget Test</title></head>
   <body>
     <script>
       // Get config from URL parameters
       const params = new URLSearchParams(window.location.search);
       window.CHAT_WIDGET_CONFIG = {
         zoom: { 
           enabled: true,
           apiKey: params.get('zoom_key') || '',
           env: params.get('env') || 'us01'
         },
         anthology: {
           enabled: true,
           snippetId: params.get('anthology_id') || ''
         },
         chatbot: {
           enabled: true,
           org: params.get('org_id') || ''
         }
       };
     </script>
     <script src="dist/chat-widgets.js"></script>
   </body>
   </html>
   ```

   ```bash
   # Start local server
   python -m http.server 8000
   
   # Open in browser with your test credentials (replace with your actual keys)
   http://localhost:8000/test.html?zoom_key=YOUR_KEY&anthology_id=YOUR_ID&org_id=YOUR_ORG
   ```

   > **Note**: Add test.html to .gitignore to prevent accidentally committing credentials

3. **Commit and deploy**

### Adding New Chat Services

1. **Create widget class** in `widgets/`:
   ```javascript
   import { BaseWidget } from './base-widget.js';
   
   export class NewServiceWidget extends BaseWidget {
     constructor(config = {}) {
       super({
         id: 'new-service',
         displayName: 'New Service',
         scriptId: config.scriptId || 'new-service-script',
         src: config.src || 'https://service.com/script.js',
         attributes: { 'data-key': config.apiKey },
         closeSelector: '.close-button',
         elementSelectors: ['[class*="service"]']
       });
     }
   }
   ```

2. **Add to main initialization** in `index.js`:
   ```javascript
   import { NewServiceWidget } from './widgets/new-service.js';
   
   // In initializeWidgets function:
   if (config.newService?.enabled) {
     widgets.push(new NewServiceWidget(config.newService));
   }
   ```

3. **Update documentation** with configuration example

#### File Structure
```
chat-widget/
├── index.js              # Main entry point
├── state.js              # State management
├── styles.css            # All styles (inlined in build)
├── widgets/
│   ├── base-widget.js    # Base class for all widgets
│   ├── zoom.js          # Zoom integration
│   ├── anthology.js     # Anthology integration
│   └── chatbot.js       # Chatbot integration
├── demo/
│   └── index.html       # Test page
├── dist/
│   └── chat-widgets.js  # Manual bundle
└── .gitignore           # Git ignore rules
```
