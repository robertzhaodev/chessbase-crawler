// ClientParams, MW 22.1.2013

import { CBGuid } from "common/Tools/CBGuid.js"
import { System } from "common/Tools/System"
import { DOM } from "common/HTMLDocument/Text"
import { Log } from "common/Tools/Log"
// import { LoginMode } from "common/WebClient/Protocol/LogonData"
// import { Timer } from "common/Tools/Timer"
// import { AccountsManager } from "common/App/AccountsManager"

export class ClientParams 
{
	constructor ( appSeed )
	{
		this.guid = new CBGuid();
		this.userName = "";
		this.password = "";
		this.stayLoggedIn = true;

		var label = "ClientGUID" + appSeed;

		var storage = null;
		var global = window;
		if ( global.localStorage )
			storage = global.localStorage;  // IE10 fucker
		else if ( global.sessionStorage )
			storage = global.sessionStorage;

		if ( storage && storage[label] )
		{
			var jsonGuid = JSON.parse( storage[label] );
			for ( var prop in jsonGuid )
			{
				this.guid[prop] = jsonGuid[prop];
			}
		}
		else
		{
			this.guid = new CBGuid();
			this.guid.fromRandom( appSeed );
			if ( storage )
				storage[label] = JSON.stringify( this.guid );
		}
	}

	toString ()
	{
		return "User=" + this.userName + ", mode=" + this.loginMode;
	};

	saveLogin ()
	{
		this.save( "user", this.userName );
	};

	loadLogin ()
	{
		this.userName = this.load( "user" );
	};

	getSessionStorage ()
	{
		var storage = null;
		var global = window;
		if ( global.sessionStorage )
			storage = global.sessionStorage;
		else if ( global.localStorage )
			storage = global.localStorage;  // IE10 fucker

		return storage;
	};

	storeRoom ( room, roomurl, banner, text )
	{
		this.set( "room", room );
		this.set( "roomurl", roomurl );
		this.set( "banner", banner );
		this.set( "roomtext", text );
	};

	clearRoom ()
	{
		this.set( "room", "" );
		this.set( "roomurl", "" );
		this.set( "banner", "" );
		this.set( "gradient", "" );
		this.set( "roomtext", "" );
		this.set( "tournRoom", "" );
	};

	storeTournRoom ( room )
	{
		this.tournRoom = room;
		this.set( "tournRoom", room );
	}

	storeRegisteredRoom ( id )
	{
		if ( window.localStorage )
			window.localStorage["RegRoom"] = id;
	};

	getRegisteredRoom ()
	{
		if ( window.localStorage )	// across sessions
			return window.localStorage["RegRoom"];
	};

	storeBanner ( banner, gradient )
	{
		this.set( "banner", banner );
		this.set( "gradient", gradient );
	};

	storeSeek ( seek )
	{
		this.set( "seek", seek );
	};

	store ( value, attrib )
	{
		this.getSessionStorage()[attrib] = value;
	};

	get ( attrib )
	{
		return this.getSessionStorage()[attrib] || "";
	};

	set ( _var, _val )
	{
		this.getSessionStorage()[_var] = _val;
	};

	load ( attrib )
	{
		if ( window.localStorage )
			return window.localStorage[attrib] || "";

		return "";
	};

	save ( _var, _val )
	{
		if ( window.localStorage )
			window.localStorage[_var] = _val;
	};

	isKibitz ()
	{
		return this.get( "kibitz" );
	};

	startEngine ()
	{
		if ( System.isMobile() )
			return;

		var layout = this.get( "layout" );
		return layout && layout.search( "engine" ) >= 0;
	};

	hasLayout ()
	{
		return this.get( "layout" );
	};

	shouldDisplayBoardUrls ()
	{
		return this.isKibitz() && this.noRibbons();
	};

	noRibbons ()
	{
		var layout = this.get( "layout" );
		return layout && layout.search( "nomenu" ) >= 0;
	};

	noPlayers ()
	{
		var layout = this.get( "layout" );
		return layout && layout.search( "noplayers" ) >= 0;
	};


