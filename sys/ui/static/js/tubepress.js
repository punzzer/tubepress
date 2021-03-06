/**
 * Copyright 2006 - 2011 Eric D. Hough (http://ehough.com)
 * 
 * This file is part of TubePress (http://tubepress.org) and is released 
 * under the General Public License (GPL) version 3
 *
 * Shrink your JS: http://developer.yahoo.com/yui/compressor/
 */

/*global jQuery, getTubePressBaseUrl, alert */
/*jslint white: true, onevar: true, undef: true, newcap: true, nomen: true, regexp: true, plusplus: true, bitwise: true, continue: true, browser: true, maxerr: 50, indent: 4 */

var TubePressAjax = (function () {

	var load, loadAndStyle, applyLoadingStyle, removeLoadingStyle;
	
	/*
	 * Similar to jQuery's "load" but tolerates non-200 status codes.
	 * https://github.com/jquery/jquery/blob/master/src/ajax.js#L168.
	 */
	load = function (url, targetDiv, selector, preLoadFunction, postLoadFunction) {
		if (typeof preLoadFunction === 'function') {
			preLoadFunction();
		}
		
		jQuery.ajax({
			url	: url,
			type	: 'GET',
			dataType: 'html',
			complete: function (res) {

				var html = selector ? jQuery('<div>').append(res.responseText).find(selector) : res.responseText;

				jQuery(targetDiv).html(html);

				if (typeof postLoadFunction === 'function') {
					postLoadFunction();
				}
			}
		});
	};
	
	/*
	 * Calls "load", but does some additional styling on the target element while it's processing.
	 */
	loadAndStyle = function (url, targetDiv, selector, preLoadFunction, postLoadFunction) {
		
		applyLoadingStyle(targetDiv);

		/* one way or another, we're removing the loading style when we're done */
		var post = function () { removeLoadingStyle(targetDiv); };

		/* but maybe we want to do something else too */
		if (typeof postLoadFunction === 'function') {
			post = function () {
				removeLoadingStyle(targetDiv);
				postLoadFunction();
			};
		}

		/* do the load. gyea. */
		load(url, targetDiv, selector, preLoadFunction, post);
	};
	
	/* fade to "white" */
	applyLoadingStyle = function (targetDiv) {
		jQuery(targetDiv).fadeTo(0, 0.3);
	};
	
	/* fade to full opacity */
	removeLoadingStyle = function (targetDiv) {
		jQuery(targetDiv).fadeTo(0, 1);
	};
	
	return {
		load			: load,
		applyLoadingStyle	: applyLoadingStyle,
		removeLoadingStyle	: removeLoadingStyle,
		loadAndStyle		: loadAndStyle
	};
	
}());

/**
 * Handles some DOM and network related tasks
 */
var TubePressJS = (function () {
	
	var callWhenTrue, getWaitCall, loadCss;
	
	/**
	 * Waits until the given test is true (tests every .4 seconds),
	 * and then executes the given callback.
	 */
	callWhenTrue = function (test, callback) {

		/* if the test doesn't pass, try again in .4 seconds */	
		if (!test()) {
			setTimeout(function () { callWhenTrue(test, callback); }, 400);
			return;
		}

		/* the test passed, so call the callback */
		callback();
	};
	
	/*
	 * If test passes right away, this will invoke callback. If not,
	 * it will load the script, wait for the test to pass, then invoke
	 * callback.
	 */ 
	getWaitCall = function (scriptPath, test, callback) {

		/* short circuit */
		if (test()) {
			return callback();
		}

		jQuery.getScript(scriptPath, function () { callWhenTrue(test, callback); }, true);
	};

	/*
	 * Dynamically load CSS into the DOM.
	 */
	loadCss = function (path) {
		var fileref = document.createElement('link');
		
		fileref.setAttribute('rel', 'stylesheet');
		fileref.setAttribute('type', 'text/css');
		fileref.setAttribute('href', path);
		document.getElementsByTagName('head')[0].appendChild(fileref);
	};
	
	return { 
		callWhenTrue	: callWhenTrue,
		getWaitCall	: getWaitCall,
		loadCss		: loadCss
	};
}());

var TubePressEvents = (function () {
	
	return { NEW_THUMBS_LOADED : 'tubepressNewThumbnailsLoaded' };
	
}());

/* analyzes HTML anchor objects */
var TubePressAnchors = (function () {
	
	var getGalleryIdFromRelSplit, getVideoIdFromIdAttr, parseRels;
	
	getGalleryIdFromRelSplit = function (relSplit) {
		return relSplit[3];
	};
	
	getVideoIdFromIdAttr = function (id) {
		var end = id.lastIndexOf('_');
		return id.substring(16, end);
	};
	
	parseRels = function (index) {
		var returnValue = [];
		jQuery("a[rel^='tubepress_']").each(function () {
			var thisName = jQuery(this).attr('rel').split('_')[index];
			if (jQuery.inArray(thisName, returnValue) === -1) {
				returnValue.push(thisName);
			}
		});
		return returnValue;
	};
	
	return {
		getGalleryIdFromRelSplit	: getGalleryIdFromRelSplit,
		getVideoIdFromIdAttr		: getVideoIdFromIdAttr
	};
	
}());

