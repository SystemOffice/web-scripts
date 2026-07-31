// ---------------------------------------------------------------------------------------
// IS_CV_OB_WIDGET_SDK - v26.01
// Ida Widget implementation leveraging Oracle Digital Assistant Native Client SDK for Web
//
// Copyright 2008,2024 Gideon Taylor (IntraSee Division) - Use and modification subject to terms of license.
// Reuse or Redistribution of this source code with or without modification is strictly prohibited.
//
// Change log
// 05/05/2022	v22.03 - Initial implementation leveraging Oracle Digital Assistant Native Client SDK for Web
// 04/14/2026	v26.01 - Updated for new Ida Tools/Chat Downloads/ Accessibility/ Bug Fixes
// ---------------------------------------------------------------------------------------

/**
* @fileoverview
* IS_CV_OB_WIDGET_SDK.js v24.03 - Ida Widget implementation leveraging Oracle's ODA Web Client SDK
*
* @license Gideon Taylor Ida
*
* Copyright 2008,2024 Gideon Taylor (IntraSee Division) - Use and modification subject to terms of license.
* Reuse or Redistribution of this source code with or without modification is strictly prohibited.
*/
var ida = ida || {};
ida.version = "26.01";
ida.chatSettings = null;

// Add this namespace in case we are not in PIA
IS.Namespace("IS.CV.DB");

