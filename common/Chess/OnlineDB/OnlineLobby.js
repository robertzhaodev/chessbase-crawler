
// NH2020
// <reference path="Protocol/WebSockMessage.js" />

// "use strict";

import { Connector } from "../../WebClient/Connector.js";
import { WebSockMessage } from "../../WebClient/Protocol/WebSockMessage.js";

import { SockMsgId } from "../../WebClient/Protocol/WebSockMessage.js";
import { DataBuffer } from "../../Container/DataBuffer.js";

import { LoginMode } from "common/WebClient/Protocol/LogonData";

// NH2020I Diese Klasse ist dafür da, Anfragen an die OnlineDB zu senden und Antworten zu empfangen
// Eine Suche nach einem Brett wird zum Beispiel über "search" begonnen.

export var OnlineDBUserMsgId =
{
	NONE: 0,

	REQUEST_AUTOCOMPLETE: 1350,
	AUTOCOMPLETE: 1351,

	//CREATETACTICSSESSION: 1352,
	//FINISHTACTICSSESSION: 1353,
	//REQUESTFIRSTPOS: 1354,
	//TACTICSACTION: 1355,
	//TACTICSPOSITION: 1356,
	//TACTICSREPORT: 1357,
	//RESTARTTACTICSSESSION: 1358,
	//DAILYTACTICS: 1359,
	//REQUESTTACTICSCOLLECTION: 1360,
	//TACTICSCOLLECTION: 1361,


	toString:
		function ( n )
		{
			for ( var attr in this )
			{
				if ( this[attr] == n )
					return attr;
			}
			return "Unknown OnlineDBUserMsgId: " + n;
		}
};

export class OnlineLobby extends Connector
{

	constructor ()
	{
		super();

		this.initListeners();

		this.idGroup = 0;
		this.gamesInitialLoad = 50;
		this.firstMove = 0;
		this.name = "OnlineDB";

		// NH2020 put these in constructor, removed OnlineLobby.prototype, added 'this.'
		this.games = [];
		// this.statboard = new Board();
		this.statside = 0;

		// Added this and null
		this.me = null;

		// NH2021 Scroll search
		this.isScrollSearching = false;
		this.gamesScrollLoad = 50;
		this.maxGamesScrollLoad = 500;
		this.gameSearchIndices = [];
	};

	onConnect ()
	{
		this.pingTimer.stop();
		this.logonGuest();
	};

	// NH2020 Added
	hasSockMsgIds ()
	{
		return true;
	};

	// NH2020 Added
	hasSockCheckSum ()
	{
		return true;
	};

	// NH2021 Create a completely new search
	search ( searchMask, maxGames, firstMove )
	{
		var aMsg = new WebSockMessage( SockMsgId.QUERY_ONLINE_DB );

		// Reset Currently Shown Games?
		this.games = [];
		this.games.length = 0;
		searchMask.parseFreeText();
		searchMask.writeToDataBuffer( aMsg.buf );
		this.gamesInitialLoad = maxGames || 50;
		this.firstMove = firstMove || 0;
		this.isScrollSearching = false;
		this.gameSearchIndices = [];

		this.send( aMsg );
	};

	// Same Search Mask, load more games when scroll end is reached
	scrollSearch ()
	{
		let numberOfGamesToSearch = this.gamesScrollLoad > this.gameSearchIndices.length ? this.gameSearchIndices.length : this.gamesScrollLoad;

		if (numberOfGamesToSearch > 0)
		{
			this.isScrollSearching = true;
			this.getGames(this.gameSearchIndices.slice(0, numberOfGamesToSearch));
			this.gameSearchIndices = this.gameSearchIndices.slice(numberOfGamesToSearch);
		}
	}

