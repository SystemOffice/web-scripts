/**
 * Reads query string parameters from window.location.href and sets matching form field values.
 * If no query string exists, returns immediately.
 * Catches and logs parsing errors without throwing.
 */
function parseQueryString() {
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return;
    
    params.forEach((value, key) => {
        // URLSearchParams automatically decodes values
        for (let form of document.forms) {
            if (form[key]) {
                if (form[key].type === 'checkbox' || form[key].type === 'radio'){
                    form[key].click();
                }
                else {
                    form[key].value = decodeURIComponent(value);
                }            }
        }
        // update the WYSIWYG editor value if "d" query string parameter is present
        if (key == 'd'){
            const ckEditor = window.CKEDITOR?.instances['attribute2937_Content'];
            if (ckEditor) {
                ckEditor.setData(decodeURIComponent(value));
            }
        }
    });
}
parseQueryString();

var baseURLObj = document.currentScript.src;
var baseURL = baseURLObj.split('/').slice(0, -1).join('/') + '/';

/**
 * Adds a CSS link for tdx.css to the document head using the manifest script base URL.
 */
function addCss() {
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', baseURL + 'tdx.css');
    link.setAttribute('type', 'text/css');
    document.head.appendChild(link);
}
addCss();

/**
 * Loads a JavaScript file asynchronously and returns a Promise.
 * Accepts either a string URL or an existing script element object.
 * Resolves on successful load, rejects on error.
 */