	// warning - historical configuration. This function overriden in PlayPluginManager.js createPlugins...
	noLists ()
	{
		//var layout = this.get( "layout" );
		//return layout && layout.search( "nolists" ) >= 0;
		return true;
	};

	receiveSeeksAlways ()
	{
		return false;
	};

	noChat ()
	{
		var layout = this.get( "layout" );
		return layout && layout.search( "nochat" ) >= 0;
	};

	noBook ()
	{
		var layout = this.get( "layout" );
		return layout && layout.search( "nobook" ) >= 0;
	};

	noNota ()
	{
		var layout = this.get( "layout" );
		return layout && layout.search( "nonota" ) >= 0;
	};

	getTournRoom ()
	{
		return this.get( "tournRoom" );
	};


	getRoom ()
	{
		return this.get( "room" );
	};

	getRoomUrl ()
	{
		return this.get( "roomurl" );
	};

	getRoomText ()
	{
		return this.get( "roomtext" );
	};

	getBanner ()
	{
		return this.get( "banner" );
	};

	getGradient ()
	{
		return this.get( "gradient" );
	};

	getPlay ()
	{
		return this.get( "play" );
	};

	isPlay ()
	{
		return this.get( "play" );
	};

	prepareLoginChange ()
	{
		var state =
			{
				banner: this.getBanner(),
				gradient: this.getGradient(),
				room: this.getRoom(),
				roomUrl: this.getRoomUrl(),
			//	regRoom: this.getRegisteredRoom()
			};
		this.keepStateAccrossLogin( state );
	};

	afterLoginChange ()
	{
		var state = this.getStateAcrossLogin();
		if ( state )
		{
			this.resetStateAfterLogin();
			this.storeBanner( state.banner, state.gradient );
		//	this.storeRegisteredRoom( state.regRoom );
		}
	};

	keepStateAccrossLogin ( state )
	{
		var strJson = JSON.stringify( state );
		if ( window.localStorage )
			window.localStorage["AcrossLogin"] = strJson;
	};

	resetStateAfterLogin ( state )
	{
		if ( window.localStorage )
			delete window.localStorage["AcrossLogin"];
	};

	getStateAcrossLogin ()
	{
		if ( window.localStorage )
		{
			var json = window.localStorage["AcrossLogin"];
			if ( json )
				return JSON.parse( json );
		}
	};

	clearLoginCookies ( keepName )
	{
		this.loginToken = "";
		if (!keepName)
		    DOM.clearCookie("AccountName64");
		DOM.clearCookie("AccountToken");
		DOM.clearCookie("AccountMode");
		DOM.setCookie("CBCOMMON", "");
	};

	clearCBCommonCookie ()
	{
		DOM.setCookie( "CBCOMMON", "" );
	};

	rememberLoginToken ()
	{
		if ( this.stayLoggedIn && this.loginToken )
			DOM.setCookie( "AccountToken", this.loginToken );
		else
			Log.LOG( "RememberLoginToken, stayLoggedIn=" + this.stayLoggedIn + "=" + this.loginToken );
	};

	clearLoginToken ()
	{
		DOM.clearCookie( "AccountToken" );
		this.loginToken = "";
	};

	hasUserAndPass ()
	{
		return this.userName && this.userName != "guest" && ( this.loginToken || this.password );
	};

	// NH2021D
	// requestTokenWithPassword ( appName )
	// {
	// 	if ( !this.loginToken && this.password && this.loginMode == LoginMode.NORMAL )
	// 	{
	// 		new Timer( function ()
	// 		{
	// 			new AccountsManager( appName ).pwLogin( this.userName, this.password,
	// 				function ( json )
	// 				{
	// 					if ( json && json.Token )
	// 					{
	// 						var token = unescape( json.Token );
	// 						this.loginToken = token;
	// 						this.rememberLoginToken();
	// 						DOM.setAccountNameCookie( this.userName );
	// 						DOM.setCookie( "AccountMode", LoginMode.NORMAL );
	// 					}
	// 				}.bind( this ) );
	// 		}.bind( this ) ).runOnce( 100 );
	// 	}
	// };
	
}