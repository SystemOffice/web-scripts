// ---------------------------------------------------------------------------------------
// is_core_config.js - This is a core library from IntraSee.
//
// Copyright 2008,2021 IntraSee - Use and modification subject to terms of license.
// Reuse or Redistribution of this source code with or without modification is strictly prohibited.
//
// This provides functions to retrieve customer specific config options for is_core.
//
// ----------------------------------------------------------------------------------------

/**
* @fileoverview
* is_core_config.js 1.60.00.27 - This is the config file for use with is_core.js.
*
* Copyright 2008,2021 IntraSee - Use and modification subject to terms of license.
* Reuse or Redistribution of this source code with or without modification is strictly prohibited.
*
*/

/**
 * Core Configuration
 *
 * @typedef {Object} CoreConfig
 *  @property {string} LB_WRAPPER_DEFAULT - Legacy: Wrapper for Lightboxes (CSS3).  Graphic borders for IS_LB_SAHDOW and IS_LB_TRANSWRAP for non-CSS3.  default="IS_LB_SHADOW"
 *  @property {boolean} LB_WRAPPER_DEFAULT_ENABLED - Enable the setting of the default wrapper styles when none is requested. default=true
 *  @property {boolean} LB_WRAPPER_IBORDER_DISABLED - This will ignore the graphic wrapper. Used for transitions of legacy code. default=true
 *  @property {boolean} IS_TOGGLE_DEFAULT_DISPMODE - iToggle will use this value if nothing passed in.  i.e. "", "static", "block".  Used by Grow effects. default=""
 *  @property {Number} IS_TOGGLE_DURATION - Default value in ms used by iGrow and other toggle routines. default=200
 *  @property {boolean} LB_GET_RELATED_PAGELETS - Legacy: Deprecated (Use lbShowRelated below.)  default=true
 *  @property {boolean} IS_LB_PRESERVE_ENABLED - Default setting for preserving a lightbox (i.e. when going to related pagelet's content and then returning.)  default=true
 *  @property {boolean} ENABLE_FOCUS=true - Enable setting of focus in iPsoftComponent. default=true
 *  @property {boolean} ENABLE_FOCUS_FIX=false - Will aply a focus fix to change focus between a couple of fields if set to true. Addresses an IE8 issue if encountered without the fix.  default=false
 *  @property {boolean} ENABLE_FIRST_FOCUS_FIX=true - Will find first input, textarea, select, or a and apply focus if current focus is outside of lightbox
 *  @property {boolean} IPSOFTCOMP_FIX_GRIDLIST_WIN0 - Fixes a PeopleTools 8.50 bug where some win0 objects are used instead of win10.  true will update these to win10. default=false
 *  @property {boolean} IS_LB_RESET_SCROLLTOP - true = reset scrolltop position on open of lightbox.  Should typiclaly be false if IPSOFTCOMP_RESET_TOP_NEWPAGE=true.  default=false.
 *  @property {boolean} IPSOFTCOMP_RESET_TOP_NEWPAGE - Will reset the scrolltop if a new strCurrUrl is encountered.  Handles page navigation.  default=true
 *  @property {boolean} IS_LB_STACKED_CLASS - Deprecated.  Use class.lbStacked below  default="IS_LB_STACKED"
 *  @property {boolean} IS_DATEPICKER_ENABLED - This will enable a custom datepicker if the iDate datePicker routines have been overwritten.  default=false
 *  @property {boolean} IS_NATIVEDATE_ENABLED - This will enable "date" input types if it is available.  default=false
 *  @property {boolean} IS_AJAX_SEND_CONTENT_LENGTH - When true, will send content length during AJAX requests.  (For legacy support against HTTP 1.0 proxies, etc.)  default=false
 *  @property {string} IS_CORE_MERGE_IMMUTABLE - true = (default) will make copies of parameter objects instead of pointers, false = (legacy) By Reference will use pointers for complex objects
 *  @property {number} IS_CORE_MERGE_ARRAY - 0 = merge by position (legacy), 1 = concat, 2 = replace (default)
 *  @property {boolean} ajaxPeopleSoftTimeout - Will call the PeopleSoft timeout handlers if they exist.  default=true
 *  @property {boolean} ajaxDupPreventionThreshold - This is the duration in ms to check for existing active requests.  0 will be inactive.  default=2000
 *  @property {string} loaderExtraClass - default loader class is isLoader.  Additional classes can be added here to default to a different style spinner (i.e. isLoader2)
 *  @property {Number} ConsoleMode - Default logging level when using IS.Console 0=debug, 1=warning, 2=error
 *  @property {Number} templateStorage - Default local storage when using IS.Template. 0=none, 1=sessionStorage, 2=localStorage
 *  @property {Number} lbContainerTop - Lightbox is positioning with this much padding from top of viewport default=50
 *  @property {Number} lbContainerWidth - Width of the iLightbox container.  "" will default to class widths default=900
 *  @property {Number} lbContainerZindex - FUTURE. "" will default to class widths.  A Number will allow an override. default=""
 *  @property {boolean} lbFadeMode - Override of Fade mode for iLightbox and Component's lightbox. Remove for Legacy iLightbox = false, iComponent=true first first display) default=false
 *  @property {string} loaderImage - The path to a loader image.  default=iGetBrandingImagesFolder() + iGetLoaderImage()
 *  @property {boolean} lbAccessibilityFocus - If true, focus will stay in the lightbox.  If false, it can go to underlying page.  default=true
 *  @property {boolean} lbAccessibilityEscape - If true, an escape key will close the lightbox for accessibility purposes.  If false, it will not.  default=true
 *  @property {boolean} lbAutoSize - If true, dynamic width/height sizing is applied.  If false, it will default to legacy settings.  default=true
 *  @property {boolean} lbAutoSizeStartWidth - The starting width for an AutoSize, for initial open when no content yet.
 *  @property {boolean} lbAutoSizeMinWidth - The minimum width for an AutoSize.  Leaving as "" will not apply.
 *  @property {boolean} lbAutoSizeMaxWidth - The maximum width for an AutoSize.  Leaving as "" will not apply.
 *  @property {object} classes - This object contains classes to be used for various Lightbox parts.
 *  @property {string} classes.lbContainer - This is the Container class around the entire Lightbox.  default="IS_LB"
 *  @property {string} classes.lbHeader - This is the class for the Lightbox's header div.  default="IS_LB_HEADER"
 *  @property {string} classes.lbWorking - This is the class for the Lightbox's working overlay div.  default="IS_LB_WORKING"
 *  @property {string} classes.lbContent - This is the class for the Lightbox's content div. All related content sections and main section are within this one.  default="IS_LB_CONTENT"
 *  @property {string} classes.lbBackground - This is the background overlay when aLightbox is open.  default="IS_LB_BG"
 *  @property {string} classes.lbFrame - Legacy: This is the background overlay for older browser's when teh Lightbox is open.  default="IS_LB_FRAME"
 *  @property {string} classes.lbContentFrameClass - This is the class for a Lightbox's iframe content.  default="IS_LB_IFRAME_CONTENT"
 *  @property {string} classes.lbCloseLink - This is the class for a Lightbox's close button/link.  default="IS_LB_CLOSE_LINK"
 *  @property {string} classes.lbWrapper -This will be the default class applied to the wrapper.  Class is in Psoft substyle classes with the other Lightbox classes. This is used when no wrapper class is passed in the Initialization, and default LB wrapper is enabled.  default="IS_LB_SHADOW"
 *  @property {string} classes.lbWrapperInner - This is an inner wrapper used in conjunction with the lbWrapper, when needed.  default="IS_LB_WRAPPER_INNER"
 *  @property {string} classes.lbContentWrapperOverflow - This is the overflow class added to a Lightbox's content wrapper.  default="IS_LB_OVERFLOW_HIDE_XY"
 *  @property {string} classes.lbContentMainOverflow - This is the overflow class added to a Lightbox's main content area.  default=""
 *  @property {string} classes.lbStacked - This is the class name added to the container when lightboxs are stacked (opened while preserving a previous lightbox)   default="IS_LB_STACKED"
 *  @property {string} classes.lbStackedCurrent - Maintained internally to determine current stacled class.  default=""
 *  @property {boolean} dynamicLayout - Will allow for dynamic layouts used by the dynamic pagelets.  false = uses traditional fixed layout of 4 sections.  true = uses dynamic layouts from the 1.60.00.11 branch, which requires updated CSS.
 *  @property {boolean} lbShowRelated - Will load related pagelets in lightboxes.  false = Will just display requested content.  default=false
 *  @property {number} lbRelatedMode - Mode for how often the related pagelets are refreshed during component displays.  0 = never, 1 = first time, 2 = every time, 3 (default) = every time + original params except for PAGE.  default=3
 *  @property {object} relatedWidths - This is for sizing the 4 related content areas of a Lightbox used by Dynamic Pagelets.  This is needed when not using dynamic templates.  In this case, the lbContentMain will be leftover sizing based on lbContent2+lbContent3.
 *  @property {number} relatedWidths.relatedPadding - The padding in px between related content.  default=10
 *  @property {number} relatedWidths.lbContent1 - The top related content section.  default=900
 *  @property {number} relatedWidths.lbContent2 - The left related content section.  default=0  (Note: CSS usually makes this section's display none.)
 *  @property {number} relatedWidths.lbContent3 - The right related content section.  default=200
 *  @property {number} relatedWidths.lbContent4 - The bottom related content section.  default=900
 *  @property {boolean} useEmbeddedUrlForRelated - Use PeopleSoft URL, based on strCurrUrl, for Related content.  Useful if tracking pages or transfers.   default=true
 *  @property {string} componentURL - iPsoftComponent.  If Initializing iPsoftComponent with a config object, this property will need to be set to teh URL to open.  default=""
 *  @property {string} embeddedDiv - iPsoftComponent. This is usually defined per iPSoftComponent to target specific div elements.  default=""
 *  @property {boolean} componentVisible - iPsoftComponent. Flag to determine if component is visible in the DOM.   default=true
 *  @property {string} pageCustomJS - iPsoftComponent.  String of Custom Javascript to run onload after component's JS has run.  Usually set when initializing.  default=""
 *  @property {boolean} embeddedDivLegacy - iPsoftComponent.  Set this to true to enable legacy behavior of clearing out lightbox content.  Likely will not be needed, and is here for legacy customers.   default=false
 *  @property {boolean} appendLBFlag - iPsoftComponent.  Will append an isLB=Y paramater to iPsoft Calls, which could be used by PeopleCode.  default=false
 *  @property {boolean} forceFormID_win10 - iPsoftComponent.  Newer Tools now includes unique ID.  Force form back to win10 id which iPsoftComponent has been using.
 *  @property {string} iframeId - iComponent.  Iframe ID used when dynamically creating an iframe with iComponent.  default="lbFrameContent"
 *  @property {string} iframeName - iComponent.  Iframe Name used when dynamically creating an iframe with iComponent.  default="lbFrameContent"
 *  @property {number} lbFrameWidth - iComponent.  The width of an iframe.  This can also be handled via teh container. default=900
 *  @property {(number|string)} lbFrameHeight- iComponent.  Leave as "" for dynamic height of same-origin URLs.  Otherwise add height, and update scroll settings. default=""
 *  @property {string} lbFrameScrolling - iComponent.  Value used for iframe scrolling attribute.  default="no"
 *  @property {boolean} lbFrameSeamless - iComponent.  If true, then it will make seamless (HTML5 spec) and frameborder=0 (to cover non-compliant browsers), otherwise frameborder=1   default=true
 *  @property {boolean} lbFrameResizeAuto - iComponent.  If true, then it will determine width/height.  Typically for embedded.  Can set to false for lightbox.   default=true
 *  @property {boolean} lbFrameResizeHeight- iComponent.  If true, then it will do an auto resize of height based on an interval.  Previously done by the caller, so defaulting to false.  default=false
 *  @property {number} lbFrameResizeInterval - iComponent.  Interval to check for a resize of iframe.  default=300
 *  @property {boolean} lbFrameResizeMode - Auto resize mode.  Default = 0 = interval, 1 = several timers and onclick, 2 = set size with scrolls
 *  @property {boolean} dxHideLightbox - Decision Engine.  Hide a DX Lightbox.  i.e. If automatically processing for TX.  default=false
 *  @property {boolean} txHideProgress - Transact.  If true, hide the progress bar.  default=false
 *  @property {boolean} txIframeMode - Transact.  If true, Transact will use iComponent's iframe.  Otherwise, will continue to use iPsoftComponent Proxy.  default=false
 *  @property {number} responsiveWidthThreshold - Responsive.  This is the threshold for the page width before applying additional assistance for Responsive.  default=992 [based on original Responsive settings, but I think this is too high.]
 *  @property {boolean} responsiveEnabled - Responsive.  Default option for enabling responsive.  Used by iPsoftComponent.  Other products could leverage to disable.  Should only be enabled with appropriate licenses and products installed.  default=false
 *  @property {boolean} forceConfigProperties - iLightbox.  When true certain properties config settings will override older API requests (i.e. to have a common lightbox width).  default=false
 *  @property {boolean} noConflict - When true it will not create the $() override so 3rd party libraries (i.e. jQuery) can use it.  Must use IS.$() when this is set.
 *
 */