var TubePressGallery = (function () {

	var isFluidThumbs, getShortcode, getEmbeddedImplName, getPlayerLocationName, 
		isAjaxPagination, isEmbedHasMeta, o, getEmbeddedHeight, getEmbeddedWidth;

	o = function (galleryId) {
		return window['TubePressGallery' + galleryId];
	};
	
	isFluidThumbs = function (galleryId) {
		return o(galleryId).fluidThumbs;
	};

	getShortcode = function (galleryId) {
		return o(galleryId).shortcode;
	};

	getEmbeddedImplName = function (galleryId) {
		return o(galleryId).embeddedImplName;
	};

	getPlayerLocationName = function (galleryId) {
		return o(galleryId).playerLocationName;
	};

	isAjaxPagination = function (galleryId) {
		return o(galleryId).ajaxPagination;
	};

	isEmbedHasMeta = function (galleryId) {
		return o(galleryId).embedHasMeta;
	};

	getEmbeddedHeight = function (galleryId) {
		return o(galleryId).embeddedHeight;
	};

	getEmbeddedWidth = function (galleryId) {
		return o(galleryId).embeddedWidth;
	};

	return {
		isAjaxPagination	: isAjaxPagination,
		isEmbedHasMeta		: isEmbedHasMeta,
		isFluidThumbs		: isFluidThumbs,
		getShortcode		: getShortcode,
		getEmbeddedImplName	: getEmbeddedImplName,
		getPlayerLocationName	: getPlayerLocationName,
		getEmbeddedHeight	: getEmbeddedHeight,
		getEmbeddedWidth	: getEmbeddedWidth
	};
}());

/* handles player-related functionality (popup, Shadowbox, etc) */
var TubePressPlayers = (function () {
	
	var loadPlayerJs, playerInit, invokePlayer, loadedPlayers = {};
	
	loadPlayerJs = function (baseUrl, galleryId) {
		
		var playerName = TubePressGallery.getPlayerLocationName(galleryId);

		/* don't load a player twice */
		if (loadedPlayers[playerName] === true) {
			return;
		}

		jQuery.getScript(baseUrl + '/sys/ui/static/players/' + playerName + '/' + playerName + '.js', 
			playerInit(playerName, baseUrl));
	};
	
	playerInit = function (playerName, baseUrl) {
		
		/* remember that we already loaded this */
		loadedPlayers[playerName] = true;

		/* Call tubepress_<playername>_init() when the player JS is loaded */
		var funcName	= 'tubepress_' + playerName + '_player_init',
			f	= function () {
				window[funcName](baseUrl);
			};

		TubePressJS.callWhenTrue(function () {
			return typeof window[funcName] === 'function'; 
		}, f);	
	};

	invokePlayer = function (galleryId, videoId) {
		var playerFunctionName	= 'tubepress_' +  TubePressGallery.getPlayerLocationName(galleryId) + '_player',
			embedName	= TubePressGallery.getEmbeddedImplName(),
			baseUrl		= getTubePressBaseUrl(),
			meta		= TubePressGallery.isEmbedHasMeta(),
			height		= TubePressGallery.getEmbeddedHeight(),
			width		= TubePressGallery.getEmbeddedWidth();

		jQuery.get(baseUrl + '/sys/scripts/ajax/playerHtml.php', { embedName: embedName, video: videoId, meta: meta }, 
			function (data) { window[playerFunctionName](data.title, data.html, height, width, videoId); }, 'html');
	};
	
	jQuery(document).bind(TubePressEvents.NEW_THUMBS_LOADED, function (e, galleryId) {

		loadPlayerJs(getTubePressBaseUrl(), galleryId);

	});

	return { invokePlayer : invokePlayer };
	
}());

/**
 * Main TubePress gallery module.
 */
