/**
 * detectFrames()
 * Observe the main document for injected <iframe> elements and attach
 * a 'load' listener so newly-added frames trigger ticket processing.
 * - No parameters.
 * - Uses a MutationObserver on document.body to detect added nodes.
 */
function detectFrames(){
	// 1. Define the observer callback targeting the nodeName
	const parentCallback = (mutationsList) => {
	  for (const mutation of mutationsList) {
		mutation.addedNodes.forEach(node => {
		  if (node.nodeName === 'IFRAME') {
			// console.log('A new iframe element was injected into the page:', node);
			node.addEventListener('load', () => {
				ticketProcessing();
			});
			}
		});
	  }
	};

	// 2. Start monitoring the root body of the main application
	const parentObserver = new MutationObserver(parentCallback);
	parentObserver.observe(document.body, { 
	  childList: true, 
	  subtree: true 
	});
}

/**
 * addToMyWorkButton(doc)
 * Add an "Add to My Work" button into the ticket action toolbar inside
 * the supplied document (typically an iframe document).
 * - doc: the Document object to modify.
 * Behavior:
 * - Locates the existing 'btnMyWork' trigger and inserts a small
 *   list-item button next to the existing ticket action buttons.
 * - Clicking the new button programmatically triggers the original
 *   'Add to My Work' control and hides the inserted element.
 */
function addToMyWorkButton(doc) {
    const myWorkBtn = doc.getElementById('btnMyWork');
    if (myWorkBtn && myWorkBtn.innerText.includes('Add to')) {

        const navEl = doc.getElementById('divTabHeader');
        if (!navEl) return;

        const myWorkBtnCustom = doc.querySelector('button#btnAddToMyWorkCustom');
        if (myWorkBtnCustom) return; // Prevent duplicate insertion 
    
        const ticketButtons = navEl.querySelectorAll('li button');
        if (ticketButtons.length === 0) return; // Safety check
        const lastButton = ticketButtons[ticketButtons.length - 2];
        
        const newItem = doc.createElement('li');
        newItem.innerHTML = `
            <button type="button" id="btnAddToMyWorkCustom" class="btn btn-primary btn-sm" title="Add to My Work">
                <span class="fa-solid fa-plus fa-nopad" aria-hidden="true"></span>
                <span class="hidden-xs padding-left-xs">Add to My Work</span>
            </button>`;
        
        newItem.addEventListener('click', () => {
            newItem.style.display='none';
            myWorkBtn.click();
        });

		lastButton.parentNode.insertAdjacentElement("afterend", newItem);
    }
}

/**
 * addClientLink(doc)
 * Add a "Client View" button which opens the corresponding client portal
 * request in a new window/tab for the current ticket.
 * - doc: the Document object inside the ticket iframe.
 * Notes:
 * - Uses a small mapping object to translate the current app id to a
 *   client id. Prevents duplicate insertion by setting a data attribute
 *   on the nav element.
 */
function addClientLink(doc) {
	// console.log(doc);
	const navEl = doc.getElementById('divTabHeader');
	if (!navEl || navEl.dataset.clientLinkAdded) return;

	const printBtn = navEl.querySelector('li button[title="Print View"]');
    // a bit redundant, but good for safety
	const clientBtn = navEl.querySelector('li button[title="Client View"]');

	if (printBtn && !clientBtn) {
		const pathParts = doc.location.pathname.split('/');
		const thisapp = pathParts[3];
		
		// add other mappings as needed
		const mapObj = {
			"135": "1981"
		};
	
		const penUltimatListItem = printBtn.parentNode;
		
		// cloning was inheriting print button behavior
		// const newItem = penUltimatListItem.cloneNode(true);
		
		const newItem = doc.createElement('li');
		newItem.innerHTML = `<button type="button" id="btnClientViewCustom" class="btn btn-primary btn-sm"  title="Client View">
          <span class="fa-solid fa-arrow-up-right-from-square fa-nopad" aria-hidden="true"></span><span class="hidden-xs padding-left-xs">Client View</span>
        </button>`;
		
		const ticketID = doc.getElementById('btnCopyID').innerText;

		newItem.addEventListener('click', () => {
		  window.open('/TDClient/' + mapObj[thisapp] + '/Portal/Requests/TicketRequests/TicketDet?TicketID=' + ticketID, '_portal');
		});

		penUltimatListItem.insertAdjacentElement("afterend", newItem);
		navEl.dataset.clientLinkAdded = "true";
	}
}