ida.InitSDK = function(name) {
	// If WebSDK is not available, reattempt later
	if (!document || !WebSDK) {
		setTimeout(function() {
			ida.InitSDK(name);
		}, 2000);
		return;
	}

	// Default name is ida.Bots
	/* If we need multiple Bot objects on same page, we will need to do better Namespace handling.
	if (!name) {
		name = 'ida.Bots';
	}
	*/

	setTimeout(function() {
		// Start with default settings
		if (!ida.chatSettings) {
			ida.chatSettings = IS.MergeJSON({}, ida.defaultSettings);
		}

		// Call hook to merge in custom/user pref settings, etc.
		if (ida.chatSettings.ida.settingsHook) {
			ida.chatSettings.ida.settingsHook();
		}

		if (!ida.chatSettings.userId) {
			// Restore active session, if we have one

			var idaActiveUser = localStorage.getItem("idaActiveUser");
			if (typeof(IS_CV_USER) !== 'undefined') {
				if (IS_CV_USER !== idaActiveUser) {
					/* Clean old chat history/ida local storage */
					localStorage.removeItem("idaActiveUser");
					localStorage.removeItem("idaActiveSession");
					localStorage.setItem("idaActiveUser", IS_CV_USER)
					var keysToDelete = []
					for (var key in localStorage){
						if(key.startsWith("oda-chat-")) {
							keysToDelete.push(key);
						}
					} 

					for(var x = 0; x < keysToDelete.length; x++) {
							localStorage.removeItem(keysToDelete[x]);
					}
				}
			}

			var idaActiveSession = localStorage.getItem("idaActiveSession");
			ida.chatSettings.userId = idaActiveSession;
		}
	

		// ------------------------------------------------------------------------------------
		// Initiate SDK Bot with configuration
		if (ida.chatSettings.userId) {
			ida.chatSettings.userId = ida.chatSettings.userId.replace(/[+]/g, ' ');
		}

		// Handle additional branding needs for outages
		if (ida.chatSettings.ida.chatbotOutage) {
			IS.AddClass(document.body, "ida-outage");
		}

		ida.Bots = new WebSDK(ida.chatSettings);

		if (ida.chatSettings.enableSpeech  && WebSDK.TTS) {
			ida.Bots.setTTSService(WebSDK.TTS[ida.chatSettings.ida.ttsService]);
		}

		ida.Bots.on(WebSDK.EVENT.WIDGET_OPENED, function() {
			// Add our webform container
			// $$$ TODO - make sure we aren't recreating

			/* Tim S. - Remove any [[STOP_BOT]] that might be in conversation history DOM */
			const chatMessageTextDivs = document.querySelectorAll('.oda-chat-message-text');
			chatMessageTextDivs.forEach(function(div) {
				// Check if the inner text is "[[STOP_BOT]]"
				if (div.innerText.trim() === '[[STOP_BOT]]') {
					// Find the parent div with class "oda-chat-message" and remove it
					const parentDiv = div.closest('.oda-chat-message');
					if (parentDiv) {
						parentDiv.remove();
					}
				}
			});

			ida.CreateWebContainer();
			/* JDL 3/14/25 */ 
			try {				
				document.getElementsByClassName('oda-chat-button-send')[0].getElementsByTagName('IMG')[0].alt = "Send Message";
				/* JDL 10/12/25 - UCOP Accessibility */
			//	document.getElementsByClassName('oda-chat-logo')[0].alt = "Chat Icon";
				document.getElementsByClassName('oda-chat-logo')[0].alt = "";
				document.getElementById('oda-chat-suggestions-list').setAttribute('aria-hidden','true');
			} catch(elmntErr) {
				/* do nothing */
			}

			if (ida.chatSettings.ida.chatbotOutage) {
				IS.Console.Log("Digital Assistant outage.");
				ida.DisplayWebContainer('<div id="IS_CV_OUTAGE">' + ida.chatSettings.ida.chatbotOutageMessage + '</div>', "", false);

				var closeButton = document.getElementById("oda-chat-end-conversation");
				closeButton.removeAttribute("disabled");
				closeButton.addEventListener("click", function() {
					if (ida.Bots.destroy) {
						ida.Bots.destroy();
						ida.InitSDK('ida.Bots');
					}
				}, false);     

				closeButton = document.getElementById("IS_CV_WEB_CLOSE_BTN");
				closeButton.addEventListener("click", function() {
					if (ida.Bots.destroy) {
						ida.Bots.destroy();
						ida.InitSDK('ida.Bots');
					}

				}, false);     

				return;
			
			} else {
				if (!document.getElementById('oda-chat-download') && IS.PubCV.Config.DownloadChat) {
				/** Add download icon to header **/
				const headeractions = document.getElementsByClassName("oda-chat-header-actions")[0];
				/* const downloadsvg = document.createElement("SVG"); */
				const downloadsvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				
const SVGPath1 = document.createElementNS("http://www.w3.org/2000/svg","path");
			    SVGPath1.setAttributeNS(null,'d','M25.462,19.105v6.848H4.515v-6.848H0.489v8.861c0,1.111,0.9,2.012,2.016,2.012h24.967c1.115,0,2.016-0.9,2.016-2.012 v-8.861H25.462z');
				const SVGPath2 = document.createElementNS("http://www.w3.org/2000/svg","path");

				SVGPath2.setAttribute('d','M14.62,18.426l-5.764-6.965c0,0-0.877-0.828,0.074-0.828s3.248,0,3.248,0s0-0.557,0-1.416c0-2.449,0-6.906,0-8.723 c0,0-0.129-0.494,0.615-0.494c0.75,0,4.035,0,4.572,0c0.536,0,0.524,0.416,0.524,0.416c0,1.762,0,6.373,0,8.742 c0,0.768,0,1.266,0,1.266s1.842,0,2.998,0c1.154,0,0.285,0.867,0.285,0.867s-4.904,6.51-5.588,7.193 C15.092,18.979,14.62,18.426,14.62,18.426z');
				downloadsvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
				downloadsvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
				downloadsvg.setAttribute('height', '20px');
				downloadsvg.setAttribute('width', '20px');
				downloadsvg.setAttribute('viewBox', '0 0 30 30');
				downloadsvg.setAttribute('role', 'presentation');
				downloadsvg.setAttribute('focusable', 'true');
				downloadsvg.setAttribute('fill', 'var(--color-text)');
				

				const downloadbtn = document.createElement("button");
				downloadbtn.setAttribute('class', 'oda-chat-icon oda-chat-header-button oda-chat-flex');
				downloadbtn.setAttribute('dir', 'auto');
				downloadbtn.setAttribute('type', 'button');
				downloadbtn.setAttribute('title', 'Download Chat');
				downloadbtn.setAttribute('id', 'oda-chat-download');
				//downloadbtn.setAttribute('tabindex', '0');
				downloadbtn.setAttribute('onclick', 'IS.PubCV.getOdaChatMessagesAsString();');

				downloadsvg.appendChild(SVGPath1);
				downloadsvg.appendChild(SVGPath2);
				downloadbtn.appendChild(downloadsvg);
				/* headeractions.insertBefore(downloadbtn, document.getElementById('oda-chat-collapse')); */
				headeractions.prepend(downloadbtn); 
				}
				
				
			}

			// Handle showing login overlay again
			setTimeout(function() {
				var idaLogin = IS.$("idalogin");
				var closeBtn;
				if (idaLogin) {
					closeBtn = IS.$("oda-chat-end-conversation");
					if (closeBtn) {
						closeBtn.addEventListener("click", function() {
							IS.RemoveClass(idaLogin, "oda-chat-none");
						}, false);
					}
				}
			}, 2000);

			// Handle callback
			if (ida.chatSettings.ida.closeCallback) {
				var closeBtn = IS.$("oda-chat-end-conversation");
				if (closeBtn) {
					closeBtn.addEventListener("click", ida.chatSettings.ida.closeCallback, false);      
				}
			}

			// Connect to server
			ida.Bots.connect()
			.then(function() {
				IS.Console.Debug('Connection Successful (widget opened)');

				/* Note: Removed greetSwitchUser 10/20 */

				// Greeting Message, if there is no initial utterance and no conversation history
				if (!ida.chatSettings.ida.initialUtterance) {
					if (!ida.hasConnected && !document.querySelector(".oda-chat-message")) {
						if (ida.chatSettings.ida.greetingUtterance) {
							ida.Bots.sendMessage(ida.chatSettings.ida.greetingUtterance, { hidden: true });
						} else if (ida.chatSettings.ida.greetingMessage) {
							ida.AddChatbotMessage(ida.chatSettings.ida.greetingMessage);
						}
					}
				}

				// Initial Utterance requested
				if (ida.chatSettings.ida.initialUtterance) {
					ida.Bots.sendMessage(ida.chatSettings.ida.initialUtterance, { hidden: true });
					ida.chatSettings.ida.initialUtterance = null;
				}
				
				ida.hasConnected = true;
	
			})
			.catch(function(reason) {
				IS.Console.Error('Connection failed');
				IS.Console.Error(reason);
			});
			/* JDL 3/21/25 trap tabs for accessability */
			//ida.trapFocus(document.getElementsByClassName("oda-chat-widget")[0]);
		});
		

		ida.Bots.on(WebSDK.EVENT.WIDGET_CLOSED, function() {
			IS.Console.Debug("WIDGET_CLOSED event");
			
			// Disable the accessibility event
			ida.AccessibilityDisable();	
			/* JDL 10/12/25 - trap the tabs in the clear cache popup */
			//ida.trapFocus(document.getElementsByClassName("oda-chat-action-wrapper")[0]);

			/* JDL 10/24/25 fix issue with chat button not being clickable */
			/* JDL 1/20/26 - remove this so when the idalogin gets hidden the focus is still on the chat icon */
			/*
			if(document.getElementById('idalogin')) { 
				document.getElementById('idalogin').setAttribute('tabindex',0);
				document.querySelectorAll('.oda-chat-button')[0].tabIndex = -1;
				document.querySelectorAll('.oda-chat-button')[0].setAttribute('aria-hidden', 'true');
			} else {
				document.querySelectorAll('.oda-chat-button')[0].tabIndex = 0;
				document.querySelectorAll('.oda-chat-button')[0].removeAttribute('aria-hidden');
			}
		   */

			/* If there is a destoryHook (i.e. PeopleSoft session destroy), call it. */
			if (ida.chatSettings.ida.destroyHook) {
				ida.chatSettings.ida.destroyHook();
			}
					
		});

		ida.Bots.on(WebSDK.EVENT.CHAT_END, function() {
			IS.Console.Debug("CHAT_END: The conversation has ended.");
			ida.hasConnected = false;

			localStorage.removeItem("idaActiveSession");
		});

		ida.Bots.on(WebSDK.EVENT.CHAT_LANG, function(language) {
			IS.Console.Debug("CHAT_LANG: The conversation is now in " + language + ".");
		});

		ida.Bots.on(WebSDK.EVENT.CLICK_AUDIO_RESPONSE_TOGGLE, function() {
			IS.Console.Debug("CLICK_AUDIO_RESPONSE_TOGGLE event.");
		});

		ida.Bots.on(WebSDK.EVENT.CLICK_ERASE, function() {
			IS.Console.Debug("CLICK_ERASE event");
		});

		ida.Bots.on(WebSDK.EVENT.CLICK_VOICE_TOGGLE, function() {
			IS.Console.Debug("CLICK_VOICE_TOGGLE event");
		});

		ida.Bots.on(WebSDK.EVENT.DESTROY, function() {
			IS.Console.Debug("DESTROY event");

			if (false && ALT_SET) {
				ida.Bots.endChat();
				setTimeout(function() {
					IS.Console.Debug("Reinitializing Bots");
					ida.InitSDK('ida.Bots');
				}, 2000);
			}
		});

		ida.Bots.on(WebSDK.EVENT.MESSAGE, function() {
			IS.Console.Debug("MESSAGE event");
		});

		ida.Bots.on(WebSDK.EVENT.MESSAGE_RECEIVED, function() {
			IS.Console.Debug("MESSAGE_RECEIVED event");
		});

		ida.Bots.on(WebSDK.EVENT.MESSAGE_SENT, function() {
			IS.Console.Debug("MESSAGE_SENT event");
		});

		ida.Bots.on(WebSDK.EVENT.NETWORK, function(status) {
			switch (status) {
				case 0:
					status = 'Connecting';
					break;
				case 1:
					status = 'Open';
					break;
				case 2:
					status = 'Closing';
					break;
				case 3:
					status = 'Closed';

					if (IS.PubCV && !IS.PubCV.InPS()) {
						IS.Console.Debug("Destroying PS Session as not in PIA.");

						// Call the PeopleSoft logout script
						var scriptTag = document.createElement("script");
						scriptTag.src = IS.PubCV.Config.logoutSrc;
						scriptTag.async = false;
						head.appendChild(scriptTag);

					}

					// Create custom Launcher if we were previously using one
					if (!ida.launcherEnabled) {
						ida.CreateLoginLauncher();
					}
					
					break;
			}
			IS.Console.Debug("Network: " + status);            
			if (ida.chatSettings.ida.chatbotOutage) {
				return;
			}

		});

		ida.Bots.on(WebSDK.EVENT.READY, function() {
			IS.Console.Debug("READY event");
		});

		ida.Bots.on(WebSDK.EVENT.TYPING, function(isTyping) {
			if (isTyping){
				IS.Console.Debug("TYPING: User is typing");
			} else {
				IS.Console.Debug("TYPING: User stopped typing");
			}
		});

		ida.Bots.on(WebSDK.EVENT.UNREAD, function() {
			IS.Console.Debug("UNREAD event");
		});

		var delegate = {
			beforeDisplay: function(message) {
				var msgString = JSON.stringify(message);
				IS.Console.Debug("DISPLAYING RAW MESSAGE:" + msgString);

				/* Deprecated? - Open a URL in a Lightbox */
				if (msgString.indexOf("chatbox") > -1) {
					IS.Console.Debug(">>>>>>>>>>>>>>> chatbox message");
					ida.ShowWebViewEmbedded(message.messagePayload.actions[0].url);
					ida.Bots.showTypingIndicator();
					return null;

				} else if (msgString.indexOf("IS_CV_WEBFORM") > -1) {
					IS.Console.Debug(">>>>>>>>>>>>>>> webform message");
					/* These are cards... */
					ida.ShowWebViewEmbedded(message.messagePayload.cards[0].actions[0].url);
					ida.Bots.showTypingIndicator();
					return null;
				}
		
				IS.Console.Debug("before prepareResponseMessage()");
				if (message.messagePayload && message.messagePayload.text) {
					IS.Console.Debug("calling prepareResponseMessage()");
					message.messagePayload.text = ida.PrepareResponseMessage(message.messagePayload.text);
					IS.Console.Debug("after prepareResponseMessage()");

					if (!message.messagePayload.text) {	
						message = null;
					}
				}

				return message;
			},

			beforeSend: function(message) {
				//message.source = "USER";  // puts in left side of bubble as BOT
				//message.userId = undefined;
				//IS.Console.Debug(">>>>>>>>>>> updating message for profile info");

				try {
					message.messagePayload.text = message.messagePayload.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				} catch (e) {}

				return message;
			},

			/* JDL 10/8/24 added to test neverending dots */
			render: function(message) {
				if (message.messagePayload.text=='[[STOP_BOT]]') {
					document.getElementById(message.msgId).remove();
					return true;
				}
				return false;
			}
		};

		ida.Bots.setDelegate(delegate);

		// $$$ look into if we need to have multiple chatbots.  If so, we'd have to have all functions
		//window[name] = ida.Bots;

		// Create custom Launcher to deal with Auth since we can't do it on widget open
		if (!ida.UserAuthenticated()) { 
			ida.CreateLoginLauncher();
		}

		// $$$ Look at changging to querySelectorAll to handle custom Loader
		var chatIcon = document.querySelector(".oda-chat-button");
		if (chatIcon) {
			chatIcon.addEventListener("mouseover", function() {
				IS.AddClass(chatIcon, "is-hover");
			}, false);
			chatIcon.addEventListener("mouseout", function() {
				IS.RemoveClass(chatIcon, "is-hover");
			}, false);

		}
       /* JDL added for tabbing issue 3/20/25 */
	  /* JDL 1/7/26 document.getElementsByClassName("oda-chat-button")[0].tabIndex = "-1"; */
		// Call a psot initialize hook, if needed
		if (ida.chatSettings.ida.postInitHook) {
			ida.chatSettings.ida.postInitHook()
		}

	}, 0);

};




