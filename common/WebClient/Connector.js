// Connector, mw 13.1.2014

// NH2020
// <reference path="Protocol/WebSockMessage.js" />

// "use strict";

// NH2020
//CB.namespace( "CB.Server.LogOffReason" );

import { RepeatGate, Timer, Tick } from "common/Tools/Timer"
import { strUtil } from "common/Tools/Tools";
import { Connection } from "common/WebClient/Connection"
import { LoginMode } from "common/WebClient/Protocol/LogonData";
import { DOM } from "common/HTMLDocument/Text"
import { lm } from "common/Resources/Localization/Localization";
// import { glApp  } from "common/App/App";
import { System } from "common/Tools/System";
import { LogonData } from "common/WebClient/Protocol/LogonData"
import { Log } from "common/Tools/Log"
import { WebSockMessage, SockMsgId } from "common/WebClient/Protocol/WebSockMessage"
import { ConnectId } from "common/WebClient/Connection";
import { clientParams } from 'index'

export var LogOffReason =
	{
		MAINTENANCE: 0,
		ADMIN_ACTION: 1,
		DOUBLE_LOGIN: 2,
		IDLE_CLIENT: 3,
		VIDEO_BLOCK: 4,
	};

// NH2020
//CB.namespace( "CB.Server.Connector" );

export class Connector
{
	constructor ()
	{
		this.hasIdReceived = false;

		this.pingServerPeriodMS = 12000;
		this.reconnectBaseTime = 5000;
		this.bufferedMsgs = [];
		this.isFirstConn = true;
		this.name = "...";
		this.connectCount = 0;
		this.pingCount = 0;
		this.silentServerPing = true;
		this.logClientEcho = true;

		// NH2020 Added to constructor
		this.gateReconn = new RepeatGate;
		this.gatePing = new RepeatGate();

		this.stupidClosureCompilerBugMsg = {};
		/*
		* @param {number} idReceiver
		*/
	};

	create ( uris, user, pass, mode, token )
	{
	//	CB.LOG( this.getName() + "-CreateConn: " + user + ", mode=" + mode + ",tok=" + token, "LogBold" );

		this.pingTimer = new Timer( this.onServerPingTimeout.bind( this ) );

		this.user = user;
		this.utf8User = strUtil.encodeUTF8( user );
		this.pass = pass;
		this.conn = new Connection( this, uris );
		this.loginMode = mode;
		this.token = token;

		// NH2020 Used Tick.getTick()
		this.pingStart = Tick.getTick();

		this.reconnectTries = 0;
		this.timerReconnect = new Timer();
		this.nMyLagMS = 3000;	// assume bad lag until proven otherwise

		this.conn.onConnectionLoss = this.onConnLoss.bind( this );
		this.conn.onServerDown = this.hdlOnServerDown.bind( this );
		this.boundLoginOk = false;

		//	CB.DOM.setEncode64Cookie( "AccountName64", user );
		if ( mode != LoginMode.GUEST )
			DOM.setAccountNameCookie( user );

		this.periodicPingTimer = new Timer( this.periodicPingHandler.bind( this ) );
	};


	// set this onCannotConnect and onConnectionBroken from the GUI to handle conn problems
	hdlOnServerDown ( conn )
	{
		if ( this.onServerDown !== undefined )
			this.onServerDown();
		this.hasIdReceived = false;
	};

	onConnLoss ( conn )
	{
		if ( this.onConnBroken !== undefined )
			this.onConnBroken();
		this.hasIdReceived = false;
		this.onServerNotAlive();
	};

	getName ()
	{
		return "Connector"; 
	};

	connectUser ( user, pass, mode, token )
	{
	//	CB.LOG( this.getName() + "-ConnUser: " + user + ", mode=" + mode + ",tok=" + token, "LogBold" );

		if ( this.pingTimer )
			this.pingTimer.stop();
		this.forcedLogOff = false;
		this.userLoggedOff = false;

		this.pingTimer = new Timer( this.onServerPingTimeout.bind( this ) );

		if ( this.isConnected() && this.hasIdReceived )
			this.logOff();
		this.onChangeLogin();

		this.user = user;
		this.utf8User = strUtil.encodeUTF8( this.user );
		this.pass = pass;
		this.token = token;
		this.loginMode = mode;
		// NH2020 Used Tick.getTick()
		this.pingStart = Tick.getTick();

		this.reconnectTries = 0;
		this.timerReconnect = new Timer();
		this.nMyLagMS = 3000;	// assume bad lag until proven otherwise
		new Timer( this.connectFresh() ).runOnce( 100 );	// some time for log off message

		if ( mode != LoginMode.GUEST )
			DOM.setAccountNameCookie( user );
	};