	// NH2021 Does not seem to happen in OnlineDbReact
	getStatistics ( board, sideToMove )
	{
		//console.log("Get Stats!");

		if ( this.getNId() > 0 )
		{
			// NH2021D
			// if (glApp && glApp.panelMgr.dbBook )
			// 	glApp.panelMgr.dbBook.startupdate();

			this.me = this;

			this.me.statboard = new Board();
			for ( var n = 0; n < 64; n++ )
				this.me.statboard[n] = board[n];
			this.statside = sideToMove;

			var aMsg = new WebSockMessage( SockMsgId.REQUEST_ONLINE_DB_STATISTICS );

			aMsg.buf.beginSizedWrite();
			aMsg.buf.writeByte( sideToMove );
			for ( var i = 0; i < 64; i++ )
				aMsg.buf.writeByte( board[i] );
			aMsg.buf.endSizedWrite();

			this.send( aMsg );
		}
	};

	// NH2021 Does not seem to happen in OnlineDbReact
	getHeaders ( arrIds )
	{
		var aMsg = new WebSockMessage( SockMsgId.REQUEST_ONLINE_DB_HEADERS );

		aMsg.buf.writeUint32( arrIds.length );
		for ( var n = 0; n < arrIds.length; n++ )
		{
			aMsg.buf.writeUint32( arrIds[n] );
		}

		this.send( aMsg );
	};

	getOneGame ( gameNo )
	{
		var aMsg = new WebSockMessage( SockMsgId.REQUEST_ONLINE_DB_GAMES );
		aMsg.setVal( 1 );	// ticket.
		aMsg.buf.writeUint32( 1 );
		aMsg.buf.writeUint32( gameNo );
		this.send( aMsg );
	};

	getGames ( arrIds )
	{
		var aMsg = new WebSockMessage( SockMsgId.REQUEST_ONLINE_DB_GAMES );
		aMsg.setVal( 2 );	// ticket.
		aMsg.buf.writeUint32( arrIds.length );
		for ( var n = 0; n < arrIds.length; n++ )
		{
			aMsg.buf.writeUint32( arrIds[n] );
		}
		this.send( aMsg );
	};

	requestInfo ()
	{
		var aMsg = new WebSockMessage( SockMsgId.REQUEST_ONLINE_DB_USER_INFO );
		this.send( aMsg );
	};

	// Receive a message from the server.
	handleReceived ( sockMsg )
	{
		if ( this.handleReceivedByConnector( sockMsg ) )
			return;

		try
		{
			switch ( sockMsg.getType() )
			{
				default:
					// NH2020 used console.trace
					console.trace( "Unhandled: " + sockMsg.toString() );
					break;

				case SockMsgId.DEFAULTGROUPS:
					this.requestInfo();
					break;
				case SockMsgId.ONLINE_DB_STATISTICS:
					this.handleOnlineStatistics( sockMsg );
					break;
				case SockMsgId.ONLINE_DB_USER_INFO:
					this.handleOnlineDBUserInfo( sockMsg );
					break;
				case SockMsgId.ONLINE_DB_NUMBERS:
					this.handleOnlineDBNumbers( sockMsg );
					break;
				case SockMsgId.ONLINE_DB_GAMES:
					this.handleGames( sockMsg );
					break;
				case SockMsgId.ONLINE_DB_HEADERS:
					this.handleHeaders( sockMsg );
					break;
				case SockMsgId.USER:
					this.handleUserMsg( sockMsg );
					break;
			}
		}
		catch ( x )
		{
			console.log(SockMsgId.toNumString( sockMsg.getType() ), x );
		}
	};