/**
 * fixDetails(doc)
 * Improve the presentation of the ticket details area by wrapping the
 * contents in a <details> element (making it collapsible) and injecting
 * lightweight styles into the iframe head.
 * - doc: the Document object to operate on.
 * - Hides the original heading and transfers children into the new
 *   details container to preserve live references.
 */
function fixDetails(doc) {
	// console.log('fixing details');
    let innerDiv = doc.querySelector('#divDetails:not(:has(details))');
    if (innerDiv){
        let heading = doc.querySelector('h2');

        const detailsTag = doc.createElement('details');
        const summaryTag = doc.createElement('summary');
        const resp = innerDiv.querySelector('#divResponsibility > div').innerText;
        summaryTag.textContent = `Details (${resp})`;
        detailsTag.prepend(summaryTag);

        heading.style.display='none';

        // 2. Safely move live children into the wrapper
        while (innerDiv.firstChild) {
            detailsTag.appendChild(innerDiv.firstChild);
        }

        innerDiv.appendChild(detailsTag);
                
        // 4. Create a new <style> element
        const style = doc.createElement('style');
        
        // 5. Add your custom CSS text
        style.textContent = `
                /* Light styling for presentation */
                #upDetails details {
                    margin-block: .5rem;
                    padding-block: .5rem;
                }

                #upDetails summary {
                    /* Pin the custom marker to the container */
                    position: relative;
                    /* Register summary as an anchor element */
                    anchor-name: --summary;
                    cursor: pointer; 
                    font-size: 1.2em;
                    display: list-item;
                    /* border-block-end: 1px solid rgba(0, 0, 0, 0.2); */
                    
                    &::marker {
                    content: "";
                    }
                    
                    &::before,
                    &::after {
                    
                    /* Positions the lines */
                    inset-inline-end: 0;
                    
                    /* Anchor the shape to the summary */
                    position: absolute;
                    }
                    
                    /* Rotate just the ::after line to create a "+"" shape */
                    &::after {
                    content: '';
                    width: 0;
                    height: 0;
                    border-top: 10px solid;
                    border-inline: 6px solid transparent;
                    transition: 0.3s ease;
                    }
                }

                /* Rotate the line when open */
                #upDetails details[open] summary::after {
                    transform: scaleY(-1);
                    transform-origin: center center;
                }

                #upDetails details[open] summary {
                    margin-bottom: 0.5rem;
                    border-block-end: none;
                }

                #upDetails details{
                    padding:10px;
                    /* border: 1px solid rgba(0, 0, 0, 0.2); */
                    box-shadow: var(--box-shadow-elevation1);
                    border-radius: 5px;
                }
        `;

        // 6. Append the style element to the iframe's head
        doc.head.appendChild(style);
    }
}  

/**
 * ticketProcessing()
 * Scan known iframe containers for ticket detail pages and apply UI
 * enhancements to each one by calling the helper functions:
 * - addClientLink
 * - addToMyWorkButton
 * - fixDetails
 * - No parameters. Operates on the top-level document to find iframes.
 */
function ticketProcessing(){
	// console.log('processing tickets');
	let myIframes = top.document.querySelectorAll('.tdx-workmgmt-container__iframe, .tdx-right-side-panel__iframe');

	for (const frame of myIframes){
		let iframeDocument = frame.contentDocument || frame.contentWindow.document;
		// is it a ticket iframe?
		let tdxDetailDiv = iframeDocument.querySelector('#upDetails') || document.querySelector('#upDetails'); 
		if (!tdxDetailDiv){
			continue;
		}
		
		// it's a ticket, so add client button
		addClientLink(iframeDocument);
		// add a button to add to your work
		addToMyWorkButton(iframeDocument);
		// fix the details section
		fixDetails(iframeDocument);
    }
}

detectFrames();