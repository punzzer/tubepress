/**
 * Copyright 2006 - 2010 Eric D. Hough (http://ehough.com)
 * 
 * This file is part of TubePress (http://tubepress.org) and is released 
 * under the General Public License (GPL) version 3
 *
 * Shrink your JS: http://developer.yahoo.com/yui/compressor/
 */

/* caching script loader */
jQuery.getScript = function (url, callback, cache) {
	jQuery.ajax({ type: "GET", url: url, success: callback, dataType: "script", cache: cache }); 
}; 

/* http://jquery.malsup.com/fadetest.html */
jQuery.fn.fadeTo = function (speed, to, callback) { 
	return this.animate({opacity: to}, speed, function () { 
        	if (to == 1 && jQuery.browser.msie) {
        		this.style.removeAttribute('filter');
        	}
        	if (jQuery.isFunction(callback)) 
        	    callback();  
    	}); 
};

/* this is meant to be called from the user's HTML page */
var safeTubePressInit = function () {
	try {
		TubePressGallery.init(getTubePressBaseUrl());
  	} catch (f) {
		alert("TubePress failed to initialize: " + f.message);
  	}
};

/* append our init method to after all the other (potentially full of errors) ready blocks have 
 * run. http://stackoverflow.com/questions/1890512/handling-errors-in-jquerydocument-ready */
if (!jQuery.browser.msie) {
	var oldReady = jQuery.ready, TubePress;
	jQuery.ready = function () {
			try {
				oldReady.apply(this, arguments);
			} catch (e) { }
			safeTubePressInit();
	};
} else {
	jQuery().ready(function () {
		safeTubePressInit();
	});
}

/**
 * Main TubePress gallery module.
 */
TubePressGallery = (function () {

	var init, initClickListeners, fluidThumbs;
	
	/* Primary setup function for TubePress. Meant to run once on page load. */
	init = function (baseUrl) {
		TubePressPlayers.init(baseUrl);
		TubePressEmbedded.init(baseUrl);
		TubePressGallery.initClickListeners();
	};

	initClickListeners = function () {
		jQuery("a[id^='tubepress_']").click(clickListener);
	}
	
	/* thumbnail click listener */
	clickListener = function () {
		var rel_split	= jQuery(this).attr("rel").split("_"),
		galleryId		= TubePressAnchors.getGalleryIdFromRelSplit(rel_split),
		playerName   	= TubePressAnchors.getPlayerNameFromRelSplit(rel_split),
		embeddedName 	= TubePressAnchors.getEmbeddedNameFromRelSplit(rel_split),
		videoId 		= TubePressAnchors.getVideoIdFromIdAttr(jQuery(this).attr("id"));

		/* swap the gallery's embedded object */
		TubePressEmbedded.swap(galleryId, videoId, embeddedName);
	
		/* then call the player to load up / play the video */
		TubePressPlayers.invokePlayer(galleryId, videoId, embeddedName, playerName);
	};

	/* http://www.sohtanaka.com/web-design/smart-columns-w-css-jquery/ */
	fluidThumbs = function (gallerySelector, columnWidth) {
		var gallery 	= jQuery(gallerySelector),
			colWrap 	= gallery.width(), 
			colNum 		= Math.floor(colWrap / columnWidth), 
			colFixed 	= Math.floor(colWrap / colNum),
			thumbs 		= jQuery(gallerySelector + ' div.tubepress_thumb');
		
		gallery.css({ 'width' : "100%"});
		gallery.css({ 'width' : colWrap });
		thumbs.css({ 'width' : colFixed});
	};
	
	/* return only public functions */
	return {
		init						: init,
		initClickListeners 			: initClickListeners,
		fluidThumbs 				: fluidThumbs
	};
}());

