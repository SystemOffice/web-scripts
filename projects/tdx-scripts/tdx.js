function parseQueryString() {
    if ( window.location.href.indexOf('?') == -1 ){
        return
    }
   var qs = window.location.href.split('?')[1];
   try{
    var item = qs.split('&');
    var data = {};
    for (var i=0; i < item.length; i++) {
        key = item[i].split('=')[0];
        value = item[i].split('=')[1];
		for (var x=0; x < document.forms.length; x++){
			if (document.forms[x][key]){
				document.forms[x][key].value = value;
			}
		}
        // data[key] = value;
    }
   }
   catch(err) {
    console.log(err);
   }
   // return data;
}
parseQueryString();

var baseURLObj = document.currentScript.src;
var baseURL = baseURLObj.split('/').slice(0, -1).join('/')+'/';

// add css
function addCss(){
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', baseURL + 'tdx.css');
    link.setAttribute('type', 'text/css');
	document.head.appendChild(link);
}
addCss();


function loadScriptAsync(src) {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
          });
}


function dynamicallyLoadScript(url) {
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL
    // script.defer =

    document.head.appendChild(script);
}

loadScriptAsync(baseURL + 'tdx-toc.js')
    .then(() => console.log('tdx-toc.js script loaded successfully'))
    .catch(error => console.error(error));
// dynamicallyLoadScript(baseURL + 'tdx-toc.js');