	reconnectUser ()
	{
	//	CB.LOG( "ReconnectUser: " + this.user + ", mode=" + this.loginMode + ",tok=" + this.token, "LogBold" );

		this.gateReconn.exec( function ()
		{
			this.loginMode = this.pass ? LoginMode.NORMAL : LoginMode.GUEST;
			this.connectUser( this.user, this.pass, this.loginMode, this.token );
			this.reconnectTries++;
			this.timerReconnect.stop();
		}.bind( this ), this.reconnectTries * 10 );
	};

	connectFresh ()
	{
	//	CB.LOG( "ConnectFresh: " + this.user + ", mode=" + this.loginMode + ",tok=" + this.token, "LogBold" );

		this.conn.close();
		this.hasIdReceived = false;
		this.connect();
	};

	connect ()
	{
		if ( this.conn )
		{
			this.hasIdReceived = false;
			this.boundLoginOk = false;

			//CB.LOG( "ConnectConnect: " + this.user + ", mode=" + this.loginMode + ",tok=" + this.token, "LogBold" );

			//"#IFDEBUG"
			//CB.LOG( "connect() " + this.conn.uris[0] );
			//"#ENDIF"

         	this.conn.close();
			this.conn.open();

			if ( !this.isSilent() )
				this.statusMsg( lm.CONNECTING, "LogBold" );
			this.periodicPingTimer.runPeriodic( this.pingServerPeriodMS );
			this.connectCount++;
		}
	};

	isConnected ()
	{
		if ( this.conn )
			return this.conn.isConnected();
		return false;
	};

	isConnecting ()
	{
		if ( this.conn )
			return this.conn.isConnecting();

		return false;
	};

	isLoggedIn ()
	{
		return this.boundLoginOk && this.isConnected();
	};

	wasLoggedIn ()
	{
		return !this.isFirstConn && !this.isConnected();
	};

	hasSockMsgIds ()
	{
		return false;
	};

	hasSockCheckSum ()
	{
		return false;
	};

	logonGuest ()
	{

		//	CB.LOG( "ConnectorAsGuest: " + this.loginMode, "LogBold" );
		if ( !this.isSilent() )
		{
			this.logIntoChat( this.getWaitForServerMsg(), "LogGreen", "conn" );
			this.statusMsg( this.getWaitForServerMsg(), "LogGreen", "conn" );
		}
		var guid = /* glApp.clientParams */ clientParams.guid;
		// console.log(clientParams.guid);

		if ( System.runsInIFrame() )
		{
			guid.fromRandom( 10 );	// several iframes in one browser, liveBlitz or embedded broadcasts.
		}
		//CB.LOG( guid );
		var aLogonData = this.createLogonData( guid, true /*guest*/ );
		this.modifyLoginData( aLogonData );
		this.sendNoId( aLogonData.getSocketsMsg( this.hasSockMsgIds(), this.hasSockCheckSum() ) );
		this.userLoggedOff = false;
	};

	logon ()
	{
		if ( !this.hasIdReceived )
		{
		//	CB.LOG( "ConnectorLogOn:" + this.user + " " + this.loginMode, "LogBold" );

			this.boundLoginOk = false;	// login cycle with bound server completed, usually handleDefaultGroups message
			if ( !this.isSilent() )
			{
				this.logIntoChat( this.getWaitForServerMsg(), "LogGreen", "conn" );
				this.statusMsg( this.getWaitForServerMsg(), "LogGreen", "conn" );
			}
			var guid = /* glApp.clientParams */ clientParams.guid;
			//CB.LOG( guid );
			var aLogonData = this.createLogonData( guid, false /*guest*/ );
			this.modifyLoginData( aLogonData );
			this.sendNoId( aLogonData.getSocketsMsg( this.hasSockMsgIds(), this.hasSockCheckSum() ) );
			this.userLoggedOff = false;
		}
	};

	modifyLoginData ( ld )
	{

	};