/* analyzes HTML anchor objects */
TubePressAnchors = (function () {
	
	findAllEmbeddedNames = function () {
		return parseRels(1);	
	};
	
	findAllPlayerNames = function () {
		return parseRels(2);	
	}
	
	getEmbeddedNameFromRelSplit = function (relSplit) {
		return relSplit[1];
	};
	
	getPlayerNameFromRelSplit = function (relSplit) {
		return relSplit[2];
	};
	
	getGalleryIdFromRelSplit = function (relSplit) {
		return relSplit[3];
	};
	
	getVideoIdFromIdAttr = function (id) {
		var end = id.lastIndexOf("_");
		return id.substring(16, end);
	}
	
	parseRels = function (index) {
		var returnValue = [];
		jQuery("a[rel^='tubepress_']").each(function () {
			var thisName = jQuery(this).attr("rel").split("_")[index];
			if (jQuery.inArray(thisName, returnValue) === -1) {
				returnValue.push(thisName);
			}
		});
		return returnValue;
	};
	
	return {
		findAllEmbeddedNames		: findAllEmbeddedNames,
		findAllPlayerNames			: findAllPlayerNames,
		getEmbeddedNameFromRelSplit	: getEmbeddedNameFromRelSplit,
		getPlayerNameFromRelSplit	: getPlayerNameFromRelSplit,
		getGalleryIdFromRelSplit	: getGalleryIdFromRelSplit,
		getVideoIdFromIdAttr		: getVideoIdFromIdAttr
	};
	
}());

/* deals with the embedded video player */
TubePressEmbedded = (function () {

	var init;
	
	/* loads up JS necessary for dealing with embedded Flash implementations that we find on the page */
	init = function (baseUrl) {
		var embeddedNames = TubePressAnchors.findAllEmbeddedNames(), i, emptyFunc = function () {};
		for (i = 0; i < embeddedNames.length; i = i + 1) {
			
			/* vimeo has no extra JS */
			if (embeddedNames[i] === 'vimeo') { continue; }
			
			jQuery.getScript(baseUrl + "/ui/lib/embedded_flash/" + embeddedNames[i] + "/" + embeddedNames[i] + ".js", emptyFunc, true);
		}
	};
	
	/**
	 * Swaps out the embedded Flash player with a replacement. 
	 * This function is very carefully constructed to work with both IE 7-8 and FF.
	 * Modify at your own risk!!
	*/
	swap = function (galleryId, videoId, embeddedName) {
		var wrapperId = "#tubepress_embedded_object_" + galleryId,
			wrapper = jQuery(wrapperId), newHtml, oldHtml, oldId;

		/* if we can't find the embedded object, just bail */
		if (wrapper.length === 0) {
			return;
		}

		/* Vimeo is special. */
		if (embeddedName === 'vimeo') {
			oldHtml = wrapper.html();
			wrapper.empty();
			oldId = oldHtml.match(/\/video\/([0-9]+).*/)[1];
			wrapper.html(oldHtml.replace(oldId, videoId));
			return;
		}
		
		var matcher     = window["tubepress_" + embeddedName + "_matcher"](),
		    paramName 	= window["tubepress_" + embeddedName + "_param"](),
			obj 		= jQuery(wrapperId + " > object"),
			oldVideoId 	= obj.children("param[name='" + paramName + "']").attr("value").match(matcher)[1];

		/* remove anything AdBlock plus sticks in there */
		obj.siblings().remove();
	
		/* save the params but remove them from the DOM for now */
		var params = obj.children("param");
		params.remove();

		/* create the new embedded object */
		newHtml = getEmbeddedObjectClone(wrapper, params).replace(new RegExp(oldVideoId, 'g'), videoId);
	
		/* add it back in */
		wrapper.html(newHtml);

		/* now pat yourself on the back */	
	};
	
	getEmbeddedObjectClone = function (wrapper, params) {
		
		//http://blog.stevenlevithan.com/archives/faster-trim-javascript
		var newHtml = wrapper.html().replace(/\s\s*$/, '');
		
		/* chop off the closing </object>. Don't change this unless you want to break IE */
		newHtml = newHtml.substring(0, newHtml.length - 9);

		/* now add back the params, but this time with the new video ID */
		params.each(function () {
			newHtml += '<param name="' + this.name + '" value="' + this.value + '" />';
		});
	
		/* re-close the object */
		newHtml += '</object>';
		return newHtml;
	};
	
	return {
		init : init,
		swap : swap
	};
	
}());