function runMarkdown(){
	if (marked !== undefined){
		document.querySelectorAll('.js-custom-attributes-container .form-group .wrap-text').forEach(function(element) {
		  // Perform an action on each 'element'
		  if (/[\#\-]/.test(element.innerHTML)){
			element.innerHTML = marked.parse(element.innerHTML.trim().replaceAll('<br>','\r\n'));
		  }
		});
		
		var aboutMe = document.querySelector('#divAboutMe p');
		if (aboutMe && /[\#\-]/.test(aboutMe.outerHTML)){
			aboutMe.outerHTML = marked.parse(aboutMe.innerHTML.trim().replaceAll('<br>','\r\n'));
		}
	}
}

loadScriptAsync('https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js').then(() => runMarkdown());

function getSearchBox() {
        var node = document.querySelector('input[id^="SiteSearch-text"');
        if (node){
            node.placeholder="What may we help you with?";
        }
}

getSearchBox();

function moveDetailsDown() {
	$('div.panel[id*=Related], div.panel[id*=KB]').insertBefore('#divDetails');
}

moveDetailsDown();

function checkImages(){
	if (document.querySelector('a[href*="Edit"]')){
		$("img:not([alt]), img[alt='']").each(function() {
				$(this).before("<a href=\"https://www.w3.org/WAI/tutorials/images/decorative/\" \
						target=\"new\" \
						title=\"possibly missing alt tag, review url for details\" \
						class=\"altSpan\" \
						style=\"color:black;font-weight:bold;font-family:sans-serif;font-size:small;background-color:yellow;speak:literal-punctuation;\">\
						Image❌alt=\""+$(this).attr('alt')+"</a>");
			});
	}
}

checkImages();

function copyTableColumnToClipboard(table, columnIndex) {
  // console.log(table,columnIndex);
  // const table = document.getElementById(tableId);
  if (!table) {
    console.error("Table with ID '" + tableId + "' not found.");
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

  const textToCopy = columnData.join('\n'); // Join with newlines for multi-line copy

  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      console.log('Column data copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
    });
}

function tableSort(table, columnIndex){

    function compareTableRows(rowA, rowB, columnIndex, isAscending) {
        let cellA = rowA.cells[columnIndex].innerText;
        let cellB = rowB.cells[columnIndex].innerText;

        // Handle different data types (e.g., numbers vs. strings)
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

// adding sort function
function addCopyToColumnHeadings(){
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
		
			// console.log(item,i);
			item.insertAdjacentHTML('beforeend', "<span>&nbsp;</span><i class=\"fa-solid fa-copy\" style=\"display:none;\"></i>");
			item.insertAdjacentHTML('beforeend', "<i class=\"fa-solid fa-sort\" style=\"display:none;\"></i>");

			item.onmouseover = function(e){
				// console.log('test');
				item.querySelector(':scope i').style.display = 'inline-block';
				item.querySelector(':scope i.fa-sort').style.display = 'inline-block';
				item.querySelector(':scope i').title='Click to copy column';
				item.querySelector(':scope i.fa-sort').title = 'Click to sort';
				item.style.cursor = 'pointer';
			};		
			item.onmouseout = function(e){
				// console.log('test2');
				item.querySelector(':scope i').style.display = 'none';
				item.querySelector(':scope i.fa-sort').style.display = 'none';
				item.title='';
			};
			item.querySelector('.fa-copy').onclick = function(e){
				copyTableColumnToClipboard(tableElement, i);
			}
			item.querySelector('.fa-sort').onclick = function(e){
				tableSort(tableElement, i);
			}
		}
	);
}

addCopyToColumnHeadings();


/*
// now done in pure css
function isTech(){
	var tdnextlink = $('.user-profile-menu a[href*="TDNext"]');
	if (tdnextlink.length > 0){
		return true;
	}
	return false;
}

function showTechOnly(){
	if (isTech()){
		$('.techOnly').show();
	}
	else {
		$('.techOnly').hide();
	}
}

showTechOnly();
*/

function setupCollapsiblePanels(){
	var panels = document.querySelectorAll('.panel.collapsible');
	var ct=0;
	panels.forEach(setIdAndTarget);

	function setIdAndTarget(item) {
		// console.log(item);
		var datatarget='collapsible-item' + ct;
		item.querySelector('.panel-heading input, .panel-heading').setAttribute('data-target', "#" + datatarget);
		item.querySelector('.panel-body').id = datatarget;
		ct++;
	}
}

setupCollapsiblePanels();


function setupBootstrapTabs(){
        var tabPanes = document.querySelectorAll('.tab-pane.vccs');
        // console.log('testing');

        if (tabPanes.length > 0){
                addTabs(tabPanes);
        }

        function addTabs(tabPanes){
                if (!document.querySelector('.tab-content.vccsTabs') ){
                        $(".tab-pane.vccs").wrapAll("<div class='tab-content vccsTabs' />")
                }
                // addWrapper(tabPanes);
                if (!document.querySelector('.nav-tabs.vccsTabs')){
                        addTopBar(tabPanes);
                }
        }

        function addTopBar (tabPanes){
                var topBar = document.createElement('ul');
                topBar.className = 'nav nav-tabs vccsTabs';
                topBar.id = 'topbar';
                topBar.role = "tablist";
                var wrapper = document.querySelector('.tab-content.vccsTabs');
                wrapper.insertAdjacentElement('beforebegin', topBar);

                // initial values for first tab
                var ariaExpanded = 'true';
                var classText = "class=\"active\" ";
                var ct = 1;
                var itemClassName = "tab-pane fade in active";

                // console.log($('#topbar'));

                tabPanes.forEach (el => {
                        // topbar tabs
						//console.log(el);
                        // tab content
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
                // console.log($('#topbar').html());
                // $('.tab-content.vccsTabs').before ( $('#topbar') );
        }

}
setupBootstrapTabs();

function setupTabs(){
	var tabs = document.querySelectorAll('.vtab');
	if (tabs.length > 0){
		addsideBar();
	}

	tabs = document.querySelectorAll('.htab');
	if (tabs.length > 0){
		addTopBar();
	}

	tabs = document.querySelectorAll('.vtab, .htab');

	if (tabs.length > 0){
		var ct=0;
		tabs.forEach(setIdAndTarget);
		showTab(document.getElementsByClassName("tablink")[0]);
	}

	function setIdAndTarget(tab) {
		var datatarget='vccstab' + ct;
		tab.id = datatarget;
		tab.className += ' w3-animate-opacity';
		tab.setAttribute('id',datatarget);
		tab.style.display = 'none';
		addButton(tab);
		ct++;
	}

	function addTopBar(){
		var topBar = document.createElement('div');
		topBar.className = 'w3-bar w3-card';
		topBar.id = 'vccsTOCBar';
		document.querySelector('.vtab, .htab').insertAdjacentElement('beforebegin', topBar);
		return (topBar);
	}

	function addsideBar(){
		var sideBar = document.createElement('div');
		sideBar.className = 'w3-sidebar w3-bar-block w3-card col-md-1';
		sideBar.id = 'vccsTOCBar';
		document.getElementById('divMainContent').insertAdjacentElement('beforebegin', sideBar);

		var menuheading = document.createElement('h5');
		menuheading.className='w3-bar-item';
		menuheading.innerText='Menu';
		sideBar.appendChild(menuheading);

		document.querySelector('.col-md-4').className='col-md-3';

		return (sideBar);
	}

	function addButton(tab){
		var sideBar = document.querySelector('#vccsTOCBar');
		var buttonName = tab.querySelector('h2').innerText;
		var button = document.createElement('button');
		button.className = 'w3-bar-item w3-button tablink';
		button.innerText = buttonName;
		button.setAttribute('data-toggle',tab.id);
		button.id = 'button' + tab.id;
		button.onclick = function(e){showTab(e.currentTarget); return false;};
		sideBar.appendChild(button);
	}

	function showTab(clickedButton){
		var i;
		var tabs = document.querySelectorAll('.vtab, .htab');
		for (i = 0; i < tabs.length; i++) {
			tabs[i].style.display = "none";
		}
		// unhighlight
		tablinks = document.getElementsByClassName("tablink");
		for (i = 0; i < tablinks.length; i++) {
			tablinks[i].className = tablinks[i].className.replace(" w3-green", "");
		}
		// highlight
		var tabTarget = clickedButton.getAttribute('data-toggle');
		document.getElementById(tabTarget).style.display = "block";
		clickedButton.className += " w3-green";
		return false;
  }
}

setupTabs();

// add sandbox footer
function appendHtml(el, str) {
  var div = document.createElement('div'); //container to append to
  div.innerHTML = str;
  while (div.children.length > 0) {
    el.appendChild(div.children[0]);
  }
}

function findFirstMonday(dateString) {
  let targetDate = new Date(dateString);
  let targetMonth = targetDate.getMonth();
  let targetYear = targetDate.getFullYear();
  let firstDateInMonth = new Date(targetYear, targetMonth, 1);
  let firstWeekdayInMonth = firstDateInMonth.getDay();
  let firstMondayDate = 1 + ((8 - firstWeekdayInMonth) % 7);
  return new Date(targetYear, targetMonth, firstMondayDate);
}

function getNextRefresh(){
	let today = new Date();
	let todayYear = today.getFullYear();
	let firstQuarter = findFirstMonday('1 April ' + todayYear);
	let secondQuarter = findFirstMonday('1 July ' + todayYear);
	let thirdQuarter = findFirstMonday('1 October ' + todayYear);
	let fourthQuarter = findFirstMonday('1 January ' + (todayYear + 1));
	let thisJan = findFirstMonday('1 January ' + (todayYear));
	if (today < thisJan){
		return(thisJan.toLocaleDateString());
	}
	else if (today < firstQuarter){
		return(firstQuarter.toLocaleDateString());
	}
	else if (today < secondQuarter){
		return(secondQuarter.toLocaleDateString());
	}
	else if (today < thirdQuarter){
		return(thirdQuarter.toLocaleDateString());
	}
	else if (today < fourthQuarter){
		return(fourthQuarter.toLocaleDateString());
	}
}

function addMyFooter(){
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

    if (document.location.href.indexOf('help.vccs.edu/SB') > -1 ){
	    appendHtml(document.body, html);
    }
}
addMyFooter();

function isSandbox(){
    if (document.location.href.indexOf('help.vccs.edu/SB') > -1 ){
        return true;
    }
    return false;
}

function addRelatedKBArticles(){
 // if (isSandbox()){

  var ticketSubjectID = 'attribute1303';
  if (document.getElementById(ticketSubjectID)){
   document.getElementById(ticketSubjectID).onblur = function() {
	$.get('../../Shared/AutocompleteSearch?componentStr=kb&searchText=' + $('#' + ticketSubjectID).val(),null,function(result) {
		if (result.length > 0){
			var html = result.map(item => "<a href=\"" + item.itemUrl + "\">" + item.title + "</a>").join("<br>");
			html = "<div id=\"kbrelated\" class=\"p-2\" style=\"padding-bottom: 2em;\"><h3>Related Articles</h3>" + html + "</div>";
			// if it exists, replace it
			if ($("#kbrelated").length) {
				$("#kbrelated").html(html);
			}
			else {
				$("#divButtons").prepend(html);
			}
		}
	},'json');
   }
  }

 // }
}

addRelatedKBArticles();

// The code below is designed to prefilter location searches conducted using the built-in location field
// It does this by hooking into the ajax call and prefixing the search - NOT IN ACTIVE USE
// Getting the appropriate prefix can be done in a number of ways
//
// various options to get the appropriate context or search stem
// Department field <span class="select2-chosen" id="select2-chosen-2">BC - Brightpoint (JT)</span>
// HTML element <span class="locationStem" style='display:none'>Brightpoint</span>
// if there is a campus form element
// look at url
function getPrefixFromContext(){
	const colleges = [
						{name: 'Brightpoint', id: 2948},
						{name: 'Laurel Ridge', id: 2980},
						{name: 'Reynolds', id: 3023},
						{name: 'System Office', id: 1981}
						];
	var prefix = "";

	// first look at the department of the requester
	var department = $('#s2id_attribute1304 #select2-chosen-2');
	// console.log(department);
	if (department.length > 0){
		  var rx = /.* \- ([^\(]*)/;
		  var arr = rx.exec(department.text());
		  var deptprefix = arr[1].trim();
		  // validate that the department (which is typically the college, but not always)
		  // begins with a valid location prefix
		  colleges.forEach(checkDeptPrefix);
	}

	function checkDeptPrefix(college){
		if (deptprefix.indexOf(college.name) > -1){
			// this makes an assumption about dept prefixes
			// prefix = college.name might be better
			prefix=deptprefix;
		}
	}

	// allow for defining the location stem in an html element
	// e.g. <span class="locationStem" style="display:none;">Laurel Ridge</span>
	// assume it overrides the requester department
	var stemInHTML = $('.locationStem').text();
	if (stemInHTML.length > 0){
		prefix = stemInHTML;
	}

	// failing the above, look at the url
	if (prefix == ""){
		colleges.forEach(checkURL);
	}

	function checkURL(college){
		if (document.location.href.indexOf(college.id)>-1){
			prefix = college.name;
		}
	}

	// allow for an input element for Campus
	var campusSelector = $('label:contains("Campus")');
	if (campusSelector.length > 0 && campusSelector.text() == 'Campus'){
		var campusAttr = campusSelector.attr('for');
		var campus = $(campusAttr).val();
		prefix = prefix + ' - ' + campus;
	}

	return prefix;
}

function prefilterLocationSearch(prefix){
	// testing
	var flContinue = false;
	// console.log('text');
	if ($('#attribute5211').length > 0 && document.location.href.indexOf('SBTDClient/')>-1){
		$(document).on("ajaxSend", function(evt, jqXHR, ajaxOptions){
			// console.log(evt);
			// console.log(jqXHR);
			// console.log(ajaxOptions);
			if (/SBTDClient.*WebServices\/JSON\/AssetLocationsLookupService.asmx\/GetItems/.test(ajaxOptions.url)){
				var testPrefix = getPrefixFromContext();
				if (prefix == null || prefix != testPrefix){
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

// require specific values on specific form elements before submission
function requireFormElementValues(idArr,formID){
	// Wait for DOM to be ready
	$(document).ready(function() {
		// Check if we're on the correct form page
		// DT removed leading / so it will match in SB too, and switched to RegExp so you can use it on other forms
		var formTest = new RegExp('TDClient/.*/NewForm\\\?ID=' + formID);
		if (!window.location.href.match(formTest)) {
			return; // Exit if we're not on the External Research Request form
		}

		// Find the submit button
		const submitBtn = $('input[type="submit"], button[type="submit"]');

		// Function to check if all dropdowns are "Yes"
		function validateDropdowns() {
			// use the input idArr
			for (const formElement of idArr){
				var data = $('[id$=' + formElement.elemID + ']').select2('data');
				if (data === null || data.text !== formElement.reqValue){
					return false;
				}
			}
			return true;
		}

		// Add submit event handler to the form
		$('form').on('submit', function(e) {
			if (!validateDropdowns()) {
				// DT - submit button is disabled anyway, so this may never kick in
				alert('All three questions must be answered "Yes" to submit the form.');
				e.preventDefault();
				return false;
			}
			return true;
		});

		// Add change event listeners to fields to update validation in real-time
		// use input idArr
		idArr.forEach(formElement => {
			$(`#attribute${formElement.elemID}`).on('change', function() {
				const isValid = validateDropdowns();
				if (!isValid) {
					submitBtn.prop('disabled', true);
				} else {
					submitBtn.prop('disabled', false);
				}
			});
		});

		// Initial validation check
		submitBtn.prop('disabled', !validateDropdowns());
	});
}

// this approach allows for reuse on other forms
// this is for a VPCC form
var idArr = [
	{
		"elemID": '146259',
		"reqValue": 'Yes'
	},
	{
		"elemID": '146260',
		"reqValue": 'Yes'
	},
	{
		"elemID": '146261',
		"reqValue": 'Yes'
	},
];
var formID = 'iOikqKQn0z8_';
requireFormElementValues(idArr, formID);