// Custom IntraSee Calls ===============================================
ida.AddChatbotMessage = function(msg) {
	var bubble = `<div dir="auto" class="oda-chat-message-block oda-chat-flex oda-chat-left"><div dir="auto" class="oda-chat-icon-wrapper"><img dir="auto" alt="" class="oda-chat-message-icon" src="${ida.chatSettings.icons.avatarBot}" draggable="false"></div><div dir="auto" class="oda-chat-messages-wrapper oda-chat-flex oda-chat-col"><div dir="auto" class="oda-chat-message-list oda-chat-flex oda-chat-col"><div dir="auto" class="oda-chat-message" lang="en"><span dir="auto" class="oda-chat-screen-reader-only">${IS.PubCV.Config.BotName} says</span><div dir="auto" class="oda-chat-message-wrapper"><div dir="auto" class="oda-chat-message-bubble"><div dir="auto">${msg}</div></div></div></div></div></div></div>`;

	var convContainer = document.querySelector(".oda-chat-conversation-container");
	var el = document.createElement("DIV");
	el.innerHTML=bubble;

	convContainer.appendChild(el);

};

ida.AddChatbotMessageNoWrap = function(msg) {
	// Custom IntraSee Calls ===============================================
	var convContainer = document.querySelector(".oda-chat-conversation-container");
	var el = document.createElement("DIV");
	el.innerHTML=msg;

	convContainer.appendChild(el);
};

// Prepare Response Message ===================================================
ida.PrepareResponseMessage = function(msg) {
	var dxInst;

	if (typeof msg !== "undefined"  && msg) {
		if (msg.type == "sessionClosed") {
			return msg;
		} 
		// ODA 21.10 : HTML - Add a space, otherwise Oracle is filtering out messages starting with <
		if (msg.indexOf("<") == 0) {
			msg = " " + msg;
			IS.Console.Debug("New messagePayload.text: " + msg);
		}

		/* check for [[INST:??]] */
		if (msg.indexOf("[[INST") >= 0) {
			dxInst = msg.replace("[[INST:", "").replace("]]", "");
			/* set a global */
			try {
				IS.CV.DB.DxInstance = dxInst;
			} catch (e) {
				IS.Console.Error("IS.CV.DB is undefined");
			}

			msg = null;
			ida.Bots.showTypingIndicator();

			return msg;
		}

		/* check for [[CONVO:??]] */
		if (msg.indexOf("[[CONVO") >= 0) {
			dxInst = msg.replace("[[CONVO:", "").replace("]]", "");
			/* set a global */
			try {
				IS.CV.DB.ConvoID = dxInst;
			} catch (e) {
				IS.Console.Error("IS.CV.DB is undefined");
			}

			msg = null;
			ida.Bots.showTypingIndicator();

			return msg;
		}

		/* Used for closing web forms */
		if (msg.indexOf("[[WEB:CLOSE]]") == 0) {
			ida.CloseWebContainer();
			return null;
			
		}

		/* check for [[CONVO_END]] */
		if (msg.indexOf("[[CONVO_END]]") == 0) {
			return null;
		}

		/* NOTE: Removed [[SWITCH_USER]] on 10/20/22. */

		if (msg.indexOf("[[CONVO") >= 0) {
			ida.Bots.showTypingIndicator();

			return null;
		}

		if (msg.indexOf("[-[CHECKPOINT:") >= 0) {
			var checkpointMessage = msg.replace("[-[CHECKPOINT:", "").replace("]-]", "");
			if (_toolCheckpointEl) {
				ida.updateToolCheckpoint(checkpointMessage);
			} else {
				ida.showToolCheckpoint(checkpointMessage);
			}
			msg = null;
			return msg;
		}

		if (msg == "[[KEEP_THINKING]]") {
			msg = null;
			ida.Bots.showTypingIndicator();
			return null;

		}

		if (msg.indexOf("[[SET_ALERT_INDICATOR]]") == 0) {
			localStorage.setItem("IDA_ALERTS", "true");
			return null;
		}

		if (msg.indexOf("[[CLEAR_ALERT_INDICATOR]]") == 0) {
			localStorage.setItem("IDA_ALERTS", "false");
			return null;
		}

		if (msg.indexOf("[[LANG") == 0) {
			let newLang = msg.substring(7, msg.indexOf("]]"));
			if (ida.chatSettings.ida.currentLang != newLang) {
				IS.Console.Debug(`New language ${newLang} detected`);
				if (IS.PubCV.Config.SetLanguageSrc) {
					// AJAX call to PSFT to set language
					IS.AjaxRequest({
						url: `${IS.PubCV.Config.SetLanguageSrc}?language=${newLang}`,
						dataType: "json",
						success: function(obj) {
							ida.chatSettings.ida.currentLang = newLang;
							IS.Console.Debug(`PeopleSoft Language set to ${obj.newLanguage}.`);
						}
					})
				} else {
					IS.Console.Error("SetLanguageSrc needs to be set in ENV file.");
				}

			} else {
				IS.Console.Debug(`Old language ${newLang}`);				
			}

			return null;
		}

		ida.hideToolCheckpoint();
		// Handle onclick URLS
		msg = ida.CleanOnclick(msg);

		// Run any scripts
		if (msg.indexOf("<script") >= 0) {
			setTimeout(function() {
				IS.LoadJavaScriptInline(msg);
			}, 200);
		}

	} else {
		IS.Console.Error("There is no response message to prepare.");
	}

	return msg;

};

ida.CleanOnclick = function(msg) {
	var findAt, startAt;
	var quot, nextquot, httpAt, httpsAt;

	String.prototype.replaceAt = function(index, replacement) {
		return this.substring(0, index) + replacement + this.substring(index + replacement.length);
	};

	findAt = msg.indexOf("onclick=", 0);
	while (findAt >= 0) {
		quot = msg.substr(findAt+8, 1);
		nextquot = msg.indexOf(quot, findAt+9);
		// Exit if we do not find a matching quote
		if (quot == -1 || nextquot == -1) {
			return msg;
		}
		startAt = findAt+9;
		httpAt = msg.toLowerCase().indexOf("http:", startAt);		
		while (httpAt >= startAt && httpAt < nextquot) {
			msg = msg.replaceAt(httpAt, "~");
			startAt = httpAt+4;
			httpAt = msg.toLowerCase().indexOf("http:", startAt);
		}

		startAt = findAt+9;
		httpsAt = msg.toLowerCase().indexOf("https:", startAt);
		while (httpsAt >= startAt && httpsAt < nextquot) {
			msg = msg.replaceAt(httpsAt, "~");
			startAt = httpsAt+4;
			httpsAt = msg.toLowerCase().indexOf("https:", startAt);
		}

		findAt = msg.indexOf("onclick=", nextquot+1);

	}


	return msg;
};

// ----------------------------------------------------------------------
// Auth / Signon 
// ----------------------------------------------------------------------

