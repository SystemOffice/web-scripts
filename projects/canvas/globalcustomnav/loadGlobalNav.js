/**
// @name        CanvasLMS - Global Custom Navigation Loader
// @description Safely loads GCN files and manually bridges isolated throwback scripts like Subaccount Nav.
**/

(async function () {
  'use strict';

  /**
   * Dynamically loads a script or stylesheet if it doesn't already exist.
   * We already have this function implemented elsewhere.
   */
/*   function dynamicallyLoadScript(url, type = 'script', async = true, attributes = {}) {
    return new Promise((resolve, reject) => {
      const selector = type === 'link' ? `link[href="${url}"]` : `script[src="${url}"]`;
      const existingElement = document.querySelector(selector);
      
      if (existingElement) {
        console.warn(`Resource already loaded: ${url}`);
        return resolve(existingElement);
      }

      const element = document.createElement(type);
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(`Failed to load resource: ${url}`));

      if (type === 'link') {
        element.rel = 'stylesheet';
        element.href = url;
      } else {
        element.src = url;
        element.async = async;
      }

      Object.assign(element, attributes);
      document.head.appendChild(element);
    });
  }
 */
  // --- SAFE EXECUTION ENVIRONMENT ---
  // Ensure the current user has the correct administrative role in Canvas
  const userRoles = (typeof ENV !== 'undefined' && ENV.current_user_types) ? ENV.current_user_types : [];
  const current_userRoles = (typeof ENV !== 'undefined' && ENV.current_user_roles) ? ENV.current_user_roles : [];
  
  if (['admin'].some(a => current_userRoles.includes(a))) {
    try {
      console.log("CanvasGCN: Starting sequential asset load sequence...");
      const baseurl = 'https://cdn.jsdelivr.net/gh/SystemOffice/web-scripts@main/projects/canvas/globalcustomnav/';

      // 1. Load stylesheets
      await dynamicallyLoadScript(baseurl + 'global-custom-nav.css', 'link');
      await dynamicallyLoadScript(baseurl + 'gcn-ccsd-admin-tray-subaccount-nav.css', 'link');

      // 2. Load JS Scripts sequentially (Core engine, then throwback)
      await dynamicallyLoadScript(baseurl + 'global-custom-nav.js');
      await dynamicallyLoadScript(baseurl + 'gcn-ccsd-admin-tray-subaccount-nav.js');

      console.log("CanvasGCN: External libraries loaded and ready!");

      // Resolve global engine and throwback context variables
      const gcn = (typeof globalCustomNav !== 'undefined') ? globalCustomNav : window.globalCustomNav;
      const subAccountNav = (typeof gcn_AdminTraySubAccountNav !== 'undefined') ? gcn_AdminTraySubAccountNav : window.gcn_AdminTraySubAccountNav;

      if (!gcn || !subAccountNav) {
        throw new Error("Core globalCustomNav or gcn_AdminTraySubAccountNav dependencies could not be resolved.");
      }

      // Initialize the throwback module with default configurations if present
      if (typeof subAccountNav.init === 'function') {
        subAccountNav.init({
          searchAccountFilter: [],
          accountFilter: []
        });
      }

      // 3. CONFIGURE NAVIGATION ITEMS
      const globalCustomNav_items = [{
        title: 'Instructure Icon',
        icon_svg: 'icon-pin',
        href: 'https://instructure.design/#icons-font',
        target: '_blank',
        position: 1
      }];

      // 4. CONFIGURE CUSTOM THROWBACKS
      // Map the subaccount throwback directly onto GCN's 'accounts' listener structure
      const globalCustomNav_tray_throwback = {};
      globalCustomNav_tray_throwback.accounts = {
        target: 'a[href="/accounts"]',
        actions: {
          // STRUCTURAL FIX: complete MUST be inside actions for GCN core's observer to find and respect it!
          complete: 'gcn-admin-tray-sub-account-links',
          glbl: function () {
            const mark_selector = '#nav-tray-portal a[href="/accounts"]';
            const content_location = document.querySelector('div.accounts-tray ul');
            if (!content_location) return;

            // Let subAccountNav naturally execute and apply its own complete class to break the loop natively
            subAccountNav.throwback({
              type: 'glbl',
              mark: mark_selector,
              complete: 'gcn-admin-tray-sub-account-links',
              where: content_location.closest('div'),
              ul_class: content_location.getAttribute('class'),
              li_class: content_location.children[1] ? content_location.children[1].getAttribute('class') : ''
            });
          },
          rspv: function () {
            const rspv_tray_sel = `div[id^="Expandable"] a[href="/accounts"]`;
            const anchor = document.querySelector(rspv_tray_sel);
            if (!anchor) return;

            const content_location = anchor.closest('ul');
            if (!content_location) return;

            subAccountNav.throwback({
              type: 'rspv',
              mark: rspv_tray_sel,
              complete: 'gcn-admin-tray-sub-account-links',
              where: content_location,
              ul_class: content_location.getAttribute('class'),
              li_class: content_location.children[1] ? content_location.children[1].getAttribute('class') : ''
            });
          }
        }
      };

      // 5. LOAD COMPLETED GCN OPTIONS
      const globalCustomNav_opts = {
        nav_items: globalCustomNav_items,
        throwbacks: globalCustomNav_tray_throwback
      };

      gcn.load(globalCustomNav_opts);
      console.log("CanvasGCN: Initialization complete.");

    } catch (error) {
      console.error("CanvasGCN: Global Navigation Library loading failed:", error.message);
    }
  } else {
    console.log("CanvasGCN: User is not an AccountAdmin. Execution bypassed.");
  }
})();