	createLogonData ( guid, isGuest )
	{
		if ( isGuest )
			return new LogonData( "Guest", "Pass", LoginMode.GUEST, guid );
		else
			return new LogonData( this.user, this.pass, LoginMode.NORMAL, guid, this.token );
	};

	clearLoginCookies ()
	{
		if ( /* glApp.clientParams */ clientParams )
			/* glApp.clientParams */ clientParams.clearLoginCookies( true /*keep name*/);
	};

	getWaitForServerMsg ()
	{
		return "Waiting for Server";
	};

	logOff ()
	{
		Log.Log( this.name + " - ConnectorLogOff:" + this.user + " " + this.loginMode, "LogBold" );

		if ( this.periodicPingTimer )
		{
			this.periodicPingTimer.stop();
		}
		if ( this.hasIdReceived && this.isConnected() )
		{
			var aMsg = new WebSockMessage( SockMsgId.LOGOFF );
			aMsg.address( this.conn.connectId, ConnectId.SERVER );
			aMsg.buf.writeInt32( 0 );	// default log off
			this.send( aMsg );
			this.loginMode = LoginMode.GUEST;
		}
		this.onLogOff();
	};

	onLogOff ()
	{
		if ( this.periodicPingTimer )
		{
			this.periodicPingTimer.stop();
		}
		this.boundLoginOk = false;
		this.hasIdReceived = false;
		this.userLoggedOff = true;
	};

	onChangeLogin ()
	{
	};

	changeLogin ()
	{
	//	CB.LOG( "ConnectorChangeLogin:" + this.user + " " + this.loginMode, "LogBold" );

		//	if ( this.hasIdReceived )	// reset by invalidPassword...
		{
			if ( /* glApp.clientParams */ clientParams && /* glApp.clientParams */ clientParams.prepareLoginChange )
				/* glApp.clientParams */ clientParams.prepareLoginChange();	// keep stuff across the login
			this.logOff( true /* keep cookies */ );

			// NH2021D
			//window.location.replace( glApp.getLoginUrl() );    // no back button
		}
	};

	handleBinderTimeout ()
	{
		this.logIntoChat( "Sorry, cannot reach the " + this.name + "server. It is in maintenance. Please try again in 15 minutes.", "LogBold" );
		this.conn.close();

		// MW, TODO: think about this.
		this.clearLoginCookies();
	};

	pingServer ( silentPing, period, force )
	{
		if ( this.forcedLogOff )
		{
			this.statusMsg( lm.PLEASE_LOGIN_SHORT );
			return;
		}

		if ( this.conn && this.conn.error && !this.conn.isConnected() )
		{
			this.connect();
		}

		if ( !this.hasIdReceived && !force )
			return;

		if ( this.pingCount++ > 50 )
			return;

		this.gatePing.exec( function ()
		{
			// glApp.panelMgr.showMessage( "Ping Server..." )
		//	CB.LOG( "Ping Server..." );
			this.sendSimple( SockMsgId.QUERY_SERVERALIVE );
			if ( !silentPing )
				this.logIntoChat( "Testing Connection to Server" );
			// NH2020 Used Tick.getTick()
			this.pingStart = Tick.getTick();
			if ( !this.pingTimer.isActive() )
				this.pingTimer.runOnce( period || 6000 );
			this.silentServerPing = silentPing;

			this.periodicPingTimer.runPeriodic( this.pingServerPeriodMS );

		}.bind( this ), 500 );
	};

	onServerPingTimeout ()
	{
		// glApp.panelMgr.showMessage( "Server Timeout" );
		if ( !this.isSilent() )
			this.statusMsg( lm.RECONNECT );
		this.connect();
	};

	periodicPingHandler ()
	{
		var silentMS = this.conn.weAreAliveTicker.getExpiredMS();
		if ( silentMS > this.getMaxConnSilenceMS() )
		{
			this.pingServer( true /*silent*/, this.getConnTimeOutMS(), true /*force*/ );
			if ( silentMS > this.getMaxConnSilenceMS() + this.periodicPingTimer.getTimeoutMs() )
			{
				this.onServerNotAlive( silentMS );
			}
		}
	};

	onServerNotAlive ( ms )
	{
	};

	getConnTimeOutMS ()
	{
		return 6000;
	};

	getMaxConnSilenceMS ()
	{
		return 20000;
	};

