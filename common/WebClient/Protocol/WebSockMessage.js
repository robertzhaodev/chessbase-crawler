// WebSockMessage, mw 21.2.2013
// ES6 4.3.2020

import { DataBuffer } from '../../Container/DataBuffer.js'
// import { Log } from 'common/Tools/Log';

export var SockMsgId = 
{
   NONE: 0,

   WIN_INVALID_PASSWORD: 17,
   WIN_ACCESS_DENIED: 42,

   ALIVE: 7001,
   LOGON: 7002,
   LOGOFF: 7003,
   YOUR_ID: 7004,
   INVALID_PASSWORD: 7005,
   RECONNECT_OK: 7006,
   CLIENTPING: 7007,
   CLIENTECHO: 7008,
   BINDERTIMEOUT: 7009,
   ALREADYLOGGEDON: 7010,
   FORCE_LOGOFF: 7011,
   INVALIDPASSWORD: 7012,
   YOUR_LOGINTOKEN: 7013,
   ACCOUNT_LOCKOUT: 7014,
   IAMALIVE: 7015,
   LOGIN_OTHER_MACHINE: 7016,
   KICKEDOUT_OTHER_MACHINE: 7017,
	IDLE_CLIENT_LOGOFF: 7018,

   CHAT: 7020,
   STARTTYPINGCHAT: 7021,
   ALERT: 7022,
	PING_BY_NAME: 7023,
	RESPOND_PING_BY_NAME: 7024,

   USER: 7030,

   QUERY_SERVERALIVE: 7040,
   SERVER_IS_ALIVE: 7041,
   TEST: 7042,

   CLIENTLIST: 7050,
   ADDCLIENTS: 7051,
   REMOVECLIENTS: 7052,
   CLIENTDATACHANGE: 7053,
   LISTFRAGMENTRECEIVED: 7054,
   LISTUPDATECHANGE: 7055,
   CLIENTDATACHANGELIST: 7056,
   SESSIONSTATUSCHANGELIST: 7057,
	REQUESTCLIENTLIST: 7058,

   GROUPSTATUSCHANGE: 7060,
   CHANGEGROUP: 7061,
   DEFAULTGROUPS: 7062,

   CHANNELDATA: 7070,
   CHANNELSTATUSCHANGE: 7071,
   REQUESTCHANNELS: 7072,
   JOINCHANNEL: 7073,

   GETBROADCASTURLS: 7074,
   BROADCASTURLS_DATA: 7075,

   GETGEOLEADERBOARD: 7076,
   GEOLEADERBOARD_DATA: 7077,

   GETFRIENDSLEADERBOARD: 7078,
   GETFRIENDSLEADERBOARD_REPLY: 7079,

   REQUEST_STATISTICS: 7080,
   STATISTICS_DATA: 7081,

   RELAYFRIENDSMESSAGE: 7082,
   FRIENDSMESSAGE_DATA: 7083,

   GETACTIVEHLSSTREAMS: 7084,
   GETACTIVEHLSSTREAMS_REPLY: 7085,

   GROUPHTMLCHANGED: 7086,

   REQUESTCLIENTDATA: 7087,
   CLIENTDATA: 7088,

   REQUESTBROADCASTURLSEX:	7089,
   REQUESTBROADCASTURLSEX_DATA: 7090,

   REQUESTGROUPS:7091,
   GROUPSDATA: 7092,

   QUERY_ONLINE_DB: 7100,
   REQUEST_ONLINE_DB_GAMES: 7101,
   REQUEST_ONLINE_DB_HEADERS: 7102,
   REQUEST_ONLINE_DB_STATISTICS: 7103,
   REQUEST_ONLINE_DB_USER_INFO: 7104,
   REQUEST_ONLINE_DB_ADMIN_INFO: 7105,
   ONLINE_DB_NUMBERS: 7106,
   ONLINE_DB_GAMES: 7107,
   ONLINE_DB_HEADERS: 7108,
   ONLINE_DB_STATISTICS: 7109,
   ONLINE_DB_MAINTENANCE: 7110,
   ONLINE_DB_USER_INFO: 7111,
   ONLINE_DB_ADMIN_INFO: 7112,
   MAINTENANCE_ONLINE_DB_UPDATE: 7113,

   PLAYER_BASE_USER: 7200,

   TERABRAIN_USER: 7300,
   TERABRAIN_ERROR: 7301,
   TERABRAIN_MAINTENANCE: 7302,
   REQUEST_TERABRAIN_POSITION: 7303,	//	deprecated
   TERABRAIN_REQUEST: 7304,
   TERABRAIN_ENGINE_SEARCHDATA: 7305,
   TERABRAIN_BOOKINFO: 7306,
   TERABRAIN_TABLEDATA: 7307,

   CLOUD_USER: 7400,
   TRAINING_USER: 7401,
	ANALYSIS_USER: 7402,
	LIVE_USER: 7403,

   toString:
				function ( n )
				{
				   for ( var attr in this )
				   {
				      if ( this[attr] === n )
				         return "SockMsg:" + attr;
				   }
				   return "Unknown SockMsg: " + n;
				},
	toNumString:
			function ( n )
			{
				return "SockMsgId=" + n;
			}
};