ida.CreateLoginLauncher = function() {
	if(!document.getElementById('idalogin')) { 
		
		var el = document.querySelector(".oda-chat-button");
		if (el) {
			var loginEl = el.cloneNode(true);
			loginEl.id="idalogin";
			ida.chatSettings.ida.launcherOnclick(loginEl); 
			/* JDL 10/12/25 UCOP Accessibility add */
			
			el.setAttribute("aria-hidden","true");
			el.setAttribute("tabIndex",-1); 
			/* JDL 2/4/26 
			loginEl.setAttribute("aria-hidden","true");
			loginEl.setAttribute("tabIndex",-1); */
		 /* loginEl.tabIndex = 0; */

			loginEl.style.zIndex = 99999;
			el.parentNode.appendChild(loginEl);
			el.classList.add('oda-chat-button-drag-handle');
			loginEl.classList.remove('oda-chat-button-drag-handle');

			if (ida.chatSettings.ida.launcherHook) {
				ida.chatSettings.ida.launcherHook();
			}
		} 
		/* Add draggable */
			IS.PubCV.setupDragging();
	}
};

// Determine if user is already authenticated
ida.UserAuthenticated = function() {
	if ((ida.chatSettings.enableLocalConversationHistory || ida.chatSettings.enableTabsSync) && 
		(ida.chatSettings.ida.enableLocalConversationHistoryNonAuth || (ida.chatSettings.userId && ida.chatSettings.userId[0] !== "$"))) { 
		if (ida.chatSettings.initUserProfile.profile.properties.idaSession) {
			return true;
		}
	} else {
		if (ida.chatSettings.userId) {
			return true;
		}	
	}

	return false;
};

ida.UserAuthenticate = function() {
	var idaActiveSession;

	IS.Console.Debug("Checking user authentication");

	// Restore active session if available and doing conversation history
	if ((ida.chatSettings.enableLocalConversationHistory || ida.chatSettings.enableTabsSync) && 
		(ida.chatSettings.ida.enableLocalConversationHistoryNonAuth || (ida.chatSettings.userId && ida.chatSettings.userId[0] !== "$"))) {

		idaActiveSession = localStorage.getItem("idaActiveSession");

		var idaActiveUser = localStorage.getItem("idaActiveUser");
		if (typeof(IS_CV_USER) !== 'undefined') {
			if (IS_CV_USER !== idaActiveUser) {
				/* Clean old chat history/ida local storage */
				localStorage.removeItem("idaActiveUser");
				localStorage.removeItem("idaActiveSession");
				localStorage.setItem("idaActiveUser", IS_CV_USER)
				var keysToDelete = []
					for (var key in localStorage){
						if(key.startsWith("oda-chat-")) {
							keysToDelete.push(key);
						}
					} 

					for(var x = 0; x < keysToDelete.length; x++) {
							localStorage.removeItem(keysToDelete[x]);
					}
			}
		}

		if (!ida.chatSettings.userId) {
			ida.chatSettings.userId = idaActiveSession;
		} else {
			// resave the session.  current user may have closed chat widget
			if (!idaActiveSession) {
				IS.Console.Debug(">>> Should not go down this path?");
				localStorage.setItem("idaActiveSession", ida.chatSettings.userId);
			}
		}
	}

	// If user already set up and not using a login launcher
	if (ida.UserAuthenticated()) {
		ida.UserConnect();
	} else {
		ida.PrepareAuth();
	}
};


ida.UserConnect = function(reset) {
	IS.Console.Debug("ida.UserConnect called");

	// Remove login Icon overlay
	var loginEl = IS.$("idalogin");
	
	if (loginEl) {
		ida.loginLauncherEnabled = true;
		loginEl.parentNode.removeChild(loginEl);
	}

	if (typeof reset !== undefined && reset) {
		ida.ResetChatbot();

		// Handle alternate session approach if conversation history or tab sync are enabled
		if ((ida.chatSettings.enableLocalConversationHistory || ida.chatSettings.enableTabsSync) && 
			(ida.chatSettings.ida.enableLocalConversationHistoryNonAuth || (ida.chatSettings.userId && ida.chatSettings.userId[0] !== "$"))) {
				// Save userid into profile
				ida.chatSettings.initUserProfile.profile.properties.idaSession = ida.chatSettings.userId;

				var idaActiveUser = localStorage.getItem("idaActiveUser");
				if (typeof(IS_CV_USER) !== 'undefined') {
					if (IS_CV_USER !== idaActiveUser) {
						/* Clean old chat history/ida local storage */
						localStorage.removeItem("idaActiveUser");
						localStorage.removeItem("idaActiveSession");
						localStorage.setItem("idaActiveUser", IS_CV_USER)
						var keysToDelete = []
						for (var key in localStorage){
							if(key.startsWith("oda-chat-")) {
								keysToDelete.push(key);
							}
						} 

						for(var x = 0; x < keysToDelete.length; x++) {
							localStorage.removeItem(keysToDelete[x]);
						}
					}
				}
				var idaActiveSession = localStorage.getItem("idaActiveSession");
				// add logic for sessionExpire?  i.e. how long to trust local storage
				// Can we also save OPRID?
				if (idaActiveSession) {
					ida.chatSettings.userId = idaActiveSession;
				} else {
					// Set new session
					ida.chatSettings.userId = (ida.chatSettings.userId && ida.chatSettings.userId[0] == "$" ? "$" : "") + ida.CreateUUID();
					localStorage.setItem("idaActiveSession", ida.chatSettings.userId);
				}
		}
		
		if (ida.loginLauncherEnabled && IS.PubCV && IS.PubCV.Config && IS.PubCV.Config.forceMultiLogin && 
			(!ida.chatSettings.userId || ida.chatSettings.userId[0] == "$")) {
			IS.AddClass(IS.$("isChatWelcomeBubble"), "hide");
			setTimeout(ida.CreateLoginLauncher, 2000);
		}		
		return;
	}

	ida.Bots.openChat();

};

ida.PrepareAuth = function() {
	var localToken;

	if (ida.chatSettings.ida.nonAuthMode) {
		// nonAuthUser config
		ida.chatSettings.userId = "$" + ida.chatSettings.ida.nonAuthUser + "-" + ida.CreateUUID();
		ida.UserConnect(true);

		return;
	}

	// Handle authentication
	var scriptTag = document.createElement("script");
	if (ida.chatSettings.ida.ORACLEUSERRESOLVE) {
		scriptTag.src = ida.chatSettings.ida.ORACLEUSERRESOLVE;  // JSONP sets CurrentToken if no security issues
		scriptTag.onload = scriptTag.onerror = function() {
			if (typeof CurrentToken == "undefined" || !CurrentToken) {  //
				ida.authTargetOrigin = ida.chatSettings.ida.ORACLEUSERSIGNIN.substring(0,ida.chatSettings.ida.ORACLEUSERSIGNIN.indexOf("/",8));
				window.addEventListener("message", ida.SigninFinish, false);
				window["OracleSigninWindow"] = window.open(ida.chatSettings.ida.ORACLEUSERSIGNIN, "_blank");
			} else {
				ida.chatSettings.userId = CurrentToken.replace(/[+]/g, ' '); // $$$ look into removing this
				ida.UserConnect(true);
			}
		};
		
	} else {
		if (typeof CurrentToken == "undefined" || !CurrentToken) {  //
			ida.authTargetOrigin = ida.chatSettings.ida.ORACLEUSERSIGNIN.substring(0,ida.chatSettings.ida.ORACLEUSERSIGNIN.indexOf("/",8));
			window.addEventListener("message", ida.SigninFinish, false);
			window["OracleSigninWindow"] = window.open(ida.chatSettings.ida.ORACLEUSERSIGNIN, "_blank");
		} else {
			ida.chatSettings.userId = CurrentToken.replace(/[+]/g, ' '); // $$$ look into removing this
			ida.UserConnect(true);
		}
	}

	document.getElementsByTagName("head")[0].appendChild(scriptTag);

};

ida.SigninFinish = function(event) {
	/* Make sure its coming from our auth page */
	if (event.origin !== window["ida"].authTargetOrigin) {
		return;
	}
	ida.remoteAuthorization = true;
	IS.Console.Debug(">>>>>> received message");	
	window.removeEventListener("message", ida.SigninFinish, false);
	window["OracleSigninWindow"].close();
	ida.chatSettings.userId = event.data.token;
	ida.UserConnect(true);

};