	handleServerIsAlive ( msg )
	{
		// console.log("Server is alive: " + this.name);
		// NH2020 Used Tick.getTick()
		var millis = Tick.getTick() - this.pingStart;
		this.nMyLagMS = millis / 2;
		if ( !this.silentServerPing )
		{
			this.logIntoChat( "Ping=" + millis + "ms" );

			// NH2021D
			// if ( glApp.chessAudio )
			// 	glApp.chessAudio.onPing();

			if ( !this.isSilent() )
				this.statusMsg( "Server OK" );
		}
		if ( this.onServerAlive )
			this.onServerAlive( millis );
		this.pingTimer.stop();
	//	CB.LOG( "Alive: " + millis + "ms" );
		// glApp.panelMgr.showMessage( "Ping=" +millis + "ms" )
		this.pingCount = 0;
	};

	handleAreYouAlive ()
	{
		this.sendSimple( SockMsgId.IAMALIVE );
	};

	pingPlayer ( idReceiver )
	{
		this.sendSimple( SockMsgId.CLIENTPING, idReceiver );
		// NH2020 Used Tick.getTick()
		this.pingStart = Tick.getTick();
	};

	pingPlayerByName ( name )
	{
		var aMsg = new WebSockMessage( SockMsgId.PING_BY_NAME );
		aMsg.address( this.conn.connectId, ConnectId.SERVER );
		aMsg.buf.writeASCIIString( name );
		this.send( aMsg );
		// NH2020 Used Tick.getTick()
		this.pingStart = Tick.getTick();
	};

	handleRespondPingByName ( msg )
	{
		var name;
		name = msg.getBuf().readASCIIString( 200 );
		// var id = msg.getBuf().readInt();
	};

	handleForceLogoff ( msg )
	{
	//	CB.LOG( "ConnectorForcedLogOff:" + this.user + " " + this.loginMode, "LogError" );

		this.conn.tryTimer.stop();
		var reason = msg.getBuf().readInt32();
		var explain = "Possibly for maintenance.";

		// NH2020 Changed Removed CB.Server
		switch( reason )
		{
			default:
				break;
			case LogOffReason.ADMIN_ACTION:
				explain = "Administrator action.";
				break;
			case LogOffReason.MAINTENANCE:
				explain = "Planned server maintenance in progress.";
				break;
			case LogOffReason.DOUBLE_LOGIN:
				explain = "Double Login.";
				break;
			case LogOffReason.IDLE_CLIENT:
				explain = "User inactive.";
				break; 
			case LogOffReason.VIDEO_BLOCK:
				explain = "Video blocked";
				break;
		}

		// NH2021D
		// if ( !glApp.config.silentServers )
		// 	this.displayForceLogOffMsg( explain );
		
		this.forcedLogOff = true;
		this.onLogOff();
	};

	displayForceLogOffMsg( txt )
	{
		this.statusMsg( "Server logged you off: " + txt, "LogForceLogOff" );
	}

	notifyUserActivity ()
	{
	};

	getNId ()
	{
		return this.conn.connectId;
	};

	getNIdBound ()
	{
		if ( this.idBound !== undefined )
			return this.idBound;
		return 0;
	};

	isGuest ()
	{
		if ( this.client )
			return this.client.isGuest();

		if ( this.loginMode == LoginMode.NORMAL && this.hasIdReceived )
			return false;

		return true;
	};

	isPremium ()
	{
		if ( !this.isGuest )
			return this.client.isPremium();

		return false;
	};

	signalOnConnect ()
	{

	};

	onConnect ()
	{
		// console.log("ON CONNECT "  + this.name);
		this.signalOnConnect();
		this.reconnectBaseTime = 5000;	// reset after longer values (for testing)

		this.pingTimer.stop();

		if ( this.loginMode == LoginMode.NORMAL /* NH2021D && !glApp.forceGuestLogon() */ )
		{
			this.logon();
		} else
		{
			this.logonGuest();
		}
	};

