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
			"3228": "3184",
            "3185": "3184",
            "3267": "2948",
            "2979": "2948",
            "3531": "2948",
            "3399": "3023",
            "3026": "3023",
            "3527": "3620",
            "3195": "3192",
            "3028": "3027",
            "3341": "3264",
            "3335": "3264",
            "3263": "3264",
            "3510": "2980",
            "3291": "2980",
            "3193": "2980",
            "2981": "2980",
            "3377": "3188",
            "3293": "3188",
            "3187": "3188",
            "3336": "3188",
            "3388": "3387",
            "3535": "3391",
            "3392": "3391",
            "3326": "3327",
            "3382": "3380",
            "3381": "3380",
            "3390": "3250",
            "3249": "3250",
            "3403": "3442",
            "3225": "3023",
            "3427": "3023",
            "3036": "3023",
            "3024": "3023",
            "3405": "3023",
            "3076": "1981",
            "3404": "1981",
            "135": "1981",
            "3297": "3294",
            "3296": "3294",
            "3295": "3294",
            "3304": "3294",
            "3303": "3294",
            "3305": "3294",
            "3398": "1981",
            "3332": "3333",
            "3353": "3309",
            "3339": "3309",
            "3534": "3309",
            "3310": "3309",
            "3525": "3309",
            "3307": "3309",
            "3478": "3309",
            "3308": "3309",
            "3401": "3236",
            "3237": "3236",
            "336": "1981",
            "3269": "3230",
            "3229": "3230",
            "3408": "3230"
		};
	
		const penUltimatListItem = printBtn.parentNode;
		
		// cloning was inheriting print button behavior
		// const newItem = penUltimatListItem.cloneNode(true);
		
		const newItem = doc.createElement('li');
		newItem.innerHTML = `<button type="button" id="btnClientViewCustom" class="btn btn-primary btn-sm"  title="Client View">
          <span class="fa-solid fa-arrow-up-right-from-square fa-nopad" aria-hidden="true"></span><span class="hidden-xs padding-left-xs">Client View</span>
        </button>`;
		
		const ticketID = doc.getElementById('btnCopyID').innerText;

        const base = "/TDClient/";
        if (isSandbox()) {
            base = "/SBTDClient/";
        }

		newItem.addEventListener('click', () => {
		  window.open(base + mapObj[thisapp] + '/Portal/Requests/TicketRequests/TicketDet?TicketID=' + ticketID, '_portal');
		});

		penUltimatListItem.insertAdjacentElement("afterend", newItem);
		navEl.dataset.clientLinkAdded = "true";
	}
}

/**
 * Returns true when the current URL indicates a sandbox environment.
 */
function isSandbox() {
    if (document.location.href.indexOf('help.vccs.edu/SB') > -1) {
        return true;
    }
    return false;
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
		if (tdxDetailDiv){
			// continue;
       		// it's a ticket, so add client button
            addClientLink(iframeDocument);
            // add a button to add to your work
            addToMyWorkButton(iframeDocument);
            // fix the details section
		    fixDetails(iframeDocument);
		}
		
        let tdxUpdateEdit = iframeDocument.querySelector('#frmTicketUpdate, #frmTicketEdit') || document.querySelector('#frmTicketUpdate, #frmTicketEdit');
        if (tdxUpdateEdit) {
            // add any custom attributes to edit/update form elements
            addElementAttributes(iframeDocument);
            validateFormWithLibrary(iframeDocument);
        }

    }
}

detectFrames();

/**
 * Reads a hidden JSON config element and returns the requested object key if found.
 */
function getCustomFormJSONObj(objID, doc = document) {
    const customFormElements = doc.querySelector('.formCustomElements, .tdx-validate-config');
    if (customFormElements) {
        try {
            const formJSON = JSON.parse(customFormElements.innerText);
            if (formJSON && formJSON[objID]) {
                return formJSON[objID];
            }
        }
        catch (err) {
            console.log('error parsing custom form JSON: ' + err);
            return null;
        }
    }
    return null;
}