/* Handle Stand-Alone constants, in case IntraSee Config Manager not called. As part of RM-769 tjese should now be online. */
if (typeof IS_CORE_LOADER === "undefined") 			{ IS_CORE_LOADER = "/intrasee/images/ajax-loader.gif"; }
if (typeof IS_CORE_BLANK_HTML == "undefined")		{ IS_CORE_BLANK_HTML = '/intrasee/blank.html'; }
if (typeof IS_CORE_PIXEL == "undefined")			{ IS_CORE_PIXEL = '/intrasee/images/pixel.gif'; }



/**
* This is the base branding folder.<br>
* Note: The branding path ending with a /
*
*   @returns Path to the base folder.
*   @type string
*
*/
function iGetBrandingFolder()	{ return "/intrasee/"; }

/**
* This is the branding folder for scripts.  Use this instead of iGetBrandingFolder.<br>
* Note: The branding path ending with a /
* @since v1.40
*
*   @returns Path to scripts.
*   @type string
*
*/
function iGetBrandingScriptsFolder() { return iGetBrandingFolder() + "scripts/"; }
/**
* This is the branding folder for images.<br>
* Note: The branding path ending with a /
*
*   @returns Path to images.
*   @type string
*
*/
function iGetBrandingImagesFolder()  {
	return "";
	/* RM-769: Now images will be online constants.  Previously was:  iGetBrandingFolder() + "images/"; */
}