	idReceived ( yourId )
	{
		// Log.Log( this.name + " - idReceived: " + yourId.nId, "", "conn" );
		this.hasIdReceived = true;
		this.reconnectTries = 0;
		this.timerReconnect.stop();
		this.isFirstConn = false;
		this.accountType = yourId.accountType;

		if (yourId.dailyResources)
		{
			/* glApp.clientParams */ clientParams.MaxVideoGroupSessions = yourId.dailyResources.nGroupVideoSessions;
			/* glApp.clientParams */ clientParams.MaxVideoGroupMinutes = yourId.dailyResources.nGroupVideoQuarters*15;
			// remove next part after chessserver + webbridge is restarted
			if (/* glApp.clientParams */ clientParams.MaxVideoGroupSessions === 0 && /* glApp.clientParams */ clientParams.MaxVideoGroupMinutes === 0)
			{
				/* glApp.clientParams */ clientParams.MaxVideoGroupSessions = 5;
				/* glApp.clientParams */ clientParams.MaxVideoGroupMinutes = 60;
			}
		}

		if ( yourId.strToken && !/* glApp.clientParams */ clientParams.loginToken )
		{
			/* glApp.clientParams */ clientParams.loginToken = yourId.strToken;
			/* glApp.clientParams */ clientParams.rememberLoginToken();
		}

		if ( yourId.strUserId && yourId.strUserId.toLowerCase() != "guest" )
		{
			this.user = strUtil.decodeUTF8( yourId.strUserId );
			/* glApp.clientParams */ clientParams.userName = this.user;
			this.utf8User = yourId.strUserId;

			if ( this.loginMode == LoginMode.NORMAL )
				DOM.setCodedCookie( "AccountBackName64", this.user );
		}

		//var browser = CB.System.browser.detect();
		//this.logIntoChat( browser.os + " " + browser.version + " " + browser.browser );
		//this.logIntoChat( navigator.userAgent );

		// Warning: onIdReceived is not a good hook, because this is not the id of the bound server.
		// Just the id of the web bridge.
		this.onIdReceived( yourId );

		// NH2021D
		// if ( glApp.panelMgr.onLoggedIn )
		// 	glApp.panelMgr.onLoggedIn( this.loginMode == LoginMode.NORMAL );

		this.bufferedMsgs.forEach( function ( msg )
		{
			this.send( msg );
		}.bind( this ) );
		this.bufferedMsgs = [];
	};

	onIdReceived ()
	{
	};

	handleReceivedByConnector ( sockMsg )
	{
		var bHandled = true;
		//		try
		{
			switch ( sockMsg.getType() )
			{
				default:
					bHandled = false;
					break;
				case SockMsgId.ALIVE:
					this.handleAreYouAlive( sockMsg );
					break;
				case SockMsgId.BINDERTIMEOUT:
					this.handleBinderTimeout();
					break;
				case SockMsgId.INVALID_PASSWORD:
				case SockMsgId.INVALIDPASSWORD:
					this.handleInvalidPassword();
					break;
				case SockMsgId.ACCOUNT_LOCKOUT:
					this.handleAccountLockout();
					break;
				case SockMsgId.ALREADYLOGGEDON:
					this.onAlreadyLoggedOn();
					break;
				case SockMsgId.LOGIN_OTHER_MACHINE:
					this.onLoginOtherMachine();
					break;
				case SockMsgId.KICKEDOUT_OTHER_MACHINE:
					this.onKickedOutOtherMachine();
					break;

				case SockMsgId.SERVER_IS_ALIVE:
					this.handleServerIsAlive( sockMsg );
					break;
				case SockMsgId.CLIENTPING:
					this.handleClientPing( sockMsg );
					break;
				case SockMsgId.CLIENTECHO:
					this.handleClientEcho( sockMsg );
					break;
				case SockMsgId.RESPOND_PING_BY_NAME:
					this.handleRespondPingByName( sockMsg );
					break;
				case SockMsgId.FORCE_LOGOFF:
					{
						this.handleForceLogoff( sockMsg );
					} break;
				case SockMsgId.YOUR_LOGINTOKEN:
					this.handleLoginToken( sockMsg );
					break;
				case SockMsgId.IDLE_CLIENT_LOGOFF:	// handled in ForceLogoff, reason = idle
				//	this.logIntoChat( "Log off - user not active", "LogBold" );
					break;
				case SockMsgId.CHECKSUM_ERROR:
					this.handleCheckSumError( sockMsg );
					break;
			}
		}
		//catch ( x )
		//{
		//	this.logIntoChat( "Problem: " + x.toString(), "LogException" );
		//	//	alert( "Exception: " + x.toString() );
		//}
		return bHandled;
	};


