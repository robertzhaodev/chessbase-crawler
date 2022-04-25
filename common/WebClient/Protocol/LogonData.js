// LogonData, mw 21.2.2013
// ES6 5.3.2020

import { VersionCode, VersionCodeEnum } from "../VersionCode.js";
// import { System } from "../../Tools/System.js";
import { strUtil } from '../../Tools/Tools.js'
import { Language } from "../../Tools/Language.js";
import { WebSockMessage, SockMsgId } from "./WebSockMessage.js";
import { ConnectId } from "../Connection.js";

export var LoginMode =
{
	NORMAL: 1,
	GUEST: 2
};

export var LogoffType =
{
	DEFAULT: 0,
	REMOVE_WATCHER: 1,
	RESIGN: 2,
	ABORT: 3
};

export var LoginFlags = 
{
	YES2CHESS: 32,
	HASWEBSOCKIDS: 128,
	IS_WEAK_GUEST: 1024,
	SPRINT_REQUESTS_NEXT_POS: 2048,
}

//LOGINFLAG_IS_UTF8_NAME = ( 1 << 1 ),
//LOGINFLAG_IS_MANIPULATED = ( 1 << 2 ),
//LOGINFLAG_SLAVE_CONNECTION = ( 1 << 3 ),	// on the connection to the slave in coupled servers
//LOGINFLAG_BRIDGE = ( 1 << 4 ),
//LOGINFLAG_YES2CHESS = ( 1 << 5 ),


export class LogonData
{
	constructor ( strName, strPassword, nLoginMode, guid, token, app )
	{
		this.strName = strName;
		this.strPass = strPassword;
		this.nMode = nLoginMode;
		this.version = /* glApp.versionCode */ new VersionCode( VersionCodeEnum.JSCBONLINE, 5, 5, 0 );
		this.guid = guid;
		this.language = Language.getStrUserLanguage();
		this.codepage = 1252; //System.getWindowsCodePage();
		this.strRoom = "";
		this.strRoomUrl = 'https://google.com'//document.referrer;
		this.token = token || "";
		this.app = app || "";
		this.flags = 0;
		this.documentUrl = "";
	};

	getSocketsMsg( hasSockMsgIds )
	{
		// TODO: Testing only, switch to UTF-8 when server is ready.

		var aMsg = new WebSockMessage( SockMsgId.LOGON );
		aMsg.address( ConnectId.UNKNOWN, ConnectId.SERVER );
		aMsg.getBuf().writeInt32( this.nMode );
		this.version.toDataBuf( aMsg.getBuf() );

		var name = this.strName;
		if ( strUtil.hasASCIIgreater127( name ) && !strUtil.mayBeUtf8( name ) )
		{	name = strUtil.encodeUTF8( name );
		}
		var pass = this.strPass;
		if ( strUtil.hasASCIIgreater127( pass ) && !strUtil.mayBeUtf8( pass ) )
		{
			name = strUtil.encodeUTF8( pass );
		}

		aMsg.getBuf().writeUTFString( name );	// no more conversion
		aMsg.getBuf().writeUTFString( pass );

		this.guid.toDataBuf( aMsg.getBuf() );
		aMsg.getBuf().writeASCIIString( this.language );

		// fake platform
		aMsg.getBuf().writeASCIIString( 'Linux x86_64' );

		aMsg.getBuf().writeInt32( this.codepage );
		aMsg.getBuf().writeUTFString( this.strRoom );
		aMsg.getBuf().writeASCIIString( this.token );
		aMsg.getBuf().writeUTFString( this.strRoom.length > 0 ? this.strRoomUrl : "" );
		aMsg.getBuf().writeASCIIString( this.app );
		
		if ( hasSockMsgIds )
			this.flags |= LoginFlags.HASWEBSOCKIDS;

		aMsg.getBuf().writeInt32( this.flags );

		const fakeAppVersion = '5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36';
		aMsg.getBuf().writeASCIIString( fakeAppVersion );

		aMsg.getBuf().writeASCIIString( this.documentUrl );

		return aMsg;
	};

	setIsBeginner()
	{
		this.flags |= LoginFlags.IS_WEAK_GUEST;
	};

	setRequestsSprintPos()
	{
		this.flags |= LoginFlags.SPRINT_REQUESTS_NEXT_POS;
	};
}