/**
* This is the branding folder for styles.<br>
* Note: The branding path ending with a /
*
*   @returns Path to styles.
*   @type string
*
*/
function iGetBrandingStylesFolder()  { return iGetBrandingFolder() + "styles/"; }

/**
* This is the AJAX Loader image to be used in Lightboxes.
*
*   @returns AJAX Loader image
*   @type string
*
*/
function iGetLoaderImage()           {
	return IS_CORE_LOADER;
	/* RM-769: Now images will be online constants.  Previously was: "ajax-loader.gif"; */
}

/**
* This is the Close Link to be displayed if not overridden.
*
*   @returns Close Link's value to display.
*   @type string
*
*/
function iGetCloseLink()            { return "&nbsp;"; }
/* Close button is now handled via the stylesheet.  If on an older Tools release, or wanting to override, use the following instead.

function iGetCloseLink()            { return "<img border='0' alt='" + is_core_var.TITLE_CLOSE + "' src='" + iGetBrandingImagesFolder() + "close_button.gif' width='22' height='22'/>"; }
******************************/

/**
* Used for stripping out Target Content during AJAX calls.
*
*   @returns The target content id, used for stripping out content from wrappers.
*   @type string
*
*/
function iGetTargetContentId()       { return "IS_AC_RESPONSE"; }