	handleCheckSumError ( msg )
	{
		//var type = msg.getUserType();
		//var utype = msg.getIntVal();
		console.log( "Checksum error." );
		//if ( this.prevMsg && type === this.prevMsg.getType() && utype === this.prevMsg.getUserType() )
		//{
		//	this.send( this.prevMsg, true, false /*store prev*/ );
		//	delete this.prevMsg;
		//}
	}

	handleInvalidPassword ()
	{
		this.statusMsg( "Sorry, your account '" + this.user + "' or your password is not valid.", "LogError" );
		//		alert( this.user + "/" + this.token );
		this.hasIdReceived = false;
		//	this.conn.close();
		this.clearLoginCookies();
		this.pingTimer.stop();
		this.periodicPingTimer.stop();

		if ( this.onInvalidPassword )
			this.onInvalidPassword();
		else
			alert( "Sorry, your password is not valid" );

	};

	handleAccountLockout ()
	{
		this.statusMsg( "Sorry, your account is currently locked. Please wait one hour...", "LogError" );
		this.hasIdReceived = false;
		this.clearLoginCookies();
		alert( "Account currently locked." );
	};

	handleLoginToken ( sockMsg ) // send e.g. by bridge on SendOnBinderIDReceived
	{
		var nBoundId = sockMsg.getBuf().readInt32();
		var strToken = sockMsg.getBuf().readASCIIString( 200 );
		this.token = strToken;
		this.accountType = sockMsg.getBuf().readInt32();
		var strUserId = sockMsg.getBuf().readASCIIString( 200 );
		Log.Log( "nBoundId=" + nBoundId + ", token=" + strToken + ", account=" + this.accountType, "LogBlue", "conn" );
		/* glApp.clientParams */ clientParams.loginToken = strToken;
		if ( strUserId )
		{
			this.user = /* glApp.clientParams */ clientParams.userName = strUtil.decodeUTF8( strUserId );
			this.utf8User = strUserId;
		}
		/* glApp.clientParams */ clientParams.rememberLoginToken();
		DOM.setCookie( "AccountMode", "1" );
		if ( this.onLoginToken )
			this.onLoginToken( strToken );
	};

	onAlreadyLoggedOn ()
	{
		this.statusMsg( "Already logged on: " + this.user + ". Please log off or wait a few minutes.", "LogBold" );
		alert( "Already logged on: " + this.user );

		// NH2020 ToolButtonsUndefined
		Log.WillItWork();
		// if ( CB.ToolButtons )
		// 	CB.ToolButtons.hideBusyMask();
	};

	onKickedOutOtherMachine ()
	{
		//	alert( this.user + ":\nYou have been logged off on another browser/machine" );

		// NH2020 ToolButtonsUndefined
		Log.WillItWork();
		// if ( CB.ToolButtons )
		// 	CB.ToolButtons.hideBusyMask();
	};

	onLoginOtherMachine ()
	{
		//	alert( this.user + ":\nYou logged in successfully from another browser/machine\n" );

		// NH2020 ToolButtonsUndefined
		Log.WillItWork();
		// if ( CB.ToolButtons )
		// 	CB.ToolButtons.hideBusyMask();


		this.timerReconnect.stop();
		this.periodicPingTimer.stop();
	};
	
	manageAccount ()
	{
		Log.Missing();
		// NH2021D
		// // current chess server not ready yet
		// //	"#IFDEBUG"
		// if ( this.hasIdReceived )
		// {
		// 	this.logOff();
		// 	window.location.replace(
		// 		glApp.getManageAccountUrl()
		// 		+ "?user=" + /* glApp.clientParams */ clientParams.userCoded
		// 		+ "&token=" + /* glApp.clientParams */ clientParams.loginToken );
		// }
		// //	"#ENDIF"
	};

	isSilent ()
	{
		return true;	// all are silent with the exception of play.chessbase.com
	};

	logIntoChat ( text, style, code )
	{
//		CB.LOG( "Chat: " + text, style );

		// NH2021D
		// if ( !this.isSilent() )
		// {
		// 	if ( style === undefined )
		// 		style = "LogIntoChat";
		// 	if ( glApp.panelMgr.chatOut && text )
		// 		glApp.panelMgr.chatOut( text.toString(), style, code );
		// }
	};