/* handles player-related functionality (popup, Shadowbox, etc) */
TubePressPlayers = (function () {
	
	var init, playerInit;
	
	init = function (baseUrl) {
		
		/* loads up JS necessary for dealing with TubePress players that we find on the page */
		var playerNames = TubePressAnchors.findAllPlayerNames(), i;
		for (i = 0; i < playerNames.length; i = i + 1) {
			var name = playerNames[i];
			jQuery.getScript(baseUrl + "/ui/lib/players/" + name + "/" + name + ".js", 
				playerInit(name, baseUrl));
		}
	};
	
	invokePlayer = function (galleryId, videoId, embeddedName, playerName) {
		if ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
			return;
		}
		var playerFunctionName = "tubepress_" + playerName + "_player";
		window[playerFunctionName](galleryId, videoId);
	};
	
	playerInit = function (name, baseUrl) {
		
		/* Call tubepress_<playername>_init() when the player JS is loaded */
		var funcName = 'tubepress_' + playerName + '_player_init',
			f = function () {
				window[funcName](baseUrl);
			};	
		TubePressJS.callWhenTrue(function () {
			return typeof window[funcName] === 'function'; 
		}, f);	
	};
	
	return {
		init 			: init,
		invokePlayer	: invokePlayer
	};
	
}());

TubePressEvents = (function () {
	
	return {
		NEW_THUMBS_LOADED = "tubepressNewThumbnailsLoaded"
	};
	
}());

/**
 * Handles some DOM and network related tasks
 */
TubePressJS = (function () {
	
	/**
	 * Waits until the given test is true (tests every .4 seconds),
	 * and then executes the given callback.
	 */
	callWhenTrue = function (test, callback) {

		/* if the test doesn't pass, try again in .4 seconds */	
		if (!test()) {
			var futureTest = function () {
				callWhenTrue(test, callback);
			};
			setTimeout(futureTest, 400);
			return;
		}
		/* the test passed, so call the callback */
		callback();
	};
	
	getWaitCall = function (scriptPath, test, callback) {
		var futureCallback = function () {
			callWhenTrue(test, callback);
		};
		jQuery.getScript(scriptPath, futureCallback, true);
	};

	loadCss = function (path) {
		var fileref = document.createElement("link");
		
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", path);
		document.getElementsByTagName("head")[0].appendChild(fileref);
	};
	
	/* return only public functions */
	return { 
		callWhenTrue	: callWhenTrue,
		getWaitCall 	: getWaitCall,
		loadCss 		: loadCss
	};
}());

/**
 * Functions for handling Ajax pagination.
 */
TubePressAjaxPagination = (function () {
	
	/* initializes pagination HTML for Ajax. */
	init = function (galleryId) {
		var clickCallback = function () {
			processRequest(jQuery(this), galleryId);
		};
		
		jQuery("#tubepress_gallery_" + galleryId + " div.pagination a").click(clickCallback);
	};

	processRequest = function (anchor, galleryId) {
		var baseUrl 			= getTubePressBaseUrl(), 
			shortcode 			= window["getUrlEncodedShortcodeForTubePressGallery" + galleryId](),
			page 				= anchor.attr("rel"),
			thumbnailArea 		= "#tubepress_gallery_" + galleryId + "_thumbnail_area",
			postLoadCallback 	= function () {
				postAjaxGallerySetup(thumbnailArea, galleryId);
			},
			pageToLoad 			= baseUrl + "/env/pro/lib/ajax/responder.php?shortcode=" + shortcode + "&tubepress_" + page + "&tubepress_galleryId=" + galleryId,
			remotePageSelector 	= thumbnailArea + " > *",
			loadFunction 		= function () {
				jQuery(thumbnailArea).load(pageToLoad + " " + remotePageSelector, postLoadCallback);
			};

		/* fade out the old stuff */
		jQuery(thumbnailArea).fadeTo('fast', '.01');
	
		/* use a tiny delay here to prevent the new content from showing up before we're done fading */
		setTimeout(loadFunction, 100);
	};

	/* post thumbnail load setup */
	postAjaxGallerySetup = function (thumbnailArea, galleryId) {
		jQuery().trigger(TubePressEvents.NEW_THUMBS_LOADED);
		TubePressGallery.fluidThumbs("#tubepress_gallery_" + galleryId, 120);
		TubePressGallery.initClickListeners();
		init(galleryId);
		jQuery(thumbnailArea).fadeTo('fast', 1);
	};
	
	/* return only public functions */
	return { init : init };
}());