/**
* This is the configurable parameters.  This will be used if it has not been set already.
*
*
* @since v1.54.5
*/
if (typeof is_core_var === "undefined") {
	// global variables,
	/**
	* This is the configurable parameters.  This will be used if it has not been set already.
	* @type {CoreConfig}
	*
	* @since v1.54.5
	*/
	is_core_var = {

			"ERROR_NO_XMLHTTP": "This browser does not support XMLHttpRequest or XMLHTTP.",
			"ERROR_BAD_DATA_RETRIEVED": "There was a problem retrieving the Data:\n",
			"ERROR_CONTENT_GENERAL": "Unable to show Content.",
			"ERROR_UNHANDLED_URL": "Unhandled URL",
			"WARNING_POPUP_DETECTED": "Your popup blocker prevented this site from working correctly. Please disable your popup blocker for this site and try again.",
			"TITLE_PAGELET_LOADING": "Pagelet Loading",
			"TITLE_CLOSE": "Close",
			"TITLE_PROCESSING_WAIT": "Processing... please wait",
			"IPSOFTCOMP_PROC_JSFUNC_ONLY": false,  /* true = legacy JS handler (scripts with no functions) */
			"LB_WRAPPER_DEFAULT": "IS_LB_SHADOW",  // Deprecated.  Use classes.lbWrapper below.
			"LB_WRAPPER_DEFAULT_ENABLED": true,  /* Enable the setting of the default wrapper styles when none is requested. */
			"LB_WRAPPER_IBORDER_DISABLED": true,  /* This will ignore the graphic wrapper. Used for transitions of legacy code. */
			"IS_TRENDS_ENABLED": false,
			"IS_TOGGLE_DEFAULT_DISPMODE": "",  /* iToggle will use this value if nothing passed in.  i.e. "", "static", "block".  Used by Grow effects. */
			"IS_TOGGLE_DURATION": 200,  /* Default value used by iGrow and otehr toggle routines. */
			"LB_GET_RELATED_PAGELETS": true,   // Deprecated.  Use lbShowRelated below.
			"IS_LB_PRESERVE_ENABLED": true, /* Default setting for preserving a lightbox (i.e. when going to related pagelet's content and then returning.)  */
			"ENABLE_FOCUS": true, /* Enable setting of focus in iPsoftComponent */
			"ENABLE_FOCUS_FIX": false, /* Will aply a focus fix to change focus between a couple of fields if set to true. Addresses an IE8 issue if encountered without teh fix.  default=false */
			"ENABLE_FIRST_FOCUS_FIX": true, /* Accessibility - Will find first input, textarea, select, or a and apply focus if current focus is outside of lightbox */
			"IPSOFTCOMP_FIX_GRIDLIST_WIN0": false, /* Fixes a PeopleTools 8.50 bug where some win0 objects are used instead of win10.  true will update these to win10. default=false */
			"IS_LB_RESET_SCROLLTOP": false, /* true = reset scrolltop position on open of lightbox.  Should typiclaly be false if IPSOFTCOMP_RESET_TOP_NEWPAGE=true.  default = false.  */
			"IPSOFTCOMP_RESET_TOP_NEWPAGE": true, /* Will reset the scrolltop if a new strCurrUrl is encountered.  Handles page navigation. */
			"IS_LB_STACKED_CLASS": "IS_LB_STACKED",  // Deprecated.  Use class.lbStacked below
			"IS_DATEPICKER_ENABLED": true,			// This will enable a custom datepicker if the iDate datePicker routines have been overwritten
			"IS_NATIVEDATE_ENABLED": false,			// This will enable "date" input types if it is available
			"IS_AJAX_SEND_CONTENT_LENGTH": false,	// default = false.  When true, will send content length during AJAX requests.  (For legacy support against HTTP 1.0 proxies, etc.)
			"ajaxPeopleSoftTimeout": true,			// default = true.  Will call the PeopleSoft timeout handlers if they exist.
			"ajaxDupPreventionThreshold": 2000, 	// default = 2000.  This is the duration in ms to check for existing active requests.  0 will be inactive
			"loaderExtraClass": "",					// default loader class is isLoader.  Additional classes can be added here to default to a different style spinner (i.e. isLoader2).
			"ConsoleMode": 2,						// 0=debug, 1=warning, 2=error
			"templateStorage": 1,					// Default local storage when using IS.Template. 0=none, 1=sessionStorage, 2=localStorage

			/* Below here are some additional configurations for Lightbox, Components, DX */
			/* -------------------------------------------------------------------------- */
			"lbContainerTop": 50,
			"lbContainerWidth": "",		// "" will default to class widths.  A Number will allow an override.
			"lbContainerZindex": "",		// "" will default to class widths.  A Number will allow an override.
			"lbFadeMode": false,			// Override of Fade mode for iLightbox and Component's lightbox. Remove for Legacy iLightbox = false, iComponent=true first first display)
			"loaderImage": iGetBrandingImagesFolder() + iGetLoaderImage(),
			"lbAccessibilityFocus": true,	// If true, focus will stay in the lightbox.  If false, it can go to underlying page
			"lbAccessibilityEscape": true,	// If true, an escape key will close the lightbox for accessibility purposes.  If false, it will not.
			"lbAutoSize": false,				// If true, this will perform auto width in Lightbox, needs CSS.  false, is legacy behavior
			"lbAutoSizeStartWidth": 743,	// The starting width for an AutoSize, for initial open when no content yet.
			"lbAutoSizeMinWidth": 944,		// The minimum width for an AutoSize.  Leaving as "" will not apply.
			"lbAutoSizeMaxWidth": 1300,		// The maximum width for an AutoSize.  Leaving as "" will not apply.
			"classes": {
				"lbContainer": "IS_LB",
				"lbHeader": "IS_LB_HEADER",
				"lbWorking": "IS_LB_WORKING",
				"lbContent": "IS_LB_CONTENT",
				"lbBackground": "IS_LB_BG",
				"lbFrame": "IS_LB_FRAME",
				"lbContentFrameClass": "IS_LB_IFRAME_CONTENT",
				"lbCloseLink": "IS_LB_CLOSE_LINK",
				"lbWrapper": "IS_LB_SHADOW",	//  IS_LB_TRANSWRAP, IS_LB_SHADOW  - This will be the default class applied to the wrapper.  Class is in Psoft substyle classes with the other Lightbox classes. This is used when no wrapper class is passed in the Initialization, and default LB wrapper is enabled.
				"lbWrapperInner": "IS_LB_WRAPPER_INNER",
				"lbContentWrapperOverflow": "IS_LB_OVERFLOW_HIDE_XY",
				"lbContentMainOverflow": "",
				"lbStacked": "IS_LB_STACKED",	// This is the class name added to teh container when lightboxs are stacked (opened while preserving a previous lightbox)
				"lbStackedCurrent" : ""

			},
			//"trackerFunction": null,	// This can be a function for tracking URLs, etc.  [Not in use]

			"dynamicLayout": false,		// true=This sets the dynamic pagelets mode to also include dynamic layouts.  fale=just dynamic pagelets.  Default=false.  ** Be sure to use appropriate CSS.
			//"relatedURL": "",			// This will be defined later after config manager loads, and usually assigned to IS_CO_URL_RELATED_PAGELETS
			"lbShowRelated": false,		// true = will load related pagelets in lightboxes.  false = Will just display requested content.
			"lbRelatedMode": 3,			// Mode for how often the related pagelets are refreshed during component displays.  0 = never, 1 = first time, 2 = every time, 3 (default) = every time + original params except for PAGE.
			"relatedWidths": {			// This is for dynamic related pagelets prior to the dynamic templates driven by layout templates
				"relatedPadding": 10,
				"lbContent1": 900,
				"lbContent2": 0,
				"lbContent3": 200,
				"lbContent4": 900
			},
			"useEmbeddedUrlForRelated": true,	// Use PeopleSoft URL for Related content.  Useful if tracking pages or transfers.

			// Additional iPsoftComponent default properties
			"componentURL": "",					// If Initializing iPsoftComponent with a config object, this property will need to be set
			"embeddedDiv": "",					// This is usually defined per iPSoftComponent to target specific div elements
			"componentVisible": true,			// Flag to determine if component is visible in the DOM
			"pageCustomJS": "",					// string of JS to run after Step JS has run
			"closeJS": "",						// string of JS to run on close
			"embeddedDivLegacy": false,			// set this to true to enable legacy behavior of clearing out lightbox content
			"appendLBFlag": false,				// will append an isLB=Y paramater to iPsoft Calls, which could be used by PeopleCode
			"forceFormID_win10": true,			// Newer Tools now includes unique ID.  Force back to win10 which iPsoftComponent has been using.

			// Additional iComponent default properties
			"iframeId": "lbFrameContent",
			"iframeName": "lbFrameContent",
			"lbFrameWidth": 900,
			"lbFrameHeight": "",				// Leave as "" for dynamic height.  Otherwise add height, and update scroll settings.
			"lbFrameScrolling": "no",			// values used for iframe scrolling attribute
			"lbFrameSeamless": true, 			// true will make seamless and frameborder=0, otherwise frameborder=1
			// iComponent, plus otehr iframe based solutions:
			"lbFrameResizeAuto": true,			// If true, then it will determine width/height.  Typically for embedded.  Can set to false for lightbox.
			"lbFrameResizeHeight": false,		// default was false, as previously was up to caller to set up.  true will do an auto resize of height.
			"lbFrameResizeInterval": 300,		// interval to check for a resize
			"lbFrameResizeMode": 0,				// Auto resize mode.  default = 0 = interval, 1 = several timers and onclick, 2 = set size with scrolls

			// Additional Decision Engine default properties
			"dxHideLightbox": false,			// Hide a DX Lightbox.  i.e. If automatically processing for TX.
			"txHideProgress": false,			// Hide the progress bar
			"txIframeMode": false,				// Deafult is false to use iPsoftComponent Proxy.  Otherwise will use iComponent iframe

			// Additional Responsive defaults
			"responsiveWidthThreshold": 992,	// This is the threshold for the page width before applying additional assistance for Responsive
			"responsiveEnabled": false,			// Default option for enabling responsive

			"forceConfigProperties": false,		// When true will force iLightbox config for certain properties
            "noConfict": true     // When true $() will not be created

	};
}

is_core_var_page = { };		// Declare this on custom pages or before specific calls, if you need to have common configuration overrides.  I]Just include properties you want to override.  These can potentially be overwritten by Initialize() calls to iLightbox/iPosftComponent that include a config object.

// create a property with the is_core_config script location
var IS = IS || {};
(function() {
	var scripts = document.getElementsByTagName("script");
	IS.CORE_CONFIG_URL = scripts[scripts.length-1].src;
 })();
