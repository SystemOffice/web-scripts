/**
 * Dynamically loads a script or stylesheet if it doesn't already exist.
 * @param {string} url - The source URL.
 * @param {string} type - 'script' or 'link'.
 * @param {boolean} async - Whether to load asynchronously.
 * @param {Object} attributes - Optional extra attributes to set.
 * @returns {Promise<HTMLElement>} Resolves with the created DOM element.
 * exists in calling .js file
 */
/* function dynamicallyLoadScript(url, type = 'script', async = true, attributes = {}) {
  return new Promise((resolve, reject) => {
    // 1. Check if the resource is already in the DOM
    const selector = type === 'link' ? `link[href="${url}"]` : `script[src="${url}"]`;
    const existingElement = document.querySelector(selector);
    
    if (existingElement) {
      console.warn(`Resource already loaded: ${url}`);
      return resolve(existingElement); // Resolve immediately if already present
    }

    // 2. Create the element
    const element = document.createElement(type);

    // 3. Setup event listeners before attaching to the DOM or setting sources
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error(`Failed to load resource: ${url}`));

    // 4. Configure based on type
    if (type === 'link') {
      element.rel = 'stylesheet';
      element.href = url;
    } else {
      element.src = url;
      element.async = async;
    }

    // 5. Apply any additional attributes (merging event handlers safely)
    Object.assign(element, attributes);

    // 6. Append to trigger the network request
    document.head.appendChild(element);
  });
}
 */

async function loadGlobalNavLibrary() {
  try {
    const baseurl = 'https://cdn.jsdelivr.net/gh/SystemOffice/web-scripts@main/projects/canvas/globalcustomnav/';

    // try this just to see 
    const scriptURL = document.currentScript.src;
    const parentUrl = new URL('../', scriptURL).href; 
    console.log(scriptURL);

    // 1. Load stylesheets
    await dynamicallyLoadScript(baseurl + 'global-custom-nav.css', 'link');
    await dynamicallyLoadScript(baseurl + 'gcn-ccsd-admin-tray-subaccount-nav.css', 'link');

    // 2. Load the script
    await dynamicallyLoadScript(baseurl + 'global-custom-nav.js');
    await dynamicallyLoadScript(baseurl + 'gcn-ccsd-admin-tray-subaccount-nav.js');
    
    // 3. Safe to use the library now
    initGlobalNav(); 

  } catch (error) {
    console.error("Global Navigation Library loading failed:", error.message);
  }
}

// Execute the async function
// the library does include other tray and options, but we're skipping them for now
if (['AccountAdmin'].some(a => ENV.current_user_types?.includes(a))) {
	loadGlobalNavLibrary();
}

function initGlobalNav() {
	console.log("The external libraries are ready to use!");

    gcn_AdminTraySubAccountNav.init({
        // account *names* which should be excluded from the search result breadcrumbs
        searchAccountFilter: [],
        // account *ids* as strings that should be excluded from the tree altogether
        // if you have a consortium, use both the local id and the global (shard id)
        accountFilter: [
          // '123456', // sub account relative to root
          // '100000000123456' // sub account relative to others
        ],
      });

    // throwback for admin tray - sub account navigation
    globalCustomNav_tray_throwback.accounts = {
      target: 'a[href="/accounts"]',
      complete: 'gcn-admin-tray-sub-account-links',
      actions: {
        glbl: function () {
          let content_location = document.querySelector('div.accounts-tray ul');
          gcn_AdminTraySubAccountNav.throwback({
            type: 'glbl',
            mark: '#nav-tray-portal a[href="/accounts"]',
            complete: 'gcn-admin-tray-sub-account-links',
            where: content_location.closest('div'),
            ul_class: content_location.getAttribute('class'),
            li_class: content_location.children[1].getAttribute('class')
          });
        },
        rspv: function () {
          let rspv_tray_sel = `div[id^="Expandable"] a[href="/accounts"]`;
          let content_location = document.querySelector(rspv_tray_sel).closest('ul');
          gcn_AdminTraySubAccountNav.throwback({
            type: 'rspv',
            mark: rspv_tray_sel,
            complete: 'gcn-admin-tray-sub-account-links',
            where: content_location,
            ul_class: content_location.getAttribute('class'),
            li_class: content_location.children[1].getAttribute('class')
          });
        }
      }
    };

  const globalCustomNav_opts = {
    // nav_items: globalCustomNav_items,
    throwbacks: globalCustomNav_tray_throwback
  };
  // load custom nav options
  globalCustomNav.load(globalCustomNav_opts);
}

