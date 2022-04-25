// mw 4.9.2013
// ES6 1.3.2020

/* eslint-disable eqeqeq */

import { strUtil } from './Tools.js'
// import { Point, Size } from './Graphics/GeometricalObjects.js'


export var System =
{
	getStrOS: function ()
	{
		if ( !this.strOS )
		{
			if ( this.getiOSVersion() )
				this.strOS = "iOS" + this.getiOSVersion();
			if ( this.getAndroidVersion() )
				this.strOS = "Andr" + this.getAndroidVersion();
			if ( this.isWindows() )
				this.strOS = "Win";
			if ( this.isLinux() )
				this.strOS = "Ux";
			if ( this.isMac() )
				this.strOS = "Mac";

			this.strOS = navigator.platform;
		}

		return this.strOS;
	},

   getOSChar: function ()
   {
      var osID = 'X';
		if ( this.isWindows() )
			osID = 'W';
      else
		if ( this.isMac() )
			osID = 'M';
      else
      if ( this.isIPhone() || this.isIPad() )
			osID = 'I';
      else
		if ( this.isAndroid() )
			osID = 'A';
      else
		if ( this.isLinux() )
			osID = 'L';
      return osID;
   },  

	getStrSysInfo: function()
	{
		return this.getStrOS() + " "
			+ String.f( "{0}/{1}/{2}, cpus={3}", window.innerWidth, window.innerHeight, window.devicePixelRatio, this.getNCpus() );
	},

	isCordova: function()
	{
      return (strUtil.getURLParam("client") === "cordova") || (!!window.cordova);
	},

	isMobile: function ()
	{
		// 3 + 1;
		// "#IFDEBUG"
		//  // return true;
		// "#ENDIF"

      var isKindle = /Kindle|Silk|KFAPW|KFARWI|KFASWI|KFFOWI|KFJW|KFMEWI|KFOT|KFSAW|KFSOWI|KFTBW|KFTHW|KFTT|WFFOWI/i.test( navigator.userAgent )
      if ( isKindle )
         return true;

		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|bada|Opera Mini/i.test( navigator.userAgent );
	},

	isDesktop: function ()
	{
		// assume a certain hardware power:
		return !System.isMobile() && window.screen.width > 1400 && window.screen.height >= 900;
   },

   isElectron: function ()
   {
      var userAgent = navigator.userAgent.toLowerCase();
      return (userAgent.indexOf(' electron/') > -1);
   },

	requestFullScreen: function ()
	{
		var body = document.documentElement;
		if ( body.requestFullscreen )
		{
			body.requestFullscreen();
		} else if ( body.webkitrequestFullscreen )
		{
			body.webkitrequestFullscreen();
		} else if ( body.mozrequestFullscreen )
		{
			body.mozrequestFullscreen();
		} else if ( body.msrequestFullscreen )
		{
			body.msrequestFullscreen();
		}
	},

	isFullScreen: function()
	{
		// problematisch.
		return ( document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen )
		|| ( window.screen.availHeight || window.screen.height - 30 ) <= window.innerHeight;
	},

	isAtLeastTablet: function ()
	{
		// 3 + 4;
		// "#IFDEBUG"
		// //		return false;
		// "#ENDIF"

		return ( window.screen.width >= 1000 && window.screen.height >= 760 ) || window.screen.height >= 1000;
	},

	isIPhone: function ()
	{
		//	return true;
		return /iPhone/i.test( navigator.userAgent ) || /iPod/i.test( navigator.userAgent );
	},

	isIPad: function ()
	{
		//	return true;
		return /iPad/i.test( navigator.userAgent );
	},

	getiOSVersion: function ()
	{
		//if ( /iP(hone|od|ad)/.test( navigator.platform ) )
		//{
		//	// supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
		//	var v = ( navigator.appVersion ).match( /OS (\d+)_(\d+)_?(\d+)?/ );
		//	return [parseInt( v[1], 10 ), parseInt( v[2], 10 ), parseInt( v[3] || 0, 10 )];
		//}

		var iOS = parseFloat(
		 ( '' + ( /CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec( navigator.userAgent ) || [0, ''] )[1] )
		 .replace( 'undefined', '3_2' ).replace( '_', '.' ).replace( '_', '' ) ) || false;

		return iOS;
	},

	isWindows: function ()
	{
		return /Win32/i.test( navigator.platform );
	},

	isLinux: function ()
	{
		return /Linux/i.test( navigator.platform );
	},

	isMac: function ()
	{
		return /Mac/i.test( navigator.platform );
	},

	isTouchDevice: function ()
	{
		if ( this.isTouchChecked !== undefined )
			return this.isTouchChecked;
		else
		{
			this.isTouchChecked = this.isMobile() ||
              ( ( 'ontouchstart' in window )
              || ( navigator.MaxTouchPoints > 0 )
              || ( navigator.msMaxTouchPoints > 0 ) );
			return this.isTouchChecked;
		}
	},

	runsInIFrame: function ()
	{
		try
		{
			return window.self !== window.top
				&& document.referrer.search( /google/i ) == -1
			   && document.referrer.search( /bing/i ) == -1;
		} catch ( x )
		{
			return true;
		}
	},

	getWindowPos: function ()
	{
		// if ( window.screenLeft !== undefined )
		// 	return new Point( window.screenLeft, window.screenTop );
		// else if ( window.screenX !== undefined )	// firefox
		// 	return new Point( window.screenX, window.screenY );
	},

	getWindowSize: function ()
	{
		// var w = window,
		// d = document,
		// e = d.documentElement,
		// g = d.getElementsByTagName( 'body' )[0],
		// wid = w.innerWidth || e.clientWidth || g.clientWidth,
		// hgt = w.innerHeight || e.clientHeight || g.clientHeight;
		//
		// return new Size( wid, hgt );
   },

   getTimeZone: function ()
   {

      var rightNow = new Date();
      return String(String(rightNow).split("(")[1]).split(")")[0];

   },

	isHighResScreen: function ()
	{
		return window.screen.width >= 1400 && window.screen.height >= 900;
	},

	isPortraitScreen: function ( fact )
	{
		fact = fact || 1.0;
		// "#IFDEBUG"
		// return window.innerWidth * fact < window.innerHeight;
		// "#ENDIF"
		return window.screen.width * fact < window.screen.height;
   },

   getLanguage: function ()
   {
      return navigator.language;
   },

   getSystemLanguage: function ()
   {
      return navigator.systemLanguage || window.navigator.language;
   },

	getWindowsCodePage: function ()
	{
		if ( document.inputEncoding )
		{
			switch ( document.inputEncoding )	// defaultCharset deprecated in Chrome
			{
				default:
					return 1252;
				case "ISO-8859-11":
					return 874;	// thai
				case "Windows-31J":	// japan ????
					return 932;
				case "ISO-8859-2":
					return 1250;		// Central Europe
				case "ISO-8859-5":
					return 1251;		// Cyrillic
				case "ISO-8859-1":
					return 1252;		// Western Europe
				case "ISO-8859-7":
					return 1253;		// Greek
				case "ISO-8859-9":
					return 1254;		//	Turkish
				case "ISO-8859-8":
					return 1255;		// Hebrew
				case "ISO-8859-6":
					return 1256;		// Arabic
				case "ISO-8859-13":
					return 1257;		// Baltic
			}
		}
		else
			return 1252;
	},

	getInternetExplorerVersion: function ()
	{
		var rv = -1; // Return value assumes failure.
		if ( navigator.appName == 'Microsoft Internet Explorer' )
		{
			var ua = navigator.userAgent;
			var re = new RegExp( "MSIE ([0-9]{1,}[.0-9]{0,})" );
			if ( re.exec( ua ) != null )
				rv = parseFloat( RegExp.$1 );
		}
		return rv;
	},

	useExtJSTouchCSS: function ()
	{
		return this.isMobile() || this.isTouchDevice();
	},

	isBrowserOk: function ()
	{
		//2 + 3;
		//"#IFDEBUG"
		//return false;
		//"#ENDIF"

		if ( Function.prototype.bind === undefined )
		{
			return false;
		}

		if ( typeof console === "undefined" )
			return false;

		if ( !( "WebSocket" in window ) )
			return false;

		if ( this.getIEVersion() >= 11 )	// windows phone reports as android 4.0
			return true;

		if ( this.isAndroidBrowser() && this.getAndroidVersion() <= 4.2 )	// hack, browser doesn't have WS. See websocketstest.com
			return false;

		if ( this.isSafariOnWindows() && this.getSafariVersion() < 535 && !this.isChrome() )
			return false;

		return true;
	},

	isHTTPS: function()
	{
		if ( document.location && document.location.protocol )
			return 'http:' != document.location.protocol;
		if ( window.location && window.location.protocol )
			return 'http:' != window.location.protocol;

		return false;
	},

	getIEVersion: function ()
	{
		var ua = window.navigator.userAgent;
		var msie = ua.indexOf( 'MSIE ' );
		if ( msie > 0 )
		{
			// IE 10 or older => return version number
			return parseInt( ua.substring( msie + 5, ua.indexOf( '.', msie ) ), 10 );
		}
		var trident = ua.indexOf( 'Trident/' );
		if ( trident > 0 )
		{
			// IE 11 => return version number
			var rv = ua.indexOf( 'rv:' );
			return parseInt( ua.substring( rv + 3, ua.indexOf( '.', rv ) ), 10 );
		}

		var edge = ua.indexOf( 'Edge/' );
		if ( edge > 0 )
		{
			// IE 12 => return version number
			return parseInt( ua.substring( edge + 5, ua.indexOf( '.', edge ) ), 10 );
		}
	},

	getFirefoxVersion: function ()
	{
		var match = window.navigator.userAgent.match(/Firefox\/([0-9]+)\./);
		var ver = match ? parseInt(match[1]) : 0;
		
		return ver;
	},

	isNonCrossDomainIE: function()
	{
		var v = this.getIEVersion();
		if ( v )
			return v < 12;

		return false;
	},

	canRunWebAssembly: function()
   {
      // https://www.scirra.com/blog/218/apple-broke-webassembly-and-are-leaving-it-broken

      //	return false;
      //if ( this.isIPad() || this.isIPhone() )   // March 18, Apple broke WebAssembly on iOS
      //   return false;

		return typeof WebAssembly === "object" /*&& ( this.runsOnChessBaseCom() || document.URL.search( /localhost/i ) != -1 )*/;
	},

	isActivexEnabled: function ()
	{
		var supported = null;
		// try
		// {
		// 	supported = !!new ActiveXObject( "htmlfile" );
		// } catch ( e )
		// {
		// 	supported = false;
		// }
		return supported;
	},

	isWebKit: function ()
	{
		var isWebkit = ( window.webkitURL != null );
		return isWebkit;
	},

	isChrome: function ()
	{
		return navigator.userAgent.indexOf( "Chrome" ) != -1;
	},

	isSafari: function ()
	{
		return navigator.userAgent.indexOf( "Safari" ) != -1
			 && navigator.userAgent.indexOf( "Chrome" ) == -1
			 && navigator.userAgent.indexOf( "CriOS" ) == -1;
	},

	isFirefox: function ()
	{
		return navigator.userAgent.indexOf( "Firefox" ) != -1;
   },

   isIE: function ()
   {
      return this.getIEVersion() > 0;
   },

   isOldIE: function ()
   {
      return this.getIEVersion() > 0 && this.getIEVersion() < 12;
   },

	browserIsSafeForEngine: function( cpus )
	{
		//2 + 3;
		//"#IFDEBUG"
		//return true;
		//"#ENDIF"

		var ie = this.getIEVersion();
		var ff = this.getFirefoxVersion();
		var saf = parseFloat( this.getSafariVersion() );

		var safe = this.isChrome() || ie >= 11 || ff >= 54 || saf > 600 || System.canRunWebAssembly();

		// note: iOS reports 2 cpus. 8 is max.

		var nCpus = System.getNCpus();
		if ( !nCpus )
			safe = safe && !System.isMobile();
		else
			safe = safe && System.getNCpus() >= ( cpus || 6 );

		// console.log( "SFE=" + safe );

		return safe;
	},

	isAndroidBrowser: function ()
	{
		return navigator.userAgent.indexOf( "Android" ) >= 0 && navigator.userAgent.indexOf( "Chrome" ) == -1;
	},

	isAndroid: function ()
	{
		return this.getAndroidVersion() > 0.0;
	},

	// hack: Safari Win reports WebSocket in window, but uses a deprecated protocol.
	isSafariOnWindows: function ()
	{
		return navigator.userAgent.indexOf( "Windows" ) >= 0 && navigator.userAgent.indexOf( "Safari" ) >= 0;
	},

	getSafariVersion: function ()
	{
		var ua = navigator.userAgent;
		if ( ua.indexOf( "Safari" ) >= 0 )
		{
			var safariVersion = parseFloat( ua.slice( ua.indexOf( "Safari" ) + 7 ) );
			return safariVersion;
		}
		return 0.0;
	},

	copyToClipboard: function ( txt )
	{
		function fallbackCopyTextToClipboard( text )
		{
			var textArea = document.createElement( "textarea" );
			textArea.value = text;
			document.body.appendChild( textArea );
			textArea.focus();
			textArea.select();
			try
			{
				document.execCommand( 'copy' );
				
			} catch ( x )
			{
			}
			document.body.removeChild( textArea );
		}
		if ( !navigator.clipboard )
		{
			fallbackCopyTextToClipboard( txt );
			return;
		}
		navigator.clipboard.writeText( txt );
	},

	getAndroidVersion: function ()
	{
		var ua = navigator.userAgent;
		if ( ua.indexOf( "Android" ) >= 0 )
		{
			var androidversion = parseFloat( ua.slice( ua.indexOf( "Android" ) + 8 ) );
			return androidversion;
		}
		return 0.0;
	},

	isWebGlCapable: function ( return_context )
	{

		if ( !!window.WebGLRenderingContext )
		{
			var canvas = document.createElement( "canvas" ),
              names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
            context = false;

			for ( var i = 0; i < 4; i++ )
			{
				try
				{
					context = canvas.getContext( names[i] );
					if ( context && typeof context.getParameter == "function" )
					{
						// WebGL is enabled
						if ( return_context )
						{
							// return WebGL object if the function's argument is present
							return { name: names[i], gl: context };
						}
						// else, return just true
						return true;
					}
				} catch ( e ) { }
			}

			// WebGL is supported, but disabled
			return false;
		}

		// WebGL not supported
		return false;
	},

	runsOnChessBaseDomain: function()
	{
      return ( document.URL.search( /chessbase.com/i ) != -1 && document.URL.search( /cloudserver/i ) == -1 )
         || document.URL.search( /playchess.com/i ) != -1
         || document.URL.search( /schach.de/i ) != -1;
	},

	runsOnChessBaseCom: function ()
	{
	//	return document.domain.endsWith( "chessbase.com" );   
		return document.URL.search( /chessbase.com/i ) != -1;
	},

	runsOnLiveChessBaseCom: function ()
	{
		return document.URL.search( /live.chessbase.com/i ) != -1
		    || document.URL.search( /acc.chessbase.com/i ) != -1;
	},

	runsOnVideosChessBaseCom: function ()
	{
	    return document.URL.search( /videos.chessbase.com/i ) != -1
		    || document.URL.search( /videostest.chessbase.com/i ) != -1;
	},

	getDevicePixelRatio: function ()
	{
		return window.devicePixelRatio;
	},

	overrideDeviceZoom: function ( z )
	{
		this.overriddenDeviceZoom = z;
	},

	pixToZoom: function ( n )
	{
		if ( this.overriddenDeviceZoom )
			return n / this.overriddenDeviceZoom;

		if ( window.devicePixelRatio )
			return n / window.devicePixelRatio;
		else
			return n;
	},

	zoomToPix: function ( n )
	{
		if ( this.overriddenDeviceZoom )
			return n * this.overriddenDeviceZoom;

		if ( window.devicePixelRatio )
			return n * window.devicePixelRatio;
		else
			return n;
	},

	getNCpus: function()
	{
		if ( window.navigator.hardwareConcurrency )
			return window.navigator.hardwareConcurrency;
		return 0;
	},

   getDeviceMemory: function ()
   {
      if (navigator.deviceMemory)
         return navigator.deviceMemory;
      return 0;
   },

   getHardwareId: function ()
   {    
      var s = this.getDeviceMemory() + navigator.platform + this.getNCpus() + this.getSystemLanguage() + this.getTimeZone();
      return s;
   },
	// reminder navigator.platform

	browser: {	// could be useful
		detect: function ()
		{
			return {
				browser: this.search( this.data.browser ),
				version: this.search( navigator.userAgent ) || this.search( navigator.appVersion ),
				os: this.search( this.data.os )
			}
		},

		search: function ( data )
		{
			if ( typeof data === "object" )
			{
				// search for string match
				for ( var i = 0; i < data.length; i++ )
				{
					var dataString = data[i].string,
						dataProp = data[i].prop;
					this.version_string = data[i].versionSearch || data[i].identity;
					if ( dataString )
					{
						if ( dataString.indexOf( data[i].subString ) != -1 )
						{
							return data[i].identity;
						}
					} else if ( dataProp )
					{
						return data[i].identity;
					}
				}
			} else
			{
				// search for version number
				var index = data.indexOf( this.version_string );
				if ( index == -1 ) return;
				return parseFloat( data.substr( index + this.version_string.length + 1 ) );
			}
		},
		data: {
			browser: [
			  { string: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36', subString: "Chrome", identity: "Chrome" },
			  // { string: navigator.userAgent, subString: "Chrome", identity: "Chrome" },
			  // { string: navigator.userAgent, subString: "OmniWeb", versionSearch: "OmniWeb/", identity: "OmniWeb" },
			  // { string: navigator.vendor, subString: "Apple", identity: "Safari", versionSearch: "Version" },
			  // { prop: window.opera, identity: "Opera", versionSearch: "Version" },
			  // { string: navigator.vendor, subString: "iCab", identity: "iCab" },
			  // { string: navigator.vendor, subString: "KDE", identity: "Konqueror" },
			  // { string: navigator.userAgent, subString: "Firefox", identity: "Firefox" },
			  // { string: navigator.vendor, subString: "Camino", identity: "Camino" },
			  // { string: navigator.userAgent, subString: "Netscape", identity: "Netscape" },
			  // { string: navigator.userAgent, subString: "MSIE", identity: "Explorer", versionSearch: "MSIE" },
			  // { string: navigator.userAgent, subString: "Gecko", identity: "Mozilla", versionSearch: "rv" },
			  // { string: navigator.userAgent, subString: "Mozilla", identity: "Netscape", versionSearch: "Mozilla" }
			],
			os: [
			  // { string: navigator.platform, subString: "Win", identity: "Windows" },
			  // { string: navigator.platform, subString: "Mac", identity: "Mac" },
			  // { string: navigator.userAgent, subString: "iPhone", identity: "iPhone/iPod" },
			  // { string: navigator.userAgent, subString: "iPad", identity: "iPad" },
			  // { string: navigator.userAgent, subString: "Android", identity: "Android" },
			  // { string: navigator.platform, subString: "Linux", identity: "Linux" }
			  { string: 'Linux x86_64', subString: "Linux", identity: "Linux" }
			]
		}
	}
};