// example of how we can use the above function to add attributes to elements, such as type="email" for built-in validation, 
// where TDX does not support it natively. This is a bit of a hack but allows for more flexible form configurations 
// without needing to edit the script directly for each new attribute or field. 
// We can define custom attributes in the hidden JSON config and they will be applied on page load.
// this is not just about forms, but any identifiable element by ID, so it could be used for other purposes as well, 
// such as adding data- attributes for custom JS functionality, etc.
function getGlobalAttributes(objIn) {
    const customAttributes = {
        "attribute14516": {
            "type": "email"
        },
        "attribute14513": {
            "type": "tel"
        },
        "attribute11849": {
            "pattern": "^[0-9]{7}$",
        }
    };
    const merged = { ...customAttributes, ...objIn };
    return merged;
}

// This function reads custom attributes from a hidden JSON config and applies them to form elements by ID.
// For example, it can set the type="email" attribute on an input to trigger built-in HTML5 validation.
// Or min, max, range, pattern, or any other attribute supported by the element, where it is not supported by TDX.
function addElementAttributes(doc = document) {
    const customAttributes = getCustomFormJSONObj("customAttributes");
    // merges custom to global attributes, so we have one object
    const globalAttributes = getGlobalAttributes(customAttributes);
    const form = document.querySelector('form');
    if (globalAttributes && form) {
        Object.keys(globalAttributes).forEach(function (key) {
            var element = doc.getElementById(key);
            if (element) {
                var attributes = globalAttributes[key];
                Object.keys(attributes).forEach(function (attrKey) {
                    element.setAttribute(attrKey, attributes[attrKey]);
                });
            }
        });
    }
}


/**
 * Loads a validation library if constraints are defined in hidden JSON config and logs missing fields.
 * https://docs.google.com/document/d/1j-vmeSAZMQpAEwyAZQpfm6zC9iel6kjqlMnHoRCD1gc/edit?tab=t.0
 */
function validateFormWithLibrary(doc = document) {
	// potentially merge with global object
    const localConstraints = getCustomFormJSONObj("constraints");
    const constraints = getGlobalAttributeConstaints(localConstraints);
    const form = doc.querySelector('form');

    if (constraints && form) {
        // console.log('required fields from JSON', constraints);
        loadScriptAsync('https://cdnjs.cloudflare.com/ajax/libs/validate.js/0.13.1/validate.min.js').then(() => {

			// console.log('validation library loaded successfully');

            // this probably needs to be onsubmit?
            // or potentially on blur of each field to give more real-time feedback, 
            // see https://validatejs.org/examples.html
            $('form').on('submit', function (e) {
                var errors = validate(form, constraints);
                // then we update the form to reflect the results
                // showErrors(form, errors || {});
                if (errors) {
                    console.log('form data is invalid, errors: ', errors);
                    showErrors(errors, doc);
                    e.preventDefault();
                    return false;
                }
            });

		}).catch(error => console.error('error loading validation library: ' + error));
    }
    else {
        // console.log('no required fields defined in JSON');
        return;
    }
}

function showErrors(errors, doc = document) {
    //debugger;
    errorFields = Object.keys(errors);
    errorFields.forEach(field => {
        var fieldEl = doc.getElementById(field);
        if (fieldEl) {
            
            fieldEl.classList.add('error');
            // Create a new span element
            const newSpan = doc.createElement('span');
            newSpan.id = field + "-error";

            var errorMessage = errors[field][0];
            const regex = new RegExp(field, "i"); 
            const currValue = fieldEl.value || '';

            newSpan.textContent = errorMessage;

            newSpan.innerHTML = newSpan.innerHTML.replace(regex, "<strong>" + currValue + "</strong>");

            // 3. create parent span element
            const pSpan = doc.createElement('span');
            pSpan.setAttribute('class', 'field-validation-error');
            pSpan.setAttribute('data-valmsg-for',field);
            pSpan.setAttribute('data-valmsg-replace','true');
            pSpan.appendChild(newSpan);

            // 4. Insert it immediately after as a sibling
            fieldEl.after(pSpan); 

        }
    });

}