ida.ChatUIGetCookie = function(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
};

ida.CreateUUID = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0
		  , v = c == 'x' ? r : r & 0x3 | 0x8;
		return v.toString(16);
	});
};


ida.ResetChatbot = function() {
	IS.Console.Debug("resetting chatbot");

	if (ida.chatSettings.customHeaderElementId) {
		var customEl = document.getElementById(ida.chatSettings.customHeaderElementId);
		var container = (document.getElementById("ida-custom-hold")) ? document.getElementById("ida-custom-hold") : document.body;
		container.appendChild(customEl);
	}
	// Handle clear of conversation history and destroy as SDK endChat() does not destroy container and creates dupe DOM elements
	if (!ida.chatSettings.enableLocalConversationHistory) {
		ida.Bots.clearAllConversationsHistory();
	}
	ida.Bots.destroy();

	ida.chatSettings.openChatOnLoad = true;
	ida.InitSDK('ida.Bots');
};


ida.CreateOracleChat = function(channel, chatTitle) {
	var container = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document.body;
	var closeCallback = arguments[3];
	var initialUtterance = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
	var nonAuthMode = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
	var nonAuthUser = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;
	var renderInitialUtterance = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
	var userLang = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : null;
	var initiator = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : null;

	// Initialize chatSettings if needed
	if (!ida.chatSettings) {
		ida.chatSettings = IS.MergeJSON({}, ida.defaultSettings);
	}

	// Handle Oracle Cloud logic
	var principal = "";
	if (ida.chatSettings.ida.isOracleCloud) {
		// Call the opridResolver function to get the principal
		principal = ida.chatSettings.ida.opridResolver();
	}
	
	// provide Chat Setting overrides
	ida.chatSettings = IS.MergeJSON(ida.chatSettings, {
		channelId: (channel !== "undefined" && channel) ? channel : ida.chatSettings.channelId,

		// Custom Ida settings
		ida: {
			container: (container == null) ? document.body : container,
			nonAuthMode: nonAuthMode,
			nonAuthUser: nonAuthUser,
			closeCallback: closeCallback,
			ORACLEUSERRESOLVE: (typeof ORACLEUSERRESOLVE !== "undefined" && ORACLEUSERRESOLVE) ? ORACLEUSERRESOLVE : ida.chatSettings.ida.ORACLEUSERRESOLVE,
			ORACLEUSERSIGNIN: (typeof ORACLEUSERRESOLVE !== "undefined" && ORACLEUSERSIGNIN) ? ORACLEUSERSIGNIN : ida.chatSettings.ida.ORACLEUSERSIGNIN,
			logoutSrc: (typeof IS.PubCV !== "undefined" && typeof IS.PubCV.Config !== "undefined" && IS.PubCV.Config.logoutSrc) ? IS.PubCV.Config.logoutSrc : ida.chatSettings.ida.logoutSrc,
			initialUtterance: initialUtterance,  // can set ODA property initUserHiddenMessage.  For now we are setting on widget open.
			renderInitialUtterance: renderInitialUtterance,
		},
		URI: (typeof IS.PubCV !== "undefined" && typeof IS.PubCV.Config !== "undefined" && IS.PubCV.Config.URI) ? IS.PubCV.Config.URI : ida.chatSettings.URI,

		// Update user profile.  Can also use ida.Bots.updateUser() after instantiated
		initUserProfile: {
			"profile": {
				"properties": {
					"isChatUI":"true",
					"launchURL":document.location.origin + document.location.pathname,
					"userLanguage": userLang || "",
					"chatInitiator": initiator || "",
					"autoUtterance": initialUtterance !== null || false,
					"principal": principal,
					/* Optional dataAttributes support (configurable) */
					"dataAttributes": (typeof IS.PubCV !== "undefined" && IS.PubCV.Config && IS.PubCV.Config.dataAttributes) 
						? IS.PubCV.Config.dataAttributes 
						: undefined
				}
			}
		},

	});

	// Set default language
	if (userLang) {
		if (typeof ida.chatSettings.multiLangChat === "undefined") {
			ida.chatSettings.multiLangChat = {};
		}
		ida.chatSettings.multiLangChat.primary = userLang;
	}

	// If non-auth mode and coming in as a different user, clear active session
	if (ida.chatSettings.ida.nonAuthMode) {
		if (ida.chatSettings.ida.nonAuthUserLast && ida.chatSettings.ida.nonAuthUserLast !== ida.chatSettings.ida.nonAuthUser) {
			ida.chatSettings.userId = "";
			localStorage.removeItem("idaActiveSession");
		}
		ida.chatSettings.ida.nonAuthUserLast = ida.chatSettings.ida.nonAuthUser;
	}

	if (!ida.Bots) {
		ida.InitSDK("ida.Bots");
	}

	// Auth & Open the chat, if not an outage
	if (!ida.defaultSettings.ida.chatbotOutage) {
		ida.UserAuthenticate();
	} else {
		ida.Bots.openChat();
	}

	ChatUIOpen = true;

};

// -------------------------------------------------------------------
// ida ui routines
// -------------------------------------------------------------------
// $$$ compare with UI Kit

ida.IsOverflowing = function(el) {
	var curOverflow = el.style.overflow;

	if (!curOverflow || curOverflow === "visible") {
		el.style.overflow = "hidden";
	}

	var isOverflowing = (el.clientWidth < el.scrollWidth) || (el.clientHeight < el.scrollHeight);
	el.style.overflow = curOverflow;

	return isOverflowing;

};

// Enhanced routines ===============================================

ida.CreateWebContainer = function() {
	var convContainer = document.querySelector(".oda-chat-widget");
	var el = IS.CreateElement("DIV", {id:"IS_CV_WEB_CONTAINER", class:"chat-widget-web-IS_CV_WEB_CONTAINER", style:"display:none;"},""); 
	var elWrapper =IS.CreateElement("DIV", {id:"IS_CV_WEB_WRAPPER",}, "");
	var elHeader = document.querySelector(".oda-chat-webview-header").cloneNode(true);
	var el2 =  IS.CreateElement("DIV", {id:"IS_CV_WEB_FORM"}, "");
	el.appendChild(elHeader);
	el.appendChild(elWrapper);
	elWrapper.appendChild(el2);

	var webCloseButton = elHeader.querySelector("button");
	webCloseButton.id = "IS_CV_WEB_CLOSE_BTN";
	webCloseButton.onclick = function() {ida.CloseWebContainer();};
	convContainer.appendChild(el);

	// Add Chat close event
	document.getElementById("oda-chat-end-conversation").addEventListener("click", function() {
		if (el.style.display !== "none") {
			webCloseButton.click();       
		}
	}, false);     

	// Add web close event
	webCloseButton.addEventListener("click", function() {
		// Now only have transition when ida-anim set
		IS.AddClass(document.querySelector(".oda-chat-widget"), "ida-anim");
		ida.Bots.setWidth(ida.chatSettings.width);
		setTimeout(function() {IS.RemoveClass(document.querySelector(".oda-chat-widget"), "ida-anim");}, 500);
		/* JDL testing 10/22/25 */
		console.log('fire close button - ' + document.querySelectorAll('.oda-chat-popup-action')[0]);

	}, false);        

};

ida.DisplayEmbeddedAnswer = function(el) {
	var content;
	var hiddenDiv = el.parentElement.getElementsByClassName("is_cv_faq_full_answer")[0];

	if (hiddenDiv.children[0].nodeType !== 3) {
		content = hiddenDiv.innerHTML;
	} else {
		content = hiddenDiv.children[0].textContent;
	}
	content = content.replace("type/js", "type/javascript");
	ida.DisplayWebContainer(content, "More Info");  /* $$$ Move into a setting */
};

