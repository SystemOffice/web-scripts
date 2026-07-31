// ================================================================================= 
// ODA SDK and Ida ChatUI Settings
// ================================================================================= 
var ida = ida || {};

var demoSettings = {};
IS.Console.config.mode=0; // force debug

// This is the default chatbot settings.
ida.defaultSettings = {
	// Ida custom settings -------------------------------------------------------------------
	ida: {
		is_sdk: "23.04.01",
		is_sdk_loaded: "23.04.01",
		openChatOnLoad: false,
		isEnableMultiLang: false,
		expandedWidth: "900px",
		switchUserDelay: 4000,
		switchUserMessage: "Switching to authenticated experience",
		switchUserGreeting: "You now have access to additional information.",
		chatbotOutage: false,
		chatbotOutageMessage: "My engineers have taken me offline temporarily while I get a tune up. Don't worry, I should be back online and ready to help very soon.",
		ORACLEUSERRESOLVE: "https://iep91dev5c.intrasee.com/psc/ps/EMPLOYEE/EMPL_IEP915C/s/WEBLIB_IS_CV.ISCRIPT1.FieldFormula.IScript_GetTokenP", // No JSONP attempt, if blank. Needed fo no popups of GetTokenSignin call. (WEBLIB_IS_CV.ISCRIPT1.FieldFormula.IScript_GetTokenP)
		ORACLEUSERSIGNIN: "https://iep91dev5c.intrasee.com/psc/ps/EMPLOYEE/EMPL_IEP915C/s/WEBLIB_IS_CV.ISCRIPT1.FieldFormula.IScript_GetTokenSignin",
		logoutSrc: "https://ics92iep91dev5cdev3.intrasee.com/psc/ps/EMPLOYEE/EMPL_IEP915C/?cmd=logout",
		nonAuthMode: false,
		nonAuthUser: "PLACEHOLDER",
		enableLocalConversationHistoryNonAuth: true,
		//launcherOnclick: function(el) {ida.UserAuthenticate();},
		launcherOnclick: function(el) {IS.PubCV.SetChatIconOnclick(el);},
		launcherHook: function() {IS_PV_BuildCustomGuest();},
		settingsHook: null, // Add a function if we need to merge in custom settings (i.e. demo, user pref, etc)
		postInitHook: function() {IS.PubCV.DisplayWelcome();ida.chatSettings.ida.postInitHook=null}, // Display Welcome slide-out first time
		destroyHook: null, // Add a function if we need a custom destroy session routine
		greetingMessage: "<div>Greetings from Ida...</div>",
		greetingUtterance: null, // "hello",  // Use a skill to send a greeting when first logging in
		chatTitle: "Chat with Ida",
		ttsService: "platform", // platform (default) or oracle
		webformPopupDisabled: false,  // set to true only if want to prevent popup to get webform content via postMessage
		webformPopupLabel: "Preparing form",
		popupBlockerMessage: "You may have a popup blocker, please ",
		popupBlockerLink: "click here to launch form",
				enableResizableWidget: true,
    enableVoiceOnlyMode: false,
    initBotAudioMuted: true,
    alwaysShowSendButton: true,


		isOracleCloud: false,
		opridResolver: function() { return "DEFAULT_RESOLVER";},  // replace with custom OPRID Resolver

	},

	// Proper Oracle Settings --------------------------------------------------------------

	/* Oracle socket server settings (URI and channelId) should be configured
	   in appropriate IS_CV_ENV_CONFIG.js file.

	   If not using PubCV, then it can be configured here
	*/
	//URI: 'oda-xxx-da2.data.digitalassistant.oci.oraclecloud.com',
	//channelId: 'xxx',
	//userId: 'i.e. psToken'

	// default this.  Will be overridden during "Public Chat" call
	initUserProfile: {
        "profile": {
            "properties":{
                "isChatUI":"true",
                "launchURL":document.location.origin + document.location.pathname,
                "userLanguage":"en",  
                "chatInitiator":"",
                "autoUtterance":false
             }
        }
    },

	enableAttachment: false,
	enableTimestamp: true,
	enableSpeech: true,
	enableBotAudioResponse: true,
	skillVoices: [{
		lang: 'en-US',
		name: 'Amity'  // oracle TTS
	}, {
		lang: 'en-US',
		name: 'Google US English'
	}, {
		lang: 'en-US',
		name: 'Flow'
	}, {
		lang: 'en-US',
		name: 'Microsoft Zira - English (United States)'
	}, {
		lang: 'en-US',
		name: 'Junior'
	}, {
		lang: 'en-US',
		name: 'Guy'
	}, {
		lang: 'en-US',
		name: 'Jenny'
	}, {
		lang: 'en-US',
		name: 'Aria'
	}, {
		lang: 'en-US',
		name: 'Samantha'
	}, {
		lang: 'en-US',
		name: 'Zira'
	}, {
		lang: 'en-US',
		name: 'David'
	}, {
		lang: 'en-US',
		name: 'Mark'
	}, {
		lang: 'en-US'
	}],
	/*enableAutocomplete: false, JDL */
	enableAutocomplete: true,
	displayActionsAsPills: false,
	theme: "vccs-light-wide", //"ida-light", "ida-dark", "ida-orange", "redwood-dark", "default", "classic"
	width: "600px",
	height: "1000px",  /* $$$ Do we want to disable height for VCCS? */
	
	//enableDefaultClientResponse: true,
	//enableEndConversation: false,  // $$$ Currently has Oracle defect.  Can use this, and add custom close button, similar to Artie
	isDebugMode: false,
	customHeaderElementId: "",  // can move an element into the Chat Header

	showConnectionStatus: false,  // if true and no subtitle configured

	//linkHandler: { target: 'oda-chat-webview'},   // sets all links.  We are using custom iframe, instead, to leverage old solution.

	//testing keeping conversation across tabs/refreshes/etc ==============
	enableTabsSync: false,
	/* enableLocalConversationHistory: false, JDL */
	enableLocalConversationHistory: false,

	// samples of color overrides.  Disabling and using them css approach.  Otherwise, rename this to colors.
	colorsDisabled: {
		branding: "#FF0000",    // Widget icon
		text: "#008000",        // greeting, message outside bubbles
		headerBackground: "#FFFFFF",
		headerButtonFill: "#000000",
		headerText: "#31435D",
		conversationBackground: "#F9FAFB",
		botMessageBackground: "#edf1f6",
		botText: "#000000",
		userMessageBackground: "#5196FC",
		userText: "#FFFFFF",
		actionsBackground: "#FFFFFF",
		actionsBorder: "#e7edf4",
		actionsBackgroundHover: "red",
		actionsTextHover: "#FFFFFF",
		globalActionsBackground: "#FFFFFF",
		globalActionsBorder: "#e7edf4",
		globalActionsBackgroundHover: "#e7edf4",
		footerButtonFill: "#76A9FC",
	},


	icons: {
		avatarBot: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iNDYuMDAwMDAwcHQiIGhlaWdodD0iNDYuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCA0Ni4wMDAwMDAgNDYuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+Cgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCw0Ni4wMDAwMDApIHNjYWxlKDAuMTAwMDAwLC0wLjEwMDAwMCkiCmZpbGw9IiMwMDAwMDAiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik0xNTcgNDQ0IGMtMjkgLTkgLTYzIC0zMCAtODcgLTU0IC0xNDIgLTE0MiAtNDIgLTM4NCAxNjAgLTM4NCAxMTEgMAoxOTYgNjkgMjIxIDE4MCAyNSAxMTEgLTQyIDIyNiAtMTUyIDI1OCAtNjMgMTkgLTgwIDE5IC0xNDIgMHogbTM3IC0xMjEgbDM0Ci0zOCAyNiAyNCBjMTQgMTQgMjYgMzAgMjYgMzggMCAxNCAxMiAxNyAyMyA2IDQgLTMgLTggLTE5IC0yNSAtMzQgbC0zMyAtMjgKNDYgLTEgYzQzIDAgNDYgLTIgNjIgLTM4IDE1IC0zNSAxNSAtNDAgMCAtNzUgbC0xNyAtMzcgLTExMyAwIGMtMTA0IDAgLTExMyAyCi0xMTMgMTkgMCAxMCAtNyAyNCAtMTUgMzEgLTE5IDE2IC0xOSAzNyAtMSA0NyA4IDQgMTUgMTcgMTcgMjggMyAxNSAxNCAyMSA0OQoyNSBsNDUgNSAtMjggMjEgYy0xNSAxMiAtMjcgMjcgLTI3IDMzIDAgMTggOCAxMyA0NCAtMjZ6Ii8+CjxwYXRoIGQ9Ik0xMjAgMjE1IGwwIC02NSAxMDUgMCAxMDUgMCAwIDY1IDAgNjUgLTEwNSAwIC0xMDUgMCAwIC02NXogbTc4IDE3CmMyIC03IC02IC0xMiAtMTcgLTEyIC0yMSAwIC0yNyAxMSAtMTQgMjQgOSA5IDI2IDIgMzEgLTEyeiBtOTIgMyBjMCAtOCAtNgotMTUgLTE0IC0xNSAtMTcgMCAtMjggMTQgLTE5IDI0IDEyIDEyIDMzIDYgMzMgLTl6IG0tNDcgLTUyIGMtNyAtMiAtMjEgLTIKLTMwIDAgLTEwIDMgLTQgNSAxMiA1IDE3IDAgMjQgLTIgMTggLTV6Ii8+CjwvZz4KPC9zdmc+Cg==",
		//avatarBot: "data:image/png;base64,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",
		avatarUser: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDIwMDEwOTA0Ly9FTiIKICJodHRwOi8vd3d3LnczLm9yZy9UUi8yMDAxL1JFQy1TVkctMjAwMTA5MDQvRFREL3N2ZzEwLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4wIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiB3aWR0aD0iNDYuMDAwMDAwcHQiIGhlaWdodD0iNDYuMDAwMDAwcHQiIHZpZXdCb3g9IjAgMCA0Ni4wMDAwMDAgNDYuMDAwMDAwIgogcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQgbWVldCI+Cgo8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLjAwMDAwMCw0Ni4wMDAwMDApIHNjYWxlKDAuMTAwMDAwLC0wLjEwMDAwMCkiCmZpbGw9IiMwMDAwMDAiIHN0cm9rZT0ibm9uZSI+CjxwYXRoIGQ9Ik0xNTkgNDQ3IGMtMTM2IC01MSAtMTk0IC0xOTUgLTEyOSAtMzIyIDQ1IC04NyAxNDQgLTEzNiAyNDAgLTEyMAoxNTEgMjUgMjM1IDIxMSAxNTUgMzQxIC01NiA5MCAtMTc1IDEzNSAtMjY2IDEwMXogbTEwOSAtMTA5IGMxNyAtMTcgMTUgLTEwMwotMyAtMTE4IC0yMyAtMTkgLTE4IC00MCA5IC00MCAyNCAwIDg2IC00NCA4NiAtNjEgMCAtNSAtNTggLTkgLTEzMCAtOSAtNzIgMAotMTMwIDQgLTEzMCA5IDAgMTcgNjIgNjEgODYgNjEgMjcgMCAzMiAyMSA5IDQwIC0xOCAxNSAtMjAgMTAxIC0zIDExOCA3IDcgMjQKMTIgMzggMTIgMTQgMCAzMSAtNSAzOCAtMTJ6Ii8+CjwvZz4KPC9zdmc+Cg==",
		//avatarUser: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAYAAABXuSs3AAAAAXNSR0IArs4c6QAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAALqADAAQAAAABAAAALgAAAABxWgY+AAAFP0lEQVRoBcVZa0wjVRQ+LS95SFYwUECioVTFaFgSI0R5lLimLDGwia7+wn8Y/vlPfPEUo+wvN9HE//wx+KwJgrCGx2KjgriJRnBxkceSNLyDCTSBgN8pne60O487nen2JLfn3nvO+e43p3funbljIwukt7e38uTk5HlAOVEeQikOaSi6jbIW0regr3V3d/8KbUpssUb39PRcPj09bUJ8A8qDBnH88B+22WzDXV1dXxiMDbobIo5M2RH1Msr7KI8GEcz/3MQFvNfZ2fkl9KkonDBxkObsfoDypCi4Qb9Z+L+Nca6JxOkSD2X5U4C1iQBa4PMJMN7AuCdaWJrE+/v77z88PPwaABe0QOJg+wGYr4D8vhq2KvG+vr6Hj4+PRxD4uFpwnPv/SkpKerGjo+NfpXEUiYcy/RsCXEpB97Dvd4zlVso8rxIRgiXOhunxFToTTZp5VaB8zpy4IZckeYPrWJI+gnotuj+Bbdfk5OR9ExMTEatNxJWEdsCfzZJMSUmh3NxcQqZoZ2eHjo6OzEKS3W6vxlr/kwSULFVYY9v+WN42Wne5XFRTU0PFxbzj35GVlRWampqipaWlO50Ga+DGe4hbCgtnHDfAJXR+IxmM6oqKCmpq4j1KXQYHB2l+fl7dQd9yETx5paPgzYkGa76imCQ5OZkaGhp0YxsbG3V9dByuhLieEYfz6yhP6ASpmktKSig1NVXVLhmysrKosLBQasain0JQcOGQlkN3LChSjMPhkKq6Oi8vT9dHx8HNdon4RR1nTXNmZqamXW7MyMiQN2Opv8BBdsyZKujsWBCkGJ7jomLEVwWzkDlzxnk1MSW8XouKyL0ggHWJiZ8XcNR0OTg40LTLjVZsRsA7z8TF7yw5A1l9b29P1tKu7u7uajuIWc9ZQnx1dVVsOHitrfF7s2lxMPFzZmG2traEtvOFhQWyKONB4gGzxDl+bGyMn3VUofBSQqOjo6p2g4YAZ9xvMEjR3e/30/j4uKKNO5m0RdlmOL9lxBlteno6mHmuy2VoaIhmZmbkXWbr1hJnNj6fLyKz29vbNDvLJw+Wip+3vBsor5qFzc/Pp5ycHMrOzqb09PQwHG/xlZWVtL+/T3wRGxsbYZuJyg0mPoLyYSwgTqeT+Dm8tLSU0tLSFCH4IuSPvIFAgBYXF2lubo6Wl5cVYwQ6vw2+SGDv58WVDyuFpKCggJqbm4mzbEbW19fJ6/XS5uamEZgV8H2Eb06WoTOl/YsXaaqvr6fW1lbTpHmkoqIiamtro6oqfs4TFp4h4cfaYEMvlLNcW1vLJwF6rsJ2vASTx+Ohuro60ZgI4t8h6g+tyLKyMiovL9dyMWVzu93Bf0AH5E/YmetZxjFneMvr5A414bf3eEt1dbXeEB0hrhTxn6PzOiIVo1taWghneXrApuz8eMwnASriA7/nJFv0q0sHDIr79sDAgBSTKP2ufOCIFOKYaxlz7QE4GLrN5YBxql9Ftj+TY0dMFTbwASO+7wyj6pE7JrA+hu9EnujPLNI6HubFDtjtLqPjZrgzcZVFcHkpmjTTuYs4d7a3t//Hh+qoGtrSONZC2QJWI3NRwlQkzo74EsBX60TVqxQY5z4vxi7BvP5HbZy75ni0Y2jO80NYe7QtTu0rmNNvKU0P+Xi6xCVnXP2zqF9FeVrqs1jz2febGMcngitMnME4+zj8b4LuR/MxkQEEfP6GzzsgzF/3hMUQcTlq6JM4nzlycchtAnV+zx3BdPj+nnwSVyOEbD0D2wUUvpn5uZ4/SbBmuY2yFtK38DT4Iz6J/MIGM/I/8HF8VammuIcAAAAASUVORK5CYII=",
		send: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAoCAYAAACFFRgXAAAAAXNSR0IArs4c6QAAAotJREFUWAnVmTFL3VAUxxP71BZxLAhSta11FSroJ3BwcHOw0MHdoUO/gYPQwntLqyDS0rXiFxBEHZxEKjroUqqCS6FSBxGhr7z+zsNbkpiYk+QmeR74e29Ozrn3d26MN4lOo9HYRpPIde6DAWrskM4M6mhpbkPrac/ov0XdLQnuAQ12L3DMo56WAg9Shhxf41tCQy0BHgIY5frLiVU0Vip4FF2Mf4vzE6WAx4DFnT4g4DWqFAYfR6Q8f0rcG9SVO7gSSBt2TuAcepwbuJYkYdwV8YvouXXwhCBJw+skfEUj1sCTEmSIXyd3PDN4BoC0qXskvkIP0sC7MmuaRAs5x4xRQ59d173SjifAkiTb7gv0FLWjIu0Xk30UAX4eN7HvGfjmMvWTJPBeDXIsxeS5Qcgqf0I1wE9oQ80HHBpx46QYgR1AphApwvSlSFvF1BlrBb0HfJ/WZ2pgX1bggGLacckV8BZhiunDn+oGI28NCfgGbdOsAJvBwlqKkTcYKcYUYNphfNodcZfYd4Cv2rqMjHfbgH2EV1Y9bOW1sH/IP0RHyMm8wkA9ZBzZgmXlgmC9Gea4JHcZyU14Rts0FTBQnUQ/Q+ZyeuGe4FeN05wx/sdPQj6gRUB/B8P/T3TH75rACVRbMNny8XfGq6IvgF5Hjg3oGvqB5EGlDNth0imkWpAyt+Zbf7IiV9VzouLpF9G9c1PQABQFbLbdKr+fpxqwqJi8gRM92ERB+vw53WVyE88i2TjsmmXgb4w3jdI+O8QXZwnYzutPPK7jZAA2L5gvNfNYi0kBLK/wC0i26uItAXD+H0k05SuAi/sMlRG4+A99KYE3WfVyPqUmADYfq0c1OaXGsJry7wB55r0X9g+ImosVBBE/SAAAAABJRU5ErkJggg==",
		launch: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDYuNDU0IiBoZWlnaHQ9IjEzMS43MzgiIHZpZXdCb3g9IjAgMCAxNDYuNDU0IDEzMS43MzgiPgogIDxnIGlkPSJHcm91cF8zNiIgZGF0YS1uYW1lPSJHcm91cCAzNiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU4NS41MzQgLTg1Mi42MjUpIj4KICAgIDxwYXRoIGlkPSJQYXRoXzciIGRhdGEtbmFtZT0iUGF0aCA3IiBkPSJNNzI3LjI1Nyw4NTIuNjI1SDU5MC4yNjZhNC43MzIsNC43MzIsMCwwLDAtNC43MzIsNC43MzJ2OTguNTE5YTQuNzMyLDQuNzMyLDAsMCwwLDQuNzMyLDQuNzMyaDI0LjM2MnYyMC4wMTVjMCwyLjk3MSwyLjk5MSw0Ljc1Myw1LjI0MiwzLjEyM2wzMS4zLTIyLjY2NWEzLjcsMy43LDAsMCwwLC41MjktLjQ3M2g3NS41NTZhNC43MzEsNC43MzEsMCwwLDAsNC43MzEtNC43MzJWODU3LjM1N0E0LjczMiw0LjczMiwwLDAsMCw3MjcuMjU3LDg1Mi42MjVabS02OS42MTYsNzAuOWE1LjYxLDUuNjEsMCwwLDEtNS42MSw1LjYxMWgtMjkuMWE1LjYxLDUuNjEsMCwwLDEtNS42MS01LjYxMVY5MjAuNGE1LjYxLDUuNjEsMCwwLDEsNS42MS01LjYxMWgyOS4xYTUuNjEsNS42MSwwLDAsMSw1LjYxLDUuNjExWm0zMC40NjgtMjUuOTg3YTUuNjEsNS42MSwwLDAsMS01LjYxLDUuNjExSDYyMi45MjZhNS42MSw1LjYxLDAsMCwxLTUuNjEtNS42MTF2LTMuMTE3YTUuNjEsNS42MSwwLDAsMSw1LjYxLTUuNjFINjgyLjVhNS42MSw1LjYxLDAsMCwxLDUuNjEsNS42MVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMCkiIGZpbGw9IiNmZmYiLz4KICA8L2c+Cjwvc3ZnPgo=",
		logo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDYuNDU0IiBoZWlnaHQ9IjEzMS43MzgiIHZpZXdCb3g9IjAgMCAxNDYuNDU0IDEzMS43MzgiPgogIDxnIGlkPSJHcm91cF8zNiIgZGF0YS1uYW1lPSJHcm91cCAzNiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU4NS41MzQgLTg1Mi42MjUpIj4KICAgIDxwYXRoIGlkPSJQYXRoXzciIGRhdGEtbmFtZT0iUGF0aCA3IiBkPSJNNzI3LjI1Nyw4NTIuNjI1SDU5MC4yNjZhNC43MzIsNC43MzIsMCwwLDAtNC43MzIsNC43MzJ2OTguNTE5YTQuNzMyLDQuNzMyLDAsMCwwLDQuNzMyLDQuNzMyaDI0LjM2MnYyMC4wMTVjMCwyLjk3MSwyLjk5MSw0Ljc1Myw1LjI0MiwzLjEyM2wzMS4zLTIyLjY2NWEzLjcsMy43LDAsMCwwLC41MjktLjQ3M2g3NS41NTZhNC43MzEsNC43MzEsMCwwLDAsNC43MzEtNC43MzJWODU3LjM1N0E0LjczMiw0LjczMiwwLDAsMCw3MjcuMjU3LDg1Mi42MjVabS02OS42MTYsNzAuOWE1LjYxLDUuNjEsMCwwLDEtNS42MSw1LjYxMWgtMjkuMWE1LjYxLDUuNjEsMCwwLDEtNS42MS01LjYxMVY5MjAuNGE1LjYxLDUuNjEsMCwwLDEsNS42MS01LjYxMWgyOS4xYTUuNjEsNS42MSwwLDAsMSw1LjYxLDUuNjExWm0zMC40NjgtMjUuOTg3YTUuNjEsNS42MSwwLDAsMS01LjYxLDUuNjExSDYyMi45MjZhNS42MSw1LjYxLDAsMCwxLTUuNjEtNS42MTF2LTMuMTE3YTUuNjEsNS42MSwwLDAsMSw1LjYxLTUuNjFINjgyLjVhNS42MSw1LjYxLDAsMCwxLDUuNjEsNS42MVoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMCkiIGZpbGw9IiNmZmYiLz4KICA8L2c+Cjwvc3ZnPgo=",
	},

	enableDefaultClientResponse: true,
	defaultGreetingTimeout: 10,
	defaultWaitMessageInterval: 10,
	locale: "en",
	i18n: {
		"en": {
			chatTitle: "Chat with Ida",
			defaultGreetingMessage: "I just got to work and am getting warmed up. Allow me a moment to respond...",
			defaultWaitMessage: "I'm still working on your request. Thank you for your patience!",
			//defaultSorryMessage: "Sorry for the delay.  Please try again in a few minutes.",
			defaultSorryMessage: "I'm sorry, things are very busy around here and I am having trouble getting your answer. If you come back later and try again, I hope to be of better service to you.",
			//chatSubtitle: "Leveraging the official SDK",
			close: "Minimize conversation",
		},
		"es": {
			chatTitle: "Chatea con Ida",
			defaultGreetingMessage: "Acabo de llegar al trabajo y me estoy calentando. Permítanme un momento para responder...",
			defaultWaitMessage: "Todavía estoy trabajando en su solicitud. ¡Gracias por su paciencia!",
			defaultSorryMessage: "Lo siento, las cosas están muy ocupadas por aquí y tengo problemas para obtener su respuesta. Si regresa más tarde y vuelve a intentarlo, espero poder servirle mejor.",
			close: "Minimizar la conversación",
		},

	},

	multiLangChat: {
		/* Disable non-primary languages
		supportedLangs: [{
			lang: 'en',
			label: 'English'
		}, {
			lang: 'es',
			label: 'Español'
		}, {
			lang: 'fr',
			label: 'Français'
		}, {
			lang: 'hi',
			label: 'हिंदी'
		}],  */

		primary: 'en'
	}

	// FYI - This opens without a websocket connection - Bug.
	//openChatOnLoad: true,


};

IS_PV_BuildCustomGuest = function() {console.log("Build out login options")};