	statusMsg ( text, style, code )
	{
		// NH2021D
		// if ( glApp.panelMgr.statusMsg )
		// 	glApp.panelMgr.statusMsg( text );
		// else
		// 	this.logIntoChat( text, style, code );
	};

	handleClientPing ( sockMsg )
	{
	//	CB.LOG( "PING from " + sockMsg.getIdSender() + " (" + this.lists.clientNameMap[sockMsg.getIdSender()] + ")", "clsPing" );
		this.sendSimple( SockMsgId.CLIENTECHO, sockMsg.getIdSender() );
	};

	handleClientEcho ( sockMsg )
	{
		// NH2020 Used Tick.getTick()
		var millis = Tick.getTick() - this.pingStart;
		var str = "Ping " + this.lists.clientNameMap[sockMsg.getIdSender()] + "=" + millis + "ms";
		if ( this.logClientEcho )
			this.logIntoChat( str );
		console.log( str );
	
		this.pingTimer.stop();
		//	glApp.chessAudio.onPing();

		// NH2020 removed Debug
		// "#IFDEBUG"
		// 	this.handleContinuousSelfEcho( millis );
		// "#ENDIF"

		if ( this.fnOnClientEcho && sockMsg.getIdSender() != this.getNIdBound() )
			this.fnOnClientEcho( sockMsg.getIdSender() );

		return millis;
	};

	handleContinuousSelfEcho ( millis )
	{

	};

	sendSimple ( idMsg, idReceiver )
	{
		// this code clumsy to avoid minifaction bug of Google Closure Compiler

		this.stupidClosureCompilerBugMsg = new WebSockMessage( idMsg );
		var recv = idReceiver;
		if ( !recv )
			recv = ConnectId.SERVER;
		this.stupidClosureCompilerBugMsg.address( this.getNId(), recv );
		this.send( this.stupidClosureCompilerBugMsg );
	};

	// Sends a message to the server.
	send ( msg, bufferIfError )
	{
		if ( this.forcedLogOff || this.userLoggedOff )
			return;

		try
		{
			if ( msg.getIdSender() == 0 )
				msg.setIdSender( this.getNId() );

			//if ( msg.getIdSender() == 0 )
			//	CB.LogException( "Sender null in send", "Type=" + msg.getType() + ", u=" + msg.getUserType() );

			if ( msg.getIdReceiver() == 0 )
				msg.setIdReceiver( ConnectId.SERVER );

			// protocol change: newer protocol sends a socket nMsgId 
			// this is announced in a LogonData flag.

			// Log.Log("HAS SOCK MESSAGE IDS, HAS CHECKSUM " + this.hasSockMsgIds() + ", " + this.hasSockCheckSum());
			this.conn.sendMessage( msg, !this.hasSockMsgIds(), !this.hasSockCheckSum() );

			if ( this.conn.error )
			{
				this.statusMsg( this.name + " not connected...", "LogCAPError" );
			}
			else
				this.prevMsg = msg;

			if ( this.conn.error && bufferIfError )
				this.bufferedMsgs.push( msg );
			if ( !this.conn.isConnected() )
			{
				console.log("Not Connected Init Reconnect");
				this.initiateReconnect();
			}

		}
		catch ( e )
		{
			Log.Log( e.toString() );
			this.initiateReconnect();
		}
	};

	sendNoId ( msg )
	{
		try
		{
			if ( msg.getIdSender() == 0 )
				msg.setIdSender( this.getNId() );
			if ( msg.getIdReceiver() == 0 )
				msg.setIdReceiver( ConnectId.SERVER );
			this.conn.sendMessage( msg, true /*noId*/, true /*noCheck*/ );
			if ( !this.conn.isConnected() )
				this.initiateReconnect();
		}
		catch ( e )
		{
			Log.Log( e.toString() );
			this.initiateReconnect();
		}
	};

	initiateReconnect ()
	{
		if ( !this.timerReconnect.isActive() && !this.inTorture )
		{
		    Log.Log( this.name + " initiate reconn." );
			this.timerReconnect.runOnce( Math.min( 60 * 1000, this.reconnectBaseTime + this.reconnectTries * 1000 ),
				function ()
				{
					this.pingServer( true /*silent*/ );
				}.bind( this ) );
			this.reconnectTries++;
			if ( this.reconnectTries == 3 )
			{
				this.onDisconnectAlarm();
			}
		}
	};

	onDisconnectAlarm()
	{

	};

}