ida.DisplayWebContainer = function(content, title, hideClose, noPadding, noScroll, noExpand) {
	if ((typeof title === "undefined" || !title) && typeof hideClose !== "undefined" && hideClose) {
		IS.AddClass(IS.$("IS_CV_WEB_CONTAINER"), "ida-web-hide-header");
	} else {
		IS.RemoveClass(IS.$("IS_CV_WEB_CONTAINER"), "ida-web-hide-header");
	}

	if (typeof noPadding !== "undefined" && noPadding) {
		IS.AddClass(IS.$("IS_CV_WEB_FORM"), "ida-no-padding");
	} else {
		IS.RemoveClass(IS.$("IS_CV_WEB_FORM"), "ida-no-padding");
	}

	if (typeof noScroll !== "undefined" && noScroll) {
		IS.AddClass(IS.$("IS_CV_WEB_FORM"), "ida-no-scroll");
		IS.RemoveClass(IS.$('IS_CV_WEB_FORM'), 'ida-scroll');
	} else {
		IS.AddClass(IS.$("IS_CV_WEB_FORM"), "ida-scroll");
		IS.RemoveClass(IS.$('IS_CV_WEB_FORM'), 'ida-no-scroll');
	}

	

	IS.$("IS_CV_WEB_FORM").innerHTML = content;
	
	if (typeof hideClose !== "undefined" && hideClose) {
		document.getElementById("IS_CV_WEB_CLOSE_BTN").style.display = "none";

	} else {
		document.getElementById("IS_CV_WEB_CLOSE_BTN").style.display = "";

		// Add Escape key handler for accessibility there is a close button.
		ida.AccessibilityEnable();

	}

	// Process any javascript.  $$$ Decide if we do after opening container
	if ((/<script/i).test(content)) {
		IS.LoadJavaScriptInline(content);
	}

	ida.OpenWebContainer(title, noExpand);
};

ida.OpenWebContainer = function(title, noExpand) {
	var container = IS.$("IS_CV_WEB_CONTAINER");
	var wrapper = IS.$("IS_CV_WEB_WRAPPER");
	var content = IS.$("IS_CV_WEB_FORM");

	if (typeof title !== "undefined" && title) {
		container.querySelector(".oda-chat-webview-title").innerHTML = title;
	} else {
		container.querySelector(".oda-chat-webview-title").innerHTML = "";
	}

	if (typeof noExpand !== "undefined" && noExpand) {
		container.style.display="block";

	} else {
		container.style.display = "block";
		//content.style.height = wrapper.clientHeight;
		var isOverflowing = ida.IsOverflowing(content);
		container.style.display = "none";
		//content.style.height = "100%";

		if (isOverflowing) {
			// Too small, so use current window with scroll
			if (window.matchMedia('(max-width: 900px)').matches) {
				container.style.display="block";

			// Expand Chat Container
			} else {
				// Now only have transition when ida-anim set
				IS.AddClass(document.querySelector(".oda-chat-widget"), "ida-anim");
				ida.Bots.setWidth(ida.chatSettings.ida.expandedWidth);
				container.style.display="block";
				setTimeout(function() {IS.RemoveClass(document.querySelector(".oda-chat-widget"), "ida-anim");}, 500);
			}

		} else {
			container.style.display="block";

		}
	}

	IS.RemoveClass(document.getElementById("IS_CV_WEB_CONTAINER"), "oda-chat-webview-container-close");
	IS.AddClass(document.getElementById("IS_CV_WEB_CONTAINER"), "oda-chat-webview-container-open");
	IS.$("IS_CV_WEB_FORM").scrollTo(0,0);

};

ida.CloseWebContainer = function() { 
	// Disable the accessibility event
	ida.AccessibilityDisable();

	IS.AddClass(document.getElementById("IS_CV_WEB_CONTAINER"), "oda-chat-webview-container-close");
	IS.RemoveClass(document.getElementById("IS_CV_WEB_CONTAINER"), "oda-chat-webview-container-open");
	setTimeout(function() {
		if (IS.$("IS_CV_WEB_CONTAINER")) {
			IS.$("IS_CV_WEB_CONTAINER").style.display="none";
		}
		if (IS.$("IS_CV_WEB_FORM")) {
			IS.$("IS_CV_WEB_FORM").innerHTML = "";
		}
		// Now only have transition when ida-anim set
		IS.AddClass(document.querySelector(".oda-chat-widget"), "ida-anim");
		ida.Bots.setWidth(ida.chatSettings.width);
		setTimeout(function() {IS.RemoveClass(document.querySelector(".oda-chat-widget"), "ida-anim");}, 500);
	}, 400); 
	
	window.removeEventListener("message", ida.ResizeEventListener);

};

ida.DisplayWebformMessage = function(e) {
	/* Make sure its coming from our requested page and its type is a webform */
	if (e.origin !== window["ida"].webViewTargetOrigin || e.data.id !== "ida-webform-html") {
		return;
	}

	IS.Console.Debug(">>>>>> received webform message");	
	window.removeEventListener("message", ida.DisplayWebformMessage);
	setTimeout(function() {window["IdaWebformWindow"].close();}, 1500);

	var obj = JSON.parse(e.data.content);
	var html = atob(obj.html);
	//var el = document.createElement("html");
	//var html2 = el.querySelector("head").innerHTML + el.querySelector("body").innerHTML;

	// Open content in the webform
	if (false) { // HTML
		ida.DisplayWebContainer(html, "", true, false, false, true);
	
	} else { // iFrame
		var html2="<iframe id='idaWebView' width='100%' src='about:blank' class='IS_LB_IFRAME_CONTENT IS_LB_OVERFLOW_HIDE_XY' scrolling='no' frameborder='0' seamless='seamless' />";
		ida.DisplayWebContainer(html2, "", true, false, false, true);

		var el = document.createElement('html');
		el.innerHTML = html;

		setTimeout(function() {
			var mv = document.getElementById('idaWebView').contentDocument;
			mv.head.innerHTML = el.querySelector("head").innerHTML;
			mv.body.innerHTML = el.querySelector("body").innerHTML;

			if (false) {
				// script loader
				ida_scriptHandler = new iScriptHandler();
				ida_scriptHandler.Initialize();
				ida_scriptHandler.LoadScript(el.querySelector("head").innerHTML, mv);
				ida_scriptHandler.LoadScript(el.querySelector("body").innerHTML, mv);
				ida_scriptHandler.LoadScript("try { parent.IS.$('idaWebView').setAttribute('height', document.body.scrollHeight); } catch (e) {console.error(e);}", mv);
			
			} else {		
				// loadJavaScriptInline
				var toRun = el.querySelector("head").innerHTML + el.querySelector("body").innerHTML + "<script type='text/javascript'>try { parent.IS.$('idaWebView').setAttribute('height', document.body.scrollHeight); } catch (e) {console.error(e);}</script>";
				IS.LoadJavaScriptInline(toRun, mv);
			}
		}, 0);
	}
};

ida.ShowWebViewEmbedded = function(url) {
	if (!ida.chatSettings.webformPopupDisabled && ida.remoteAuthorization) {
		url += (url.includes("?")) ? "&" : "?";
		url += "ida-message=Y";
		url += "&ida-popup-label=" + encodeURIComponent(ida.chatSettings.ida.webformPopupLabel);

		// Get content from popup and postMessage event
		ida.webViewTargetOrigin = url.substring(0, url.indexOf("/",8));
		window.addEventListener("message", ida.DisplayWebformMessage, false);
		window["IdaWebformWindow"] = window.open(url, "_blank", "toolbar=no,location=no, status=no, menubar=no, scrollbars=no, resizable=no, width=400, height=250, left=" + (screen.availWidth - 400) / 2 + ", top=" + (screen.availHeight - 250) / 4);

		if (!window["IdaWebformWindow"] || window["IdaWebformWindow"].closed || typeof window["IdaWebformWindow"].closed=='undefined') {
			var html = `<div class='ida-popup-msg'>${ida.chatSettings.ida.popupBlockerMessage}<a onclick='ida.ShowWebViewEmbedded("${url}"); return false;'>${ida.chatSettings.ida.popupBlockerLink}</a></div>`;
			ida.DisplayWebContainer(html, "", true, false, false, true);
		}

		return;
	}

	var config = {
		url: url,
		iframe: true,
		isPeopleSoft: false,
		processJS: true,
		visible: true,
		iframeId: "idaWebView",
		lbFrameHeight: 500,
		lbContainerWidth: 414,
		lbFrameWidth: "100%",
		lbFrameResizeAuto: true,
		workingEnabled: false,
		cross_site: false,  // requires false to run embedded JS.  if it is cross-site need to manually do height postMessage in target.
		embeddedDiv: 'IS_CV_WEB_FORM',
		classes: {
			"lbContent": "IS_LB_CONTENT IS_CV_WEBFORM"
		},
		pageCustomJS: "try {window.parent.postMessage({id:'ida-webform-height', height:document.body.clientHeight}, '*'); } catch (e) {console.error(e);}"  // Just rely on the classes, no HTML4 support.
		//lbFrameScrolling: "yes"  // one solution, but webforms should have their own scroll?
	};

	IS.AddClass(IS.$('IS_CV_WEB_FORM'), 'ida-scroll');
	ida.webFormTargetOrigin = url.substring(0,url.indexOf("/",8));
	window.addEventListener("message", ida.ResizeEventListener, false);

	ida.DisplayWebContainer("", "", true, true, false);

	idaWebViewComp = new iComponent("idaWebViewComp");
	idaWebViewComp.Initialize(config);
	idaWebViewComp.Open();

	setTimeout(function() {
		idaWebViewComp.Display();
	}, 500);
};