export class WebSockMessage 
{
   constructor ( type )
   {
      this.type = type || SockMsgId.NONE;
      this._init();
   };


   getType()
   {
      return this.type;
   };

   setType( type )
   {
   	this.type = type;
   };

   getUserType()
   {
      return this.userType;
   };

   setUserType( t )
   {
      this.userType = t;
   };

   getIdReceiver()
   {
      return this.idReceiver;
   };

   setIdReceiver( idReceiver )
   {
      this.idReceiver = idReceiver;
   };

   getIdSender()
   {
      return this.idSender;
   };

   setIdSender( idSender )
   {
      this.idSender = idSender;
   };

   setVal( val )
   {
      this.nVal = val;
   };

   getVal()
   {
      return this.nVal;
   };

   address( idSender, idReceiver )
   {
      this.idSender = idSender;
      this.idReceiver = idReceiver;
   };

   getBuf()
   {
      return this.buf;
   };

   // NH2020 Added "withCheckSum"
   fillSendArrBuf( withMsgId, withCheckSum )
   {
      // console.log("With Msg ID: " + withMsgId + ", With Check Sum: " + withCheckSum);

      var hdrLen = 16;
      var checkSize = 0;
      if ( withMsgId )
      {
         hdrLen += 4;
         checkSize = withCheckSum ? 2 : 0;   // int16
      }
		var arrBuf = new ArrayBuffer( hdrLen + this.buf.getWriteSize() + checkSize );
      var view = new DataView( arrBuf );

      view.setInt16( 0, this.type );
      view.setInt32( 2, this.nVal );
      view.setInt32( 6, this.idSender );
      view.setInt16( 10, this.userType );
      view.setInt32( 12, this.idReceiver );
      if ( withMsgId )
      {
      	view.setInt32( 16, this.msgId );
         var size = this.buf.writeToDataView( view, 20 );
   //      console.log( "BufSize=" + size );
         if ( withCheckSum )
            view.setInt16( hdrLen + size, this.buf.getCheckSum16() );  // checkSize + magic number to avoid zero check sum.
      }
		else
			this.buf.writeToDataView( view, 16 );

      return arrBuf;


      // NH2020 Old implementation
   	// var hdrLen = 16;
   	// if ( withMsgId )
   	// 	hdrLen += 4;
		// var arrBuf = new ArrayBuffer( hdrLen + this.buf.getWriteSize() );
      // var view = new DataView( arrBuf );
      // view.setInt16( 0, this.type );
      // view.setInt32( 2, this.nVal );
      // view.setInt32( 6, this.idSender );
      // view.setInt16( 10, this.userType );
      // view.setInt32( 12, this.idReceiver );
      // if ( withMsgId )
      // {
      // 	view.setInt32( 16, this.msgId );
      // 	this.buf.writeToDataView( view, 20 );
      // }
		// else
		// 	this.buf.writeToDataView( view, 16 );

      // return arrBuf;
   };

   fromReceiveBuf( arrBuf )
   {
      if ( arrBuf.byteLength >= 16 )
      {
         var view = new DataView( arrBuf );
         this.type = view.getInt16( 0 );
         this.nVal = view.getInt32( 2 );
         this.idSender = view.getInt32( 6 );
         this.userType = view.getInt16( 10 );
         this.idReceiver = view.getInt32( 12 );

         //Log.Log("Received: Type: " + this.type + ", Val: " + this.nVal + ", usrType: " + this.userType + " idrec: " + this.idReceiver);

         if ( arrBuf.byteLength >= 20 )
         {
            this.buf.readFromDataView( view, 16 );
            this.buf.rewind();
         }
      }
      else
      {
         throw ( Error( "Illegal Message received" ) );
      }
   };

   toString()
   {
      var str = "";
      for ( var s in SockMsgId )
      {
         if ( this.type === SockMsgId[s] )
         {
            str += s;
            break;
         }
      }
      if ( this.userType )
      	str += ", usr=" + this.userType;
      str += ", sender=" + this.idSender + ", receiver=" + this.idReceiver;
      if ( this.buf.getSize() )
         str += ", bufsize=" + this.buf.getSize();
      return str;
   };

   // protected= //
   _init()
   {
      this.userType = 0;
      this.idReceiver = 0;
      this.idSender = 0;
      this.nVal = 0;
      this.buf = new DataBuffer();
      this.msgId = 0;
   };

}