function loadScriptAsync(src) {
    return new Promise((resolve, reject) => {
        var script;
        if (typeof src !== "object") {
            script = document.createElement('script');
            script.src = src;
        }
        else {
            script = src;
        }
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

/**
 * Creates and appends a non-promised script element for the given URL.
 * Does not wait for script load completion.
 */
function dynamicallyLoadScript(url) {
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL
    document.head.appendChild(script);
}

loadScriptAsync(baseURL + 'tdx-toc.min.js')
    .then(() => console.log('tdx-toc.min.js script loaded successfully'))
    .catch(error => console.error(error));

/**
 * Converts Markdown content into HTML for specific elements using the marked library.
 * Replaces <br> tags with newline characters before parsing.
 */
function runMarkdown() {
    if (marked !== undefined) {
        document.querySelectorAll('.js-custom-attributes-container .form-group .wrap-text').forEach(function (element) {
            if (/[\#\-]/.test(element.innerHTML)) {
                element.innerHTML = marked.parse(element.innerHTML.trim().replaceAll('<br>', '\r\n'));
            }
        });

        var aboutMe = document.querySelector('#divAboutMe p');
        if (aboutMe && /[\#\-]/.test(aboutMe.outerHTML)) {
            aboutMe.outerHTML = marked.parse(aboutMe.innerHTML.trim().replaceAll('<br>', '\r\n'));
        }
    }
}

loadScriptAsync('https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js').then(() => runMarkdown());

/**
 * Updates the placeholder text of the SiteSearch search input if present.
 */
function getSearchBox() {
    var node = document.querySelector('input[id^="SiteSearch-text"');
    if (node) {
        node.placeholder = "What may we help you with?";
    }
}

getSearchBox();

/**
 * Moves Related and KB panels before the details panel using jQuery.
 */
function moveDetailsDown() {
    $('div.panel[id*=Related], div.panel[id*=KB]').insertBefore('#divDetails');
}

moveDetailsDown();

/**
 * Adds a warning link before any image missing alt text when an Edit link exists.
 */
function checkImages() {
    if (document.querySelector('a[href*="Edit"]')) {
        $("img:not([alt]), img[alt='']").each(function () {
            $(this).before("<a href=\"https://www.w3.org/WAI/tutorials/images/decorative/\" \
                        target=\"new\" \
                        title=\"possibly missing alt tag, review url for details\" \
                        class=\"altSpan\" \
                        style=\"color:black;font-weight:bold;font-family:sans-serif;font-size:small;background-color:yellow;speak:literal-punctuation;\">\
                        Image❌alt=\"" + $(this).attr('alt') + "</a>");
        });
    }
}

checkImages();

/**
 * Copies the text content of a specified table column to the clipboard.
 * Traverses all rows and joins cell text with newlines.
 */
function copyTableColumnToClipboard(table, columnIndex) {
    if (!table) {
        console.error("Table not found", table);
        return;
    }

    let columnData = [];
    const rows = table.rows;

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].cells;
        if (cells.length > columnIndex) {
            columnData.push(cells[columnIndex].textContent.trim());
        }
    }

    const textToCopy = columnData.join('\n');

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            console.log('Column data copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy text: ', err);
        });
}

/**
 * Sorts table rows by the contents of a specified column.
 * Supports numeric and string comparisons and reorders rows in the table body if present.
 */
function tableSort(table, columnIndex) {
    function compareTableRows(rowA, rowB, columnIndex, isAscending) {
        let cellA = rowA.cells[columnIndex].innerText;
        let cellB = rowB.cells[columnIndex].innerText;

        let valA = isNaN(parseFloat(cellA)) ? cellA : parseFloat(cellA);
        let valB = isNaN(parseFloat(cellB)) ? cellB : parseFloat(cellB);

        if (typeof valA === 'string' && typeof valB === 'string') {
            return isAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return isAscending ? valA - valB : valB - valA;
        }
    }

    const rows = Array.from(table.rows).slice(1);
    const isAscending = true;

    let sortedRows = rows.sort((a, b) => compareTableRows(a, b, columnIndex, isAscending));
    let tbody = table.querySelector('tbody');
    if (tbody) {
        sortedRows.forEach(row => tbody.appendChild(row));
    } else {
        sortedRows.forEach(row => table.appendChild(row));
    }
}

/**
 * Adds copy and sort icons to each table header cell and binds their events.
 */
function addCopyToColumnHeadings() {
    document.querySelectorAll('table th')
        .forEach((item, i) => {
            let currentElement = item;
            let tableElement = null;

            while (currentElement && currentElement.tagName !== 'TABLE') {
                currentElement = currentElement.parentElement;
            }

            if (currentElement && currentElement.tagName === 'TABLE') {
                tableElement = currentElement;
            }

            item.insertAdjacentHTML('beforeend', "<span>&nbsp;</span><i class=\"fa-solid fa-copy\" style=\"display:none;\"></i>");
            item.insertAdjacentHTML('beforeend', "<i class=\"fa-solid fa-sort\" style=\"display:none;\"></i>");

            item.onmouseover = function (e) {
                item.querySelector(':scope i').style.display = 'inline-block';
                item.querySelector(':scope i.fa-sort').style.display = 'inline-block';
                item.querySelector(':scope i').title = 'Click to copy column';
                item.querySelector(':scope i.fa-sort').title = 'Click to sort';
                item.style.cursor = 'pointer';
            };
            item.onmouseout = function (e) {
                item.querySelector(':scope i').style.display = 'none';
                item.querySelector(':scope i.fa-sort').style.display = 'none';
                item.title = '';
            };
            item.querySelector('.fa-copy').onclick = function (e) {
                copyTableColumnToClipboard(tableElement, i);
            }
            item.querySelector('.fa-sort').onclick = function (e) {
                tableSort(tableElement, i);
            }
        }
        );
}

addCopyToColumnHeadings();

/**
 * Assigns unique collapse targets and IDs to collapsible panel headings and bodies.
 */
function setupCollapsiblePanels() {
    var panels = document.querySelectorAll('.panel.collapsible');
    var ct = 0;
    panels.forEach(setIdAndTarget);

    function setIdAndTarget(item) {
        var datatarget = 'collapsible-item' + ct;
        item.querySelector('.panel-heading input, .panel-heading').setAttribute('data-target', "#" + datatarget);
        item.querySelector('.panel-body').id = datatarget;
        ct++;
    }
}

setupCollapsiblePanels();

/**
 * Converts .tab-pane.vccs sections into Bootstrap-style tabs with a nav tab bar.
 */
function setupBootstrapTabs() {
    var tabPanes = document.querySelectorAll('.tab-pane.vccs');

    if (tabPanes.length > 0) {
        addTabs(tabPanes);
    }

    function addTabs(tabPanes) {
        if (!document.querySelector('.tab-content.vccsTabs')) {
            $(".tab-pane.vccs").wrapAll("<div class='tab-content vccsTabs' />")
        }
        if (!document.querySelector('.nav-tabs.vccsTabs')) {
            addTopBar(tabPanes);
        }
    }

    function addTopBar(tabPanes) {
        var topBar = document.createElement('ul');
        topBar.className = 'nav nav-tabs vccsTabs';
        topBar.id = 'topbar';
        topBar.role = "tablist";
        var wrapper = document.querySelector('.tab-content.vccsTabs');
        wrapper.insertAdjacentElement('beforebegin', topBar);

        var ariaExpanded = 'true';
        var classText = "class=\"active\" ";
        var ct = 1;
        var itemClassName = "tab-pane fade in active";

        tabPanes.forEach(el => {
            el.className = itemClassName + " tab" + ct;
            el.id = "tab" + ct;
            el.style.borderTop = 'none';

            var tabTitle = document.querySelector(".tab" + ct + " h2");
            var tabTitletxt = 'No H2 title';
            if (tabTitle) {
                tabTitletxt = tabTitle.innerText
            }
            else {
                el.innerHTML = "<h2>Put Heading Here</h2>" + el.innerHTML;
            }
            var litemHTML = "<li " + classText + "role=\"presentation\"><a aria-controls=\"tab1\" aria-expanded=\"" + ariaExpanded + "\" data-target=\".tab" + ct + "\" data-toggle=\"tab\" role=\"tab\">" + tabTitletxt + "</a></li>";
            $('#topbar').append(litemHTML);
            ariaExpanded = 'false';
            classText = '';

            itemClassName = "tab-pane fade";
            ct++;
        });
    }
}
setupBootstrapTabs();

/**
 * Builds and initializes custom vtab and htab tab interfaces with buttons and show/hide logic.
 */
function setupTabs() {
    var tabs = document.querySelectorAll('.vtab');
    if (tabs.length > 0) {
        addsideBar();
    }

    tabs = document.querySelectorAll('.htab');
    if (tabs.length > 0) {
        addTopBar();
    }

    tabs = document.querySelectorAll('.vtab, .htab');

    if (tabs.length > 0) {
        var ct = 0;
        tabs.forEach(setIdAndTarget);
        showTab(document.getElementsByClassName("tablink")[0]);
    }

    function setIdAndTarget(tab) {
        var datatarget = 'vccstab' + ct;
        tab.id = datatarget;
        tab.className += ' w3-animate-opacity';
        tab.setAttribute('id', datatarget);
        tab.style.display = 'none';
        addButton(tab);
        ct++;
    }

    function addTopBar() {
        var topBar = document.createElement('div');
        topBar.className = 'w3-bar w3-card';
        topBar.id = 'vccsTOCBar';
        document.querySelector('.vtab, .htab').insertAdjacentElement('beforebegin', topBar);
        return (topBar);
    }

    function addsideBar() {
        var sideBar = document.createElement('div');
        sideBar.className = 'w3-sidebar w3-bar-block w3-card col-md-1';
        sideBar.id = 'vccsTOCBar';
        document.getElementById('divMainContent').insertAdjacentElement('beforebegin', sideBar);

        var menuheading = document.createElement('h5');
        menuheading.className = 'w3-bar-item';
        menuheading.innerText = 'Menu';
        sideBar.appendChild(menuheading);

        document.querySelector('.col-md-4').className = 'col-md-3';

        return (sideBar);
    }

    function addButton(tab) {
        var sideBar = document.querySelector('#vccsTOCBar');
        var buttonName = tab.querySelector('h2').innerText;
        var button = document.createElement('button');
        button.className = 'w3-bar-item w3-button tablink';
        button.innerText = buttonName;
        button.setAttribute('data-toggle', tab.id);
        button.id = 'button' + tab.id;
        button.onclick = function (e) { showTab(e.currentTarget); return false; };
        sideBar.appendChild(button);
    }

    function showTab(clickedButton) {
        var i;
        var tabs = document.querySelectorAll('.vtab, .htab');
        for (i = 0; i < tabs.length; i++) {
            tabs[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablink");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" w3-green", "");
        }
        var tabTarget = clickedButton.getAttribute('data-toggle');
        document.getElementById(tabTarget).style.display = "block";
        clickedButton.className += " w3-green";
        return false;
    }
}

setupTabs();

/**
 * Injects the VCCS chat hook script when on the designated help page URL.
 */
function addVCCSChat(dataOrg='VCCS_SYS') {
    if (document.location.href.indexOf('help.vccs.edu/SBTDClient/1981') > -1) {
        var loaded = false;
        function loadChat() {
            if (loaded || document.getElementById('IS_CV_PUBLIC_HOOK')) return;
            loaded = true;
            var s = document.createElement('script');
            s.id = 'IS_CV_PUBLIC_HOOK';
            s.src = 'https://cdn.jsdelivr.net/gh/SystemOffice/web-scripts@latest/projects/gideontaylor-chatbot/dist/IS_CV_PUBLIC_HOOK.js';
            s.async = true;
            s.setAttribute('data-org', dataOrg);
            document.head.appendChild(s);
        }
        ['pointerdown', 'touchstart', 'keydown'].forEach(function (e) {
            window.addEventListener(e, loadChat, { once: true, passive: true });
        });
        if (!matchMedia('(max-width: 767px)').matches) {
            window.requestIdleCallback ? requestIdleCallback(loadChat, { timeout: 6000 }) : setTimeout(loadChat, 5000);
        }
    }
}

addVCCSChat();

/**
 * Moves ticket request buttons to the main content area on mobile screen widths.
 * Also attempts to hide and reset the feed checkbox form.
 */
function moveButtonsOnMobile() {
    if (true) {
        if (screen.width <= 1000) {
            const spans = document.querySelectorAll('#divSidebar span:has(a.DetailAction[href^="TicketRequests"])');
            const mainContent = document.querySelector('#divMainContent');
            const reversed = [...spans].reverse();
            reversed.forEach(el => mainContent.prepend(el));

            $(document).ready(function () {
                const form = document.querySelector('.feed form');
                if (form) {
                    form.querySelectorAll('input[type="checkbox"]').forEach(function (el) {
                        if (el.checked) {
                            el.click();
                        }
                    });
                    form.querySelector('button').click();
                }
            });
        }
    }
}

moveButtonsOnMobile();

/**
 * Appends raw HTML string content into a target element by parsing it into child nodes.
 */
function appendHtml(el, str) {
    var div = document.createElement('div');
    div.innerHTML = str;
    while (div.children.length > 0) {
        el.appendChild(div.children[0]);
    }
}

/**
 * Returns the first Monday on or after the first day of the month for the given date string.
 */
function findFirstMonday(dateString) {
    let targetDate = new Date(dateString);
    let targetMonth = targetDate.getMonth();
    let targetYear = targetDate.getFullYear();
    let firstDateInMonth = new Date(targetYear, targetMonth, 1);
    let firstWeekdayInMonth = firstDateInMonth.getDay();
    let firstMondayDate = 1 + ((8 - firstWeekdayInMonth) % 7);
    return new Date(targetYear, targetMonth, firstMondayDate);
}

/**
 * Computes the next quarterly refresh date based on first Mondays in April, July, October, and January.
 */
function getNextRefresh() {
    let today = new Date();
    let todayYear = today.getFullYear();
    let firstQuarter = findFirstMonday('1 April ' + todayYear);
    let secondQuarter = findFirstMonday('1 July ' + todayYear);
    let thirdQuarter = findFirstMonday('1 October ' + todayYear);
    let fourthQuarter = findFirstMonday('1 January ' + (todayYear + 1));
    let thisJan = findFirstMonday('1 January ' + (todayYear));
    if (today < thisJan) {
        return (thisJan.toLocaleDateString());
    }
    else if (today < firstQuarter) {
        return (firstQuarter.toLocaleDateString());
    }
    else if (today < secondQuarter) {
        return (secondQuarter.toLocaleDateString());
    }
    else if (today < thirdQuarter) {
        return (thirdQuarter.toLocaleDateString());
    }
    else if (today < fourthQuarter) {
        return (fourthQuarter.toLocaleDateString());
    }
}

/**
 * Adds a fixed SANDBOX footer to the page when the URL indicates a sandbox environment.
 */
function addMyFooter() {
    var nextRefresh = getNextRefresh();
    var html = `<style>#sandboxfooter {
    background: red;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2em;
    color: #FFF;
    text-align: center;
    } </style><div id='sandboxfooter'>SANDBOX - Wiped and refreshed first Monday of every quarter - next: ${nextRefresh}</div>`;

    if (document.location.href.indexOf('help.vccs.edu/SB') > -1) {
        appendHtml(document.body, html);
    }
}
addMyFooter();

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
 * Attempts to match the current path against a regex by stripping segments until a match is found.
 */
function findMatchingPath(currentPath, matchTo) {
    let segments = currentPath.split('/');

    while (segments.length > 0) {
        const testPath = segments.join('/') || '/';
        const regex = new RegExp(matchTo, "gi");
        if (testPath.match(regex)) {
            return testPath;
        }
        segments.pop();
    }

    return null;
}

/**
 * Adds related KB article links to the ticket form based on the subject field blur event.
 */
function addRelatedKBArticles() {
    var ticketSubjectID = 'attribute1303';
    if (document.getElementById(ticketSubjectID)) {
        const searchPath = findMatchingPath(document.location.pathname, "/portal$");
        document.getElementById(ticketSubjectID).onblur = function () {
            $.get(searchPath + '/Shared/AutocompleteSearch?componentStr=kb&searchText=' + $('#' + ticketSubjectID).val(), null, function (result) {
                if (result.length > 0) {
                    var html = result.map(item => "<a href=\"" + item.itemUrl + "\">" + item.title + "</a>").join("<br>");
                    html = "<div id=\"kbrelated\" class=\"p-2\" style=\"padding-bottom: 2em;\"><h3>Related Articles</h3>" + html + "</div>";
                    if ($("#kbrelated").length) {
                        $("#kbrelated").html(html);
                    }
                    else {
                        $("#divButtons").prepend(html);
                    }
                }
            }, 'json');
        }
    }
}

addRelatedKBArticles();

/**
 * Determines a location prefix from page context using department, explicit location stem, URL, or Campus field.
 */
function getPrefixFromContext() {
    const colleges = [
        { name: 'Brightpoint', id: 2948 },
        { name: 'Laurel Ridge', id: 2980 },
        { name: 'Reynolds', id: 3023 },
        { name: 'System Office', id: 1981 }
    ];
    var prefix = "";

    var department = $('#s2id_attribute1304 #select2-chosen-2');
    if (department.length > 0) {
        var rx = /.* \- ([^\(]*)/;
        var arr = rx.exec(department.text());
        var deptprefix = arr[1].trim();
        colleges.forEach(checkDeptPrefix);
    }

    function checkDeptPrefix(college) {
        if (deptprefix.indexOf(college.name) > -1) {
            prefix = deptprefix;
        }
    }

    var stemInHTML = $('.locationStem').text();
    if (stemInHTML.length > 0) {
        prefix = stemInHTML;
    }

    if (prefix == "") {
        colleges.forEach(checkURL);
    }

    function checkURL(college) {
        if (document.location.href.indexOf(college.id) > -1) {
            prefix = college.name;
        }
    }

    var campusSelector = $('label:contains("Campus")');
    if (campusSelector.length > 0 && campusSelector.text() == 'Campus') {
        var campusAttr = campusSelector.attr('for');
        var campus = $(campusAttr).val();
        prefix = prefix + ' - ' + campus;
    }

    return prefix;
}

/**
 * Hooks the location lookup AJAX request and prefixes the search tag based on context.
 */
function prefilterLocationSearch(prefix) {
    var flContinue = false;
    if ($('#attribute5211').length > 0 && document.location.href.indexOf('SBTDClient/') > -1) {
        $(document).on("ajaxSend", function (evt, jqXHR, ajaxOptions) {
            if (/SBTDClient.*WebServices\/JSON\/AssetLocationsLookupService.asmx\/GetItems/.test(ajaxOptions.url)) {
                var testPrefix = getPrefixFromContext();
                if (prefix == null || prefix != testPrefix) {
                    prefix = testPrefix;
                }
                console.log('adding prefix to location lookup: ' + prefix);
                var data = JSON.parse(ajaxOptions.data);
                data.tag = prefix + ' - ' + data.tag;
                ajaxOptions.data = JSON.stringify(data);
            }
        });
    }
}

prefilterLocationSearch();

/**
 * Reads a hidden JSON config element and returns the requested object key if found.
 */
function getCustomFormJSONObj(objID) {
    const customFormElements = document.querySelector('.formCustomElements, .tdx-validate-config');
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

// merges passed in object to any global attributes defined in the script, so that we can add new attributes without needing to edit the script directly.
function getGlobalAttributeConstaints(objIn) {
    const constraints = {
        "attribute14516": {
            "email": {
				message: "doesn't look like a valid email"
			}
        }
    };
    const merged = { ...constraints, ...objIn };
    return merged;
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
function addElementAttributes() {
    const customAttributes = getCustomFormJSONObj("customAttributes");
    const globalAttributes = getGlobalAttributes(customAttributes);
    const form = document.querySelector('form');
    if (globalAttributes && form) {
        Object.keys(globalAttributes).forEach(function (key) {
            var element = document.getElementById(key);
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
function validateFormWithLibrary() {
	// potentially merge with global object
    const localConstraints = getCustomFormJSONObj("constraints");
    const constraints = getGlobalAttributeConstaints(localConstraints);
    const form = document.querySelector('form');

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
                    showErrors(errors);
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

function showErrors(errors) {
    //debugger;
    errorFields = Object.keys(errors);
    errorFields.forEach(field => {
        var fieldEl = document.getElementById(field);
        if (fieldEl) {
            
            fieldEl.classList.add('error');
            // Create a new span element
            const newSpan = document.createElement('span');
            newSpan.id = field + "-error";

            var errorMessage = errors[field][0];
            const regex = new RegExp(field, "i"); 
            const currValue = fieldEl.value || '';

            newSpan.textContent = errorMessage;

            newSpan.innerHTML = newSpan.innerHTML.replace(regex, "<strong>" + currValue + "</strong>");

            // 3. create parent span element
            const pSpan = document.createElement('span');
            pSpan.setAttribute('class', 'field-validation-error');
            pSpan.setAttribute('data-valmsg-for',field);
            pSpan.setAttribute('data-valmsg-replace','true');
            pSpan.appendChild(newSpan);

            // 4. Insert it immediately after as a sibling
            fieldEl.after(pSpan); 

        }
    });

}

/**
 * Requires specific select2 dropdown values before allowing the form to submit.
 * Disables the submit button until all required values match.
 * Really should be superceded by the above validate.js implementation.
 */
/*

Embed a hidden div with a class of formCustomElements and a JSON string inside, to pass configuration to the script without needing to edit the script directly. For example:
<div class="formCustomElements" style="display:none;">
{
	"requiredIDArr": [
		{
			"elemID": "146259",
			"reqValue": "Yes"
		},
		{
			"elemID": "146260",
			"reqValue": "Yes"
		},
		{
			"elemID": "146261",
			"reqValue": "Yes"
		}
	]
}
</div>

*/

function requireFormElementValues() {
    let idArr = getCustomFormJSONObj("requiredIDArr");

    if (idArr == null || idArr.length == 0) {
        return;
    }

    const submitBtn = $('input[type="submit"], button[type="submit"]');

    function validateDropdowns() {
        for (const formElement of idArr) {
            var data = $('[id$=' + formElement.elemID + ']').select2('data');
            if (data === null || data.text !== formElement.reqValue) {
                return false;
            }
        }
        return true;
    }

    $('form').on('submit', function (e) {
        if (!validateDropdowns()) {
            alert('All three questions must be answered "Yes" to submit the form.');
            e.preventDefault();
            return false;
        }
        return true;
    });

    idArr.forEach(formElement => {
        $(`#attribute${formElement.elemID}`).on('change', function () {
            const isValid = validateDropdowns();
            if (!isValid) {
                submitBtn.prop('disabled', true);
            } else {
                submitBtn.prop('disabled', false);
            }
        });
    });

    submitBtn.prop('disabled', !validateDropdowns());
}

function hideNonApproveArticlesByDefault() {
  // Prevent duplicate insertion
  if (document.getElementById('tdx-approval-toggle-container')) return;

  if (!document.querySelector('#divResults .row, div[class*="result"]')) {
    return;
  }

  // Function to filter/hide non-approved articles and their adjacent <hr> tags
  function filterArticles(showAll) {
    const articles = document.querySelectorAll('.search-result, [class*="search-result"], .media-body, #divResults .row, div[class*="Result"]');
    
    articles.forEach(article => {
      // Check if item contains the "Approved" badge/text
      const isApproved = article.innerText.includes('Approved') && !article.innerText.includes('Not Approved');

   	  const isKBArtcle = article.querySelector('a[href*="/KB/"]');

      // Target the immediate next element if it is an <hr> tag
      let nextElem = article.nextElementSibling;
      while (nextElem && nextElem.tagName !== 'HR' && !nextElem.classList.contains('search-result')) {
        // Look ahead within immediate wrappers if needed
        nextElem = nextElem.nextElementSibling;
      }

      if (!isApproved && isKBArtcle) {
        article.style.display = showAll ? '' : 'none';
        if (nextElem && nextElem.tagName === 'HR') {
          nextElem.style.display = showAll ? '' : 'none';
        }
      } else {
        article.style.display = '';
        if (nextElem && nextElem.tagName === 'HR') {
          nextElem.style.display = '';
        }
      }
    });
  }

  // Target the second search input container
  const searchInputs = document.querySelectorAll('input[type="search"], input[type="text"]');
  const targetSearchInput = searchInputs[1] || searchInputs[0];

  if (!targetSearchInput) {
    console.error('Could not find search box');
    return;
  }

  const searchWrapper = targetSearchInput.closest('.input-group') || targetSearchInput.parentElement;

  // Create UI container
  const container = document.createElement('div');
  container.id = 'tdx-approval-toggle-container';
  container.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    margin-bottom: 15px;
    font-family: sans-serif;
    font-size: 14px;
    color: #333;
  `;

  // Create Checkbox element
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'show-unapproved-chk';
  checkbox.style.cssText = 'cursor: pointer; width: 16px; height: 16px; margin: 0;';

  // Create Label element
  const label = document.createElement('label');
  label.htmlFor = 'show-unapproved-chk';
  label.innerText = 'Show Unapproved Articles';
  label.style.cssText = 'cursor: pointer; margin: 0; user-select: none; font-weight: normal;';

  // Assemble and insert under the search bar
  container.appendChild(checkbox);
  container.appendChild(label);
  searchWrapper.insertAdjacentElement('afterend', container);

  // Toggle visibility on checkbox change
  checkbox.addEventListener('change', (e) => {
    filterArticles(e.target.checked);
  });

  // Run initial filter to hide non-approved items
  filterArticles(false);
}

/*
 * Replace the TDX site search "scope" dropdown with radio buttons under each
 * search box. Radios drive the original dropdown's menu items (via their
 * existing click handlers), so TDX's search logic stays in sync.
 */
function convertSearchScopesToRadios() {
	
    // Custom radio labels (keyed by TDX component code)
    var LABELS = { kb: 'Articles', sc: 'Services' };

    $('button[id^="SiteSearch-filter-"]').each(function () {
        var $btn = $(this);
        if ($btn.data('radiosBuilt')) return;          // don't build twice
        $btn.data('radiosBuilt', true);

        var uid = this.id.replace('SiteSearch-filter-', '');
        var $group = $btn.closest('.input-group.site-search');
        var current = $btn.data('component') || $btn.attr('data-component');

        var $fs = $('<fieldset class="site-search-scope"></fieldset>')
            .css({ border: 0, margin: '6px 0 0', padding: 0, width: '100%' })
            .append('<legend class="sr-only">Search scope</legend>');

        $group.find('.dropdown-menu a[data-component]').each(function () {
            var $a = $(this);
            var comp = $a.data('component');
            var rid = 'SiteSearch-scope-' + uid + '-' + comp;

            var $radio = $('<input type="radio">')
                .attr({ id: rid, name: 'SiteSearch-scope-' + uid, value: comp })
                .prop('checked', comp === current)
                .on('change', function () {
                    if (this.checked) $a.trigger('click');   // let TDX set the scope
                });

            $('<label></label>')
                .attr('for', rid)
                .css({ fontWeight: 'normal', marginRight: '10px', cursor: 'pointer', whiteSpace: 'nowrap' })
                .append($radio, ' ' + (LABELS[comp] || $a.data('componentText')))
                .appendTo($fs);
        });

        // Hide the dropdown toggle (and its wrapper if it holds nothing else)
        var $wrap = $btn.closest('.input-group-btn');
        $btn.hide();
        if ($wrap.find('button:visible').length === 0) $wrap.hide();

        // The text input is no longer the first child, so its left corners are
        // square and cover the group's rounded border. Round them to match.
        var gs = window.getComputedStyle($group[0]);
        var r = Math.max((parseFloat(gs.borderTopLeftRadius) || 0) - (parseFloat(gs.borderLeftWidth) || 0), 0) + 'px';
        $group.find('input[id^="SiteSearch-text-"]').each(function () {
            this.style.setProperty('border-top-left-radius', r, 'important');
            this.style.setProperty('border-bottom-left-radius', r, 'important');
        });

        $group.after($fs);
    });
}

$(document).ready(function () {
    requireFormElementValues();
    validateFormWithLibrary();
    addElementAttributes();
    convertSearchScopesToRadios();
    hideNonApproveArticlesByDefault();
});