ida.ResizeEventListener = function (e) {
	/* We can't do this if we are going to Portal and its redirecting to target system */
	/* if (e.origin !== window["ida"].webFormTargetOrigin) { */
	/* Make sure its coming from our iframe */
	if (e.source !== IS.$("idaWebView").contentWindow) {
		return;
	}
	IS.Console.Debug(">>>>>> received message");

	var data = e.data;
	if (data.id == "ida-webform-height") {
		IS.Console.Debug("setting height to " + data.height);
		IS.$("idaWebView").setAttribute("height", data.height);
	}
};


// Deprecated calls ==============================================

/* Deprecated, as we are using widget slidewide
ida.CloseWebViewEmbedded = function() {
	IS.$('IS_CV_WEB_CONTAINER').innerHTML = "";
	IS.$('IS_CV_WEB_CONTAINER').removeAttribute("style");
};
*/

// Wrappers ------------------------------------------------------
function CreateOracleChat(channel, chatTitle) {
	return ida.CreateOracleChat.apply(this, arguments);
}

ShowWebViewLightbox = function(url) {
	ida.ShowWebViewEmbedded(url);
};

/* Deprecated, as we are using widget slidewide
CloseWebViewLightbox = function() {
	ida.CloseWebViewEmbedded();
};
*/

// Other Deprecated ----------------------------------------------
if (!IS.CV) {IS.CV={};}
if (!IS.CV.FAQ) {IS.CV.FAQ={};}

IS.CV.FAQ.DisplayEmbeddedAnswer = function(el) {
	ida.DisplayEmbeddedAnswer(el);
};

// $$$- replaced by ida.CloseWebContainer
// ida_closeWebContainer = function() { IS.$("IS_CV_WEB_CONTAINER").style.display="none"; }

// Ida Voices ----------------------------------------------------
ida.OpenVoices = function() {
	ida.Bots.getTTSVoices().then(function(data) { ida.DisplayVoices(data);});
};

ida.DisplayVoices = function(voices) {
	let html = "";
	let i;
	let currentVoice = ida.Bots.getTTSVoice();

	for (i=0; i < voices.length; i++) {
		if (voices[i].lang == 'en-us') {
			let selected = (voices[i].lang == currentVoice.lang && voices[i].name == currentVoice.name) ? 'checked' : '';
			html += `<div class='ida-voice'>
						<input type='radio' name='ida-voices' value='${voices[i].name}' onclick='ida.SelectVoice("${voices[i].name}", "${voices[i].lang}");'${selected} />
						<label>${voices[i].name}</label>
					</div>`;
		}
	} 

	if (html) {
		html = `<div class='ida-voices'>${html}</div>`;
	} else {
		html = `
		<div class='ida-voice'>No voices available.</div><br>
		<div><button onclick='ida.CloseWebContainer();'>Close</button></div>`;
	}
	ida.DisplayWebContainer(html, "Select Voice");

};

ida.SelectVoice = function(name, lang) {
	console.log('setting voice to ' + name);
	ida.Bots.setTTSVoice([{
		lang: lang,
		name: name
	}]).then(function() {
		console.log('voice set to ' + name);
		ida.CloseWebContainer();
	});

};

ida.AccessibilityEnable = function() {
	IS.AddEvent(document.body, "keydown", ida.AccessibilityKeyDown);
};

ida.AccessibilityDisable = function() {
	IS.RemoveEvent(document.body, "keydown", ida.AccessibilityKeyDown);
};

ida.AccessibilityKeyDown = function(oEvent) {
	if (!oEvent) {
		oEvent = window.event;
	}

	if (oEvent.keyCode == 27) {
		document.getElementById("IS_CV_WEB_CLOSE_BTN").click();
		if (oEvent.preventDefault) { oEvent.preventDefault(); }
		oEvent.returnValue = false;

		// RM-2647 : Stop propogation so escape doesn't reset page on chrome
		if (oEvent.stopPropagation) {oEvent.stopPropagation(); }
		oEvent.cancelBubble = true;
	}

};

// Embedded Wide Component ---------------------------------------------
ida.SetWideExpanded = function() {
	var widsty, widright;
	var widel = document.querySelector('.oda-chat-wrapper')

	if (typeof window.getComputedStyle !== "undefined") {
		widsty = window.getComputedStyle(widel);
		widright = widsty.getPropertyValue('right');
	} else if ( document.documentElement.currentStyle ) {
		widright = el.currentStyle.right;
	}

	var newWidth = window.innerWidth - (parseInt(widright)*2);
	ida.chatSettings.ida.expandedWidthSaved = ida.chatSettings.ida.expandedWidth;
	ida.chatSettings.ida.expandedWidth = newWidth + "px";
};

ida.OpenForm = function(cfg) {
	if (!IS.$("IS_CV_WEB_FORM")) {
		console.warn("Warning - ida.OpenForm() can only run once Ida has been opened.");
		return;
	}

	var wideStyle, wideJS, content;
	var pageCustomJS = "document.getElementById('PT_HEADER').style.display='none';";

	if (cfg.expandedWide) {
		pageCustomJS += "top.ida.chatSettings.ida.expandedWidth = top.ida.chatSettings.ida.expandedWidthSaved;";
		ida.SetWideExpanded();
	}
	if (cfg.expanded || cfg.expandedWide) {
		wideStyle = "height:2000px;";
		// treat as a lightbox for Fluid scrolling of main page
		IS.AddClass(document.body, "iLightboxOpen");
	}

	content = `
		<div id="is_cv_embedded_loader" class="is-cv-embedded-loader"><img src="${IS_CORE_LOADER}"/></div>
		<div id="is_cv_embedded_comp"><div style="${wideStyle}">&nbsp;</div></div>
	`;
	ida.DisplayWebContainer(content, "", false, !cfg.forcePadding, !cfg.forceScroll);

	var config = {
		embeddedDiv: "is_cv_embedded_comp",
		lbFrameWidth: "100%",
		isPeopleSoft: true
	};

	config = IS.MergeJSON(config, cfg);
	config.pageCustomJS = config.pageCustomJS ? pageCustomJS + config.pageCustomJS : pageCustomJS;

	if (config.isPeopleSoft) {
		config.pageCustomJS += "if (typeof initScrolls !== 'undefined') { console.log('*** initing scrolls'); initScrolls(); } else {console.log('*** no initScrolls() found');} ";
	} 

	IS.CompOpen(config);

	// Look for Web Form closing and close (cleanup) the iComponent object
	if (!ida.CompMO) {
		ida.CompMO = new MutationObserver(function (e) {
			if (e[0].removedNodes.length) { 
				iComp.Close(); 
				ida.CompMO.disconnect;
			}
		});
	}
	ida.CompMO.observe(document.getElementById('IS_CV_WEB_FORM'), { childList: true });	
};

/* RM 2024Q2 - Temp Patch to fix ODA bug if not small form factor */
addEventListener("resize", function(e) {
	var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
	if (vw > 450) {
		var el = document.querySelector(".oda-chat-wrapper");
		if (el) {
			if (el.classList.contains("oda-chat-pos-left")) {
				IS.RemoveClass(el, "oda-chat-pos-left");
				IS.AddClass(el, "oda-chat-pos-right");
			}
		}
	}
});

/** Feedback Functions 11/24/24 **/
/* LLM Thumbs javascript 2024Q3 */
IS.Namespace("IS.CV.RATING");

IS.CV.RATING.openFlyout = null;