	// NH2021I First Message after search: Carries the IDs of the games found using the search mask
	// These IDs will be used by getGames to search for the specific games
	handleOnlineDBNumbers ( sockMsg )
	{
		var aDB = sockMsg.getBuf();
		var nGames = aDB.readUint32();
		var nTotalFound = aDB.readUint32();

		//console.log("Handle OnlineDB Numbers: ", nGames, nTotalFound);

		// If games have been found: Cycle and add them
		// NH2021 Performance Check: Adding gameIndices for scrollSearch to gameSearchIndices array makes almost no time difference.
		// Creating a new online Entry every time is significantly slower.
		for ( var n = 0; n < nGames && n < this.maxGamesScrollLoad; n++ )
		{
			var nGameNo = aDB.readUint32();
			if ( nGameNo > 0 && n < this.gamesInitialLoad)
			{
				var aEntry = new OnlineEntry();
				aEntry.nFlags = OnlineEntryEnum.FLAGS_ONLINE_ID;
				aEntry.aGameNr = nGameNo;
				this.games.push( aEntry );
				//this.gameSearchIndices.push(nGameNo);
			}
			else if (nGameNo > 0)
				this.gameSearchIndices.push(nGameNo);
		}

		var headersNeeded = [];
		for ( var s = 0; s < this.games.length; s++ )
		{
			if ( this.games[s].nFlags === OnlineEntryEnum.FLAGS_ONLINE_ID )
				headersNeeded.push( this.games[s].aGameNr );
		}

		if ( headersNeeded.length > 0 )
			this.getGames( headersNeeded );
		else
			this.fireOnNoGamesFound(); // NH2020 Added this Callback

		//console.log("Received Indices: ", this.games);

		// NH2020 No Panel Manager anymore... Removed the rest
	};

	// NH2021 Does not seem to happen in OnlineDbReact
	handleHeaders ( sockMsg )
	{

		var aDB = sockMsg.getBuf();

		var newGames = [];

		var nRead = aDB.readUint32();
		for ( var n = 0; n < nRead; n++ )
		{
			aDB.beginSizedRead();
			var nGameNo = aDB.readUint32();
			var aDBGame = new DataBuffer();
			if ( nGameNo > 0 )
			{
				var nSize = aDB.readUint32();
				for ( var s = 0; s < nSize; s++ )
				{
					aDBGame.writeUint8( aDB.readUint8() );
				}
				var aGame = new Game();
				if ( !this.loadHeader( aGame, aDBGame ) )
					break;

				for ( var g = 0; g < this.games.length; g++ )
				{
					if ( this.games[( g + n ) % this.games.length].aGameNr == nGameNo )
					{
						this.games[( g + n ) % this.games.length].aGame.hdr = aGame.hdr;
						this.games[( g + n ) % this.games.length].nFlags = OnlineEntryEnum.FLAGS_ONLINE_HEADER;
						newGames.push( this.games[( g + n ) % this.games.length] );
						break;
					}
				}

			}
			aDB.endSizedRead();
		}

		//console.log("Handled Game Headers: ", newGames);

		this.fireOnGames( newGames );

	};

	handleGames ( sockMsg )
	{

		var aDB = sockMsg.getBuf();
		var nRead = aDB.readUint32();

		// NH2021 This if clause does not seem to happen. Probably only happens for getOneGame, which is not in use in OnlineDB
		if ( nRead == 1 && sockMsg.getVal() == 1 )	// ticket to load a single game.
		{
			//console.log("Handle One Game");
			aDB.beginSizedRead();
			var nGameNo = aDB.readUint32();
			if ( nGameNo > 0 )
			{
				var aGame = new Game();
				if ( this.readGame( aGame, aDB ) )
				{
					console.log('Missing')
				}
			}
			aDB.endSizedRead();
		}
		else
		{
			var games = [];
			for ( var n = 0; n < nRead; n++ )
			{
				aDB.beginSizedRead();
				var nGameNo = aDB.readUint32();
				if ( nGameNo > 0 )
				{
					var game = new Game();
					if ( this.readGame( game, aDB, nGameNo ) )
					{
						games.push(
							{
								aGame: game,
								aGameNr: nGameNo,
								nFlags: OnlineEntryEnum.FLAGS_ONLINE_HEADER | OnlineEntryEnum.FLAGS_ONLINE_GAME
							}
						);
					}
					else
						break;
				}
				aDB.endSizedRead();
			}

			//console.log("Handled Games: ", games);

			if (!this.isScrollSearching)
				this.fireOnGames(games, this.gameSearchIndices.length > 0 ? false : true);
			else
				this.fireOnScrollSearch(games, this.gameSearchIndices.length > 0 ? false : true);
		}
	};

