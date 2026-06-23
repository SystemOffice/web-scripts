/**
// @name        CanvasLMS - Global Custom Navigation Loader
// @description Safely loads GCN files and manually bridges isolated throwback scripts like Subaccount Nav.
**/


  /**
   * Dynamically loads a script or stylesheet if it doesn't already exist.
   * We already have this function implemented elsewhere.
   */
/*    function dynamicallyLoadScript(url, type = 'script', async = true, attributes = {}) {
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
  } */

(async function () {
  'use strict';
  
	function waitForObject(targetRef, interval = 50) {
	  return new Promise((resolve) => {
		const check = setInterval(() => {
		  try {
			// If targetRef() returns truthy, we are done!
			if (targetRef()) {
			  clearInterval(check);
			  resolve(true);
			}
		  } catch (error) {
			// Silently swallow the error. 
			// It just means the object or its parent isn't ready yet.
		  }
		}, interval);
	  });
	}
	  
    try {
      console.log("CanvasGCN: Starting sequential asset load sequence...");
      const baseurl = 'https://cdn.jsdelivr.net/gh/SystemOffice/web-scripts@main/projects/canvas/globalcustomnav/';

      // 1. Load stylesheets
      await dynamicallyLoadScript(baseurl + 'global-custom-nav.min.css', 'link');
      await dynamicallyLoadScript(baseurl + 'gcn-ccsd-admin-tray-subaccount-nav.min.css', 'link');

      // 2. Load JS Scripts sequentially (Core engine, then throwback)
      await dynamicallyLoadScript(baseurl + 'global-custom-nav.min.js');
      await dynamicallyLoadScript(baseurl + 'gcn-ccsd-admin-tray-subaccount-nav.min.js');

      console.log("CanvasGCN: External libraries loaded and ready!");

      // Resolve global engine and throwback context variables
	  let testGCN = await waitForObject(() => globalCustomNav);
	  testGCN = await waitForObject(() => gcn_AdminTraySubAccountNav);
	  
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
        var globalCustomNav_items = [];
	  
        if ( typeof collegePrefs !== 'undefined' && collegePrefs[ENV.primaryAccount] ){
          let customNav = collegePrefs[ENV.primaryAccount]?.customNav;
          // If pref is undefined, do nothing.
          //debugger;
          if (customNav) {
            // defaults
            for (const navItem of customNav){
              navItem.icon_svg = navItem.icon_svg ?? 'icon-info';
              navItem.position = navItem.position ?? 'after';
            }
            globalCustomNav_items.push(...customNav);
          }
        }


      // 4. CONFIGURE CUSTOM THROWBACKS
      // Map the subaccount throwback directly onto GCN's 'accounts' listener structure
      const globalCustomNav_tray_throwback = {};
      globalCustomNav_tray_throwback.accounts = {
        target: 'a[href="/accounts"]',
        actions: {
          // STRUCTURAL FIX: complete MUST be inside actions for GCN core's observer to find and respect it!
          complete: 'gcn-admin-tray-sub-account-links',
          expand: function (tray) {
            const firstItem = tray.querySelector('ul li a');
            if (!firstItem) return;
            firstItem.click();
          },
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

            const gcn_admin_tray_san = document.querySelector('#gcn-admin-tray-san');
            if (gcn_admin_tray_san) {
              this.expand(gcn_admin_tray_san);
            }
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

})();