IS.CV.RATING.handleThumbsUpClick = function(button, instance, decision, question, answer) {
  var feedbackContainer = button.closest('.feedback-container');
  var saveURL = feedbackContainer.getAttribute("data-save-url");

  IS.CV.RATING.SendRating(saveURL, 'GOOD',instance, decision, question, answer);
  /* Find the nearest parent .feedback-container and replace its content*/

  feedbackContainer.innerHTML = 'Thanks for the feedback';
};


IS.CV.RATING.handleThumbsDownClick = function(button) {
  /* Close any open flyouts */
  IS.CV.RATING.closeOpenFlyout();

  /* Find the flyout within the same .feedback-container */
  var feedbackContainer = button.closest('.feedback-container');
  var flyout = feedbackContainer.querySelector('.feedback-flyout');
  flyout.style.display = 'block';

  /* Set the openFlyout to the currently opened flyout */
  IS.CV.RATING.openFlyout = flyout;

  /* Scroll chat to end */
  flyout.scrollIntoView({ behavior: "smooth", block: "nearest" });

  /* Add event listener to close the flyout when clicking outside */
  document.addEventListener('click', IS.CV.RATING.outsideClickListener);
};

IS.CV.RATING.handleFlyoutOptionClick = function(button, rating, instance, decision, question, answer) {

  var feedbackContainer = button.closest('.feedback-container');	

  var saveURL = feedbackContainer.getAttribute("data-save-url");

  IS.CV.RATING.SendRating(saveURL, rating, instance, decision, question, answer);
  /* Find the nearest parent .feedback-container and replace its content */
  
  feedbackContainer.innerHTML = 'Thanks for the feedback';

  /* Close the flyout and remove the event listener */
  IS.CV.RATING.closeOpenFlyout();
};

IS.CV.RATING.closeOpenFlyout = function(button) {
  if (IS.CV.RATING.openFlyout) {
    IS.CV.RATING.openFlyout.style.display = 'none';
    IS.CV.RATING.openFlyout = null;
    document.removeEventListener('click', IS.CV.RATING.outsideClickListener);
  }
};

IS.CV.RATING.outsideClickListener = function(button) {
  /* Check if the click occurred outside the open flyout and the thumbs-down button */
  if (
    IS.CV.RATING.openFlyout &&
    !IS.CV.RATING.openFlyout.contains(event.target) &&
    !IS.CV.RATING.openFlyout.previousElementSibling.contains(event.target)
  ) {
    IS.CV.RATING.closeOpenFlyout();
  }
};

IS.CV.RATING.SendRating = function(saveURL, rating, instance, decision, question, answer) {

	function createUUID() {
		/* http://www.ietf.org/rfc/rfc4122.txt */
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4";  /* bits 12-15 of the time_hi_and_version field to 0010 */
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  /* bits 6-7 of the clock_seq_hi_and_reserved to 01 */
		s[8] = s[13] = s[18] = s[23] = "-";

		var uuid = s.join("");
		return uuid;
	}

	/* new thumbs reporting method to ODA webhook */
	var ratingData = {};

	if (typeof(decision) === 'undefined') {
		ratingData = {
			instance: instance,
			rating: rating,
			is_llm: true
		};
	} else {
		ratingData = {
            instance: instance,
            decision: decision,
            question: question,
            answer: answer,
            rating: rating
        };
	}

	var body = {
		"source": "USER",
		"messagePayload": {
			"type": "text",
			"text": JSON.stringify(ratingData)
		}
	};

	var message = JSON.stringify(body);

	var socket_url = saveURL + "&userId=" + createUUID();

	var socket = new WebSocket(socket_url);
	socket.onopen = function (event) {
		socket.send(message);
		console.log("sent message");
		setTimeout(function () {
			socket.close();
			console.log("closed socket");
		}, 5000);
	};
};

if (typeof(IS.CV.RATING.SaveURL) === 'undefined'){
   IS.CV.RATING.SaveURL = "%Bind(:2)";
};

/* end Feedback JS JDL 11/24/24 */
/* JDL 3/21/25 trap tabs for Accessability */
ida.trapFocus = function(element) {

  var focusableEls = ida.getFocusableElements("conversation");
  for (let i = 0; i < focusableEls.length; i++) {
    focusableEls[i].tabIndex = -i;
  } 
  var idaTabListener = function(e){ ida.idaTabListener(e);};
  

  element.addEventListener('keydown', idaTabListener);
};

ida.idaTabListener = function(myevent) {
 // Event handling logic
    var KEYCODE_TAB = 9;
    var myElements = ida.getFocusableElements("conversation");

    var isTabPressed = (myevent.key === 'Tab' || myevent.keyCode === KEYCODE_TAB);
    var nextTabIndex = 0;
    var currTabIndex = 0;
    if (!isTabPressed) { 
      return; 
    }
    for (let j = 0; j < myElements.length; j++) {
       if (myElements[j] === document.activeElement) {
         currTabIndex = j;
       }
    } 

    if ( myevent.shiftKey ) /* shift + tab */ {
      if(currTabIndex == 0) {
        nextTabIndex = myElements.length - 1;
      } else {
        nextTabIndex = currTabIndex - 1;
      }
     
    } else /* tab */ {
      if(currTabIndex == myElements.length - 1) {
        nextTabIndex = 0;
      } else {
        nextTabIndex = currTabIndex + 1;
      }
    }
    myElements[nextTabIndex].focus();
      myevent.preventDefault();

};

ida.getFocusableElements = function(section) {

  switch(section) {
  case "webform":
    // code block  
    var containerNodes = document.getElementsByClassName('chat-widget-web-IS_CV_WEB_CONTAINER')[0].querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
    var containerArr = Array.from(containerNodes);
    var focusElsArr = containerArr;
    break;
  case "other":
    // code block
    break;
  default:
    // code block
    var headerNodes = document.getElementsByClassName('oda-chat-header')[0].querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
    var conversationNodes = document.getElementsByClassName('oda-chat-conversation')[0].querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
    var footerNodes = document.getElementsByClassName('oda-chat-footer')[0].querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
    var headArr = Array.from(headerNodes);
    var convArr = Array.from(conversationNodes);
    var footArr = Array.from(footerNodes);
    footArr.pop();
    var focusElsArr = headArr.concat(convArr, footArr);
    break;
  } 



  return focusElsArr;
};


/* JDL 3nd trap tabs */

/* Functions for Ida 26.01 tool checkpoint visuals */
const TOOL_CHECKPOINT_ID = 'oda-tool-checkpoint';
let _toolCheckpointEl = null;

ida.showToolCheckpoint = function(text) {
  if (_toolCheckpointEl) return;

  ida.Bots.showTypingIndicator();

  const span = document.createElement('span');
  span.className = 'status-text';
  span.textContent = text;

  const hr = document.createElement('div');
  hr.id = TOOL_CHECKPOINT_ID;
  hr.className = 'oda-chat-hr oda-chat-flex';
  hr.setAttribute('dir', 'auto');
  hr.appendChild(span);

  const typingCue = document.querySelector('div.oda-chat-typing-cue-wrapper');
  const messageBlock = typingCue?.closest('div.oda-chat-message-block');

  if (messageBlock) {
    messageBlock.parentElement.insertBefore(hr, messageBlock);
  } else {
    const container = document.querySelector('div.oda-chat-conversation-container');
    if (!container) return;
    container.appendChild(hr);
  }

  _toolCheckpointEl = hr;
}

ida.updateToolCheckpoint = function(newText) {
  if (!_toolCheckpointEl) return;

  ida.Bots.showTypingIndicator();

  const existing = _toolCheckpointEl.querySelector('.status-text:not(.leaving)');
  if (existing && existing.textContent === newText) return;

  if (existing) {
    existing.classList.add('leaving');
    existing.addEventListener('animationend', () => existing.remove(), { once: true });
  }

  const next = document.createElement('span');
  next.className = 'status-text';
  next.textContent = newText;
  _toolCheckpointEl.appendChild(next);
}

ida.hideToolCheckpoint = function() {
  if (!_toolCheckpointEl) return;

  const el = _toolCheckpointEl;
  _toolCheckpointEl = null;

  const existing = el.querySelector('.status-text:not(.leaving)');
  if (existing) {
    existing.classList.add('leaving');
    existing.addEventListener('animationend', () => el.remove(), { once: true });
  } else {
    el.remove();
  }
}