var TubePressThumbs = (function () {

	var makeThumbsFluid, clickListener, getCurrentPageNumber, getThumbWidth, getThumbArea, getThumbAreaSelector;
	
	
	/* thumbnail click listener */
	clickListener = function () {
		var rel_split		= jQuery(this).attr('rel').split('_'),
			galleryId	= TubePressAnchors.getGalleryIdFromRelSplit(rel_split),
			videoId		= TubePressAnchors.getVideoIdFromIdAttr(jQuery(this).attr('id'));
	
		/* then call the player to load up / play the video */
		TubePressPlayers.invokePlayer(galleryId, videoId);
	};

	/* http://www.sohtanaka.com/web-design/smart-columns-w-css-jquery/ */
	makeThumbsFluid = function (galleryId) {
		
		getThumbArea(galleryId).css({ 'width' : "100%" });
		
		var gallerySelector	= getThumbAreaSelector(galleryId),
			columnWidth	= getThumbWidth(galleryId),
			gallery		= jQuery(gallerySelector),
			colWrap		= gallery.width(), 
			colNum		= Math.floor(colWrap / columnWidth), 
			colFixed	= Math.floor(colWrap / colNum),
			thumbs		= jQuery(gallerySelector + ' div.tubepress_thumb');
		
		gallery.css({ 'width' : '100%'});
		gallery.css({ 'width' : colWrap });
		thumbs.css({ 'width' : colFixed});
	};
	
	getCurrentPageNumber = function (galleryId) {
		var page = 1, 
			paginationSelector = 'div#tubepress_gallery_' + galleryId
				+ ' div.tubepress_thumbnail_area:first > div.pagination:first > span.current',
			current = jQuery(paginationSelector);

		if (current.length > 0) {
			page = current.html();
		}
		
		return page;
	};

	getThumbWidth = function (galleryId) {
		return getThumbArea(galleryId).find('img:first').width();
	};

	getThumbArea = function (galleryId) {
		return jQuery(getThumbAreaSelector(galleryId));
	};

	getThumbAreaSelector = function (galleryId) {
		return "#tubepress_gallery_" + galleryId + "_thumbnail_area";
	};
	
	jQuery(document).bind(TubePressEvents.NEW_THUMBS_LOADED, function (e, galleryId) {

		/* add a click handler to each link in this gallery */
		jQuery("#tubepress_gallery_ " + galleryId + " a[id^='tubepress_']").click(clickListener);

		/* fluid thumbs if we need it */
		if (TubePressGallery.isFluidThumbs(galleryId)) {
			makeThumbsFluid(galleryId);
		}
	});

	/* return only public functions */
	return {
		getThumbAreaSelector	: getThumbAreaSelector,
		getCurrentPageNumber	: getCurrentPageNumber
	};
}());

/**
 * Functions for handling Ajax pagination.
 */
var TubePressAjaxPagination = (function () {
	
	var addClickHandlers, processClick, postLoad;
	
	/* initializes pagination HTML for Ajax. */
	addClickHandlers = function (galleryId) {
		var clickCallback = function () {
			processClick(jQuery(this), galleryId);
		};
		jQuery('#tubepress_gallery_' + galleryId + ' div.pagination a').click(clickCallback);
	};

	/* Handles an ajax pagination click. */
	processClick = function (anchor, galleryId) {
		var baseUrl			= getTubePressBaseUrl(), 
			shortcode		= TubePressGallery.getShortcode(galleryId),
			page			= anchor.attr('rel'),
			thumbnailArea		= TubePressThumbs.getThumbAreaSelector(galleryId),
			postLoadCallback	= function () { postLoad(galleryId); },
			pageToLoad		= baseUrl + '/sys/scripts/ajax/shortcode_printer.php?shortcode=' + shortcode + '&tubepress_' + page + '&tubepress_galleryId=' + galleryId,
			remotePageSelector	= thumbnailArea + ' > *';
		TubePressAjax.loadAndStyle(pageToLoad, thumbnailArea, remotePageSelector, '', postLoadCallback);
	};

	/* post thumbnail load setup */
	postLoad = function (galleryId) {
		jQuery(document).trigger(TubePressEvents.NEW_THUMBS_LOADED, galleryId);
	};

	/* sets up new thumbnails for ajax pagination */
	jQuery(document).bind(TubePressEvents.NEW_THUMBS_LOADED, function (e, galleryId) {
		if (TubePressGallery.isAjaxPagination(galleryId)) {
			addClickHandlers(galleryId);
		}
	});
}());

var TubePress = (function () {

	var init, compat, alreadyInited = false;

	init = function () {
		if (!window.getTubePressBaseUrl || alreadyInited) {
			return;
		}

		try {
			compat();
		
			/* init each gallery we find */
			jQuery("div.tubepress_container").each(function () {
				var galleryId = jQuery(this).attr('id').replace('tubepress_gallery_', '');
				jQuery(document).trigger(TubePressEvents.NEW_THUMBS_LOADED, [galleryId]);
			});

			alreadyInited = true;

		} catch (f) {
			alert('TubePress failed to initialize: ' + f.message);
		}
	};

	compat = function () {

		/* caching script loader */
		jQuery.getScript = function (url, callback, cache) {
			jQuery.ajax({ type: 'GET', url: url, success: callback, dataType: 'script', cache: cache }); 
		}; 

		/* http://jquery.malsup.com/fadetest.html */
		jQuery.fn.fadeTo = function (speed, to, callback) { 
			return this.animate({opacity: to}, speed, function () { 
				if (to === 1 && jQuery.browser.msie) {
					this.style.removeAttribute('filter');
				}
				if (jQuery.isFunction(callback)) {
					callback();
				}
			});
		};
	};

	return { init: init };

}());


/* append our init method to after all the other (potentially full of errors) ready blocks have 
 * run. http://stackoverflow.com/questions/1890512/handling-errors-in-jquerydocument-ready */
if (!jQuery.browser.msie) {
	var oldReady = jQuery.ready;
	jQuery.ready = function () {
		try {
			oldReady.apply(this, arguments);
		} catch (e) { }
		TubePress.init();
	};
} else {
	jQuery(document).ready(function () {
		TubePress.init();
	});
}