	// NH2021 Does not seem to happen in OnlineDbReact
	handleOnlineStatistics ( sockMsg )
	{
		var aDB = sockMsg.getBuf();

		var pos = new Position();
		for ( var n = 0; n < 64; n++ )
			pos.board[n] = this.me.statboard[n];
		pos.sd = this.me.statside;

		var onlineStats = new OnlineStatistics();
		onlineStats.readFromDataBuffer( aDB, pos );

		this.fireOnStatistics( onlineStats );
	}

	handleOnlineDBUserInfo ( sockMsg )
	{
		this.fireOnIDReceived();

		// NH2020 Previously the first search would be made here.
		// Now, the searches are made via useOnlineLobbyContext
	};

	// NH2021I Handles AutoComplete Information
	handleUserMsg ( sockMsg )
	{
		try
		{
			switch ( sockMsg.getUserType() )
			{
				default:
					// NH2020 UserMsgId from Playchess not defined in OnlineDB
					console.log('Missing')
					//Log.Log( "UserMsg=" + CB.UserMsgId.toString( sockMsg.getUserType() ) )
					break;
				case OnlineDBUserMsgId.AUTOCOMPLETE:
					this.handleAutoComplete( sockMsg );
					break;
			}
		}
		catch ( x )
		{
			// NH2020 UserMsgId from Playchess not defined in OnlineDB
			console.log('Missing')
			//Log.Exception( CB.UserMsgId.toNumString( sockMsg.getUserType() ), x );
		}
	}

	// NH2020 Changed Auto Complete Methods - no need for combo parameter
	requestAutoComplete (name, autoCompleteCallback)
	{
		this.autoCompleteCallbackFn = autoCompleteCallback;
		var request = new GameAutoCompleteRequest( name, GameAutoCompleteEnum.ACR_LASTNAME );
		var aMsg = new WebSockMessage( SockMsgId.USER );

		request.write( aMsg.buf );
		aMsg.setUserType( OnlineDBUserMsgId.REQUEST_AUTOCOMPLETE );
		this.send( aMsg );
	};

	handleAutoComplete ( sockMsg )
	{
		var aMsg = new GameAutoCompleteAnswer();
		aMsg.read( sockMsg.getBuf() );

		this.autoCompleteCallbackFn( aMsg );
	};

	readGame ( aGame, aDB, gameNo )
	{
		try
		{
			return aGame.read2( aDB );
		}
		catch( x )
		{
			console.log( x );
		}
		return false;
	};

	loadHeader ( aGame, aDB )
	{
		try
		{
			aDB.rewind();
			aGame.hdr.read( aDB );
			return true;
		}
		catch( x )
		{
			console.log( "OL-LH:" + x );
		}
		return false;
	};

	handleChat ( sockMsg )
	{
		// NH2020 chat undefined
		console.log('Missing')
		//glApp.panelMgr.chatOut( chat.toString() );
	};

	handleReconnectOk ( sockMsg )
	{
	};

 	initListeners() {
		this.socket.addEventListener('Games', (games) => {
			console.log(games)
		})

		conn.socket.addEventListener('Statistics', (games) => {
			console.log(games)
		})

		conn.socket.addEventListener('NoGamesFound', (games) => {
			console.log(games)
		})

		conn.socket.addEventListener('IDReceived', (games) => {
			console.log(games)
		})

		conn.socket.addEventListener('ScrollSearch', (games) => {
			console.log(games)
		})
        // if ( !OnlineLobby.prototype.fireEvent )
        // {
		// 	ListenersUtil.initForListeners( OnlineLobby );
		// 	ListenersUtil.addEvent( OnlineLobby, "Statistics" );
		// 	ListenersUtil.addEvent( OnlineLobby, "Games" );
		// 	// NH2020 Added these Callbacks
		// 	ListenersUtil.addEvent( OnlineLobby, "NoGamesFound" );
		// 	ListenersUtil.addEvent( OnlineLobby, "IDReceived" );
		// 	ListenersUtil.addEvent( OnlineLobby, "ScrollSearch")
        // }
    }
}
