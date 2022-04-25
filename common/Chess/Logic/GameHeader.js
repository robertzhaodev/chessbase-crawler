// ST, 2011
// ES 6 MW: Feb 28, 2020

import { createReadFactory } from "../../Container/DataBuffer.js";
import { CBDate } from "../../Tools/CBDate.js";

export var GameResultEnum =
{
	GAME_UNFINISHED: -1,
	BLACK_WINS: 0,
	DRAW: 1,
	WHITE_WINS: 2,
	LINE: 3,
	UNDEFINED_RESULT: 3,
	UNDEFINED: 3,	

	isFinished: function ( n )
	{
		return n >= this.BLACK_WINS && n <= this.WHITE_WINS;
	},

	toString:
		function ( n )
		{
			switch ( n )
			{
				case this.GAME_UNFINISHED:
					//return lm.IN_PROGRESS;
					return "in progress";
				case this.WHITE_WINS:
					return "1 \u2013 0"; // NH2020 added spaces for more consistent display
				case this.BLACK_WINS:
					return "0 \u2013 1"; // NH2020 added spaces for more consistent display
				case this.DRAW:
					//	return "\u0189\u2013\u0189";
					return "\u00BD\u2013\u00BD";
					//	return "1/2";
				case this.UNDEFINED_RESULT:
					return "";
				default:
					return "";
			}
		},

	fromString:
		function ( str )
		{
			switch ( str )
			{
				default:
					return "...";
				case "\u00BD\u2013\u00BD":
				case "1/2-1/2":
				case "1/2":
					return this.DRAW;
				case "1\u20130":
				case "1-0":
					return this.WHITE_WINS;
				case "0\u20131":
				case "0-1":
					return this.BLACK_WINS;
			}
		}
};

export class GameResult
{
	constructor( n )
	{
		this.n = n;
	};

	isFinished()
	{
		return GameResultEnum.isFinished( this.n );
	};

	toString()
	{
		return GameResultEnum.toString( this.n );
	};

	toPGNString()
	{
		switch( this.n )
		{
			default:
				return "*";
			case GameResultEnum.WHITE_WINS:
				return "1-0";
			case GameResultEnum.BLACK_WINS:
				return "0-1";
			case GameResultEnum.DRAW:
				return "1/2-1/2";
		}
	};
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export class GameHeader
{
	constructor ()
	{
		this.white = new PlayerData();
		this.black = new PlayerData();
		this.event = new EventData();

		this.player = [this.white, this.black];

		this.result = GameResultEnum.LINE;
		this.clockParams = null;

		this.annotator = "";
		this.round = 0;
		this.subRound = 0;
		this.board = 0;
		this.eco = "";
		this.result = GameResultEnum.LINE;
		this.eloWh = 0;
		this.eloBl = 0;

		// NH2020 assuming CBDate
		this.date = new CBDate();
	
		this.clockParams = null;
	}

	getStrPlayers( withElo, firstNameLen )
	{
		var w = this.white.getListStr( firstNameLen || 0  );
		var b = this.black.getListStr( firstNameLen || 0 );

		var ret;
		if ( b && b.length )
		{
			if ( withElo )
			{
				ret = w;
				if ( this.eloWh > 0 )
					ret += " (" + this.eloWh + ")";
				ret += " - ";
				ret += b;
				if ( this.eloBl > 0 )
					ret += " (" + this.eloBl + ")";
			}
			else
				ret = w + "-" + b;
		} else
		{
			ret = w;
		}

		return ret;
	};

	toString()
	{
		var strEvent = this.event.toString();
		var strDate = this.date.toLocaleString();
		var str = this.getStrPlayers( true /*elo*/, 999 );
		if ( strEvent )
			str += ", " + strEvent;
		if ( strDate )
			str += " " + strDate;

		return str;
	};

	getWhite()
	{
		return this.white.toString();
	};

	getClockParams()
	{
		return this.clockParams;
	};

	setClockParams(_clockParams)
	{
		this.clockParams = _clockParams;
	};

	setWhite( _val )
	{
		this.white.init( _val );
	};

	getBlack()
	{
		return this.black.toString();
	};

	setBlack( _val )
	{
		this.black.init( _val );
	};

	getECO()
	{
		return this.eco;
	};

	setECO( _val )
	{
		this.eco = _val;
	};

	getEvent()
	{
		return this.event.event;
	};

	setEvent( _val )
	{
		this.event.event = _val;
	};

	getAnnotator()
	{
		return this.annotator;
	};

	setAnnotator( _val )
	{
		this.annotator = _val;
	};

	getSite()
	{
		return this.event.site;
	};

	setSite( _val )
	{
		this.event.site = _val;
	};

	isDefined()
	{
		return this.getWhite() || this.getBlack();
	};

	getResult()
	{
		return this.result;
	};

	getCBResult()
	{
		return new GameResult( this.result );
	};

	setResult( _val )
	{
		var ret = this.result;
		if ( typeof _val != "undefined" )
			this.result =  _val;
		else
			this.result = GameResultEnum.LINE;

		return ret;
	};

	setRoundStr( _str )
	{
		if ( _str )
		{
			var rnds = _str.split( "." );
			this.round = parseInt( rnds[0], 10 );
			if ( rnds.length > 1 )
				this.subRound = parseInt( rnds[1], 10 );
		}
	};

	getRoundStr()
	{
		var strRes = "";
		if ( this.round )
		{
			strRes = "" + this.round;
			if ( this.subRound )
				strRes = strRes + "." + this.subRound;
		}
		return strRes;
	};

	getEloWhite()
	{
		return this.eloWh;
	};

	setEloWhite( _val )
	{
		this.eloWh = _val;
	};

	getEloBlack()
	{
		return this.eloBl;
	};

	setEloBlack( _val )
	{
		this.eloBl = _val;
	};

	getMaxElo()
	{
		return Math.max( this.eloWh, this.eloBl );
	};

	setDateStr( _val )
	{
		this.date = CBDate.fromPGNString( _val );
	};

	getLocaleDateStr()
	{
		return this.date.toLocaleString();
	};

	getDateStr()
	{
		return this.date.toPGNString();
	};

	setDeleted( deleted )
	{
		this.deleted = deleted;
		if ( deleted )
			this.flags = this.flags | 1;
		else
			this.flags = this.flags & ~1;
	};

	read( _buf )
	{
		this.white = PlayerData.readFactory( _buf );	// deliberately no catch for OnlineLobby loadGames
		this.black = PlayerData.readFactory( _buf );

		try
		{
			this.event = EventData.readFactory( _buf );

			/*var src =*/ SourceData.readFactory( _buf );

			this.annotator = AnnotatorData.readFactory( _buf ).name;

			this.eloWh = _buf.readShort();
			this.eloBl = _buf.readShort();

			this.nEco = _buf.readUint16();
			this.eco = GameHeader.ECOtoString( this.nEco );
			this.result = GameHeader.readResult( _buf );

			this.date = new CBDate();
			var dt = _buf.readInt();
			this.date.constructFromNum( dt );
			this.plyCount = _buf.readShort();

			this.round = _buf.readByte();
			this.subRound = _buf.readByte();

			//2 reserved
			_buf.readInt();
			_buf.readInt();

			//teams
			_buf.skipSizedRead();
		}

		catch( x )
		{
			console.log( x );
			return false;
		}


		return true;
	};


	// naming convention:
	compactFromDataBuf( buf )
	{
		buf.beginSizedRead();

		this.eType = buf.readInt16();
		this.nGame = buf.readInt32();

		this.white = PlayerData.readFactory( buf );
		this.black = PlayerData.readFactory( buf );
		this.event = EventData.readFactory( buf );

		this.eloWh = buf.readInt16();
		this.eloBl = buf.readInt16();

		this.result = GameHeader.readResult( buf );

		this.date = new CBDate();
		this.date.fromDataBuf( buf );
		this.plyCount = buf.readInt16();
		this.round = buf.readByte();
		this.subRound = buf.readByte();

		/*var annoAttr = */buf.readUint32();
		/*var bigAttr = */ buf.readUint32();

		this.nEco = buf.readUint16();

		this.eco = GameHeader.ECOtoString( this.nEco );

		this.flags = buf.readUint16();
		this.deleted = !!( this.flags & 1 );

		buf.endSizedRead();
	};

	compactToDataBuf( buf )
	{
		buf.beginSizedWrite();

		if ( this.eType !== undefined )
			buf.writeInt16( this.eType );
		else
			buf.writeInt16( 1 );	// HT_GAME

		if ( this.nGame !== undefined )
			buf.writeInt32( this.nGame );
		else
			buf.writeInt32( 0 );

		this.white.write( buf );
		this.black.write( buf );
		this.event.write( buf );

		buf.writeShort( this.eloWh );
		buf.writeShort( this.eloBl );

		GameHeader.writeResult( this.result, buf );

		if ( this.date === undefined )
			this.date = new Date( 0 );
		this.date.toDataBuf( buf );

		if ( this.plyCount )
			buf.writeInt16( this.plyCount );
		else
			buf.writeInt16( 0 );
		buf.writeByte( this.round );
		buf.writeByte( this.subRound );

		buf.writeUint32( 0 );	// annoAttr
		buf.writeUint32( 0 );	// bigAttr

		if ( this.nEco )
			buf.writeUint16( this.nEco );
		else
			buf.writeUint16( 0 );

		if ( this.flags === undefined )
			this.flags = 0;
		if ( this.deleted )
			this.flags = this.flags | 1;
		buf.writeUint16( this.flags );

		buf.endSizedWrite();
	};

	write( _buf )
	{
		this.white.write( _buf );
		this.black.write( _buf );
		this.event.write( _buf );

		new SourceData().write( _buf );
		new AnnotatorData( this.annotator ).write( _buf );

		_buf.writeShort( this.eloWh );
		_buf.writeShort( this.eloBl );

		var eco = 0;
		_buf.writeShort( eco );

		GameHeader.writeResult( this.result, _buf );

		var dt = 0;
		_buf.writeInt( dt );
		if ( this.plyCount )
			_buf.writeShort( this.plyCount );
		else
			_buf.writeShort( 0 );

		_buf.writeByte( this.round );
		_buf.writeByte( this.subRound );

		//2 reserved
		_buf.writeInt( 0 );
		_buf.writeInt( 0 );

		//teams

		_buf.beginSizedWrite();
		_buf.endSizedWrite();
		//_buf.doSizedWrite(
		//  function ( _bufTmp ) {
		////NIX DA SCHREIBEN
		//}
		//);

	};

	static readResult = function ( _buf )
	{
		var res = _buf.readByte();
		_buf.readByte();
		_buf.readByte();
		return res;
	};

	static writeResult = function ( _res, _buf )
	{
		_buf.writeByte( _res );
		_buf.writeByte( 0 );
		_buf.writeByte( 0 );
	};

	static ECOtoString = function ( nClass )
	{
		var i;
		var pClass = "";
		i = nClass >> 7;
		if ( ( i > 0 ) && ( i <= 500 ) )
		{
			i--;
			pClass = String.fromCharCode( "A".charCodeAt() + i / 100 )[0];
			i %= 100;
			pClass += String.fromCharCode( "0".charCodeAt() + i / 10 )[0];
			pClass += String.fromCharCode( "0".charCodeAt() + i % 10 )[0];
			i = nClass & 127;
			if ( i )
			{
				pClass += '/';
				if ( i >= 100 )
				{
					pClass += '9';
					pClass += '9';

				} else
				{
					pClass += String.fromCharCode( "0".charCodeAt() + i / 10 )[0];
					pClass += String.fromCharCode( "0".charCodeAt() + i % 10 )[0];

				}
			}
		} else
			pClass = "";
		return pClass;
	};

	toJson()
	{
		return {
			gameNo: this.nGame,
			white: this.white.getListStr( 1 ),
			black: this.black.getListStr( 1 ),
			event: this.event.event,
			date: this.date.getYear(),
			result: GameResultEnum.toString( this.result ),
			elow: this.eloWh,
			elob: this.eloBl,
			eco: this.eco,
			round: this.round,
			subRound: this.subRound,
			plyCount: this.plyCount,
			flags: this.flags
		}
	};

	matchesFilterVal( filterVal )
	{
		if ( this.white.last.search( filterVal ) !== -1 )
			return true;
		if ( this.black.last.search( filterVal ) !== -1 )
			return true;
		if ( this.event.site.search( filterVal ) !== -1 )
			return true;
		if ( this.event.event.search( filterVal ) !== -1 )
			return true;

		return false;
	};
}

//////////////////////////////////////////////////////////

export class PlayerData
{
	constructor ( _first, _last )
	{
		if ( _first )
		{
			this.first = _first;
		} else
		{
			this.first = "";
		}

		if ( _last )
		{
			this.last = _last;
		} else
		{
			this.last = "";
		}
	};

	toString()
	{
		if ( this.first && this.first.length && this.last && this.last.length )
			return `${this.first}, ${this.last}`;
		else
			return this.last || this.first;
	};

	// NH2020 Added Space in new Function
	// getListStr( lenFirst )
	// {
	// 	if ( lenFirst && this.first && this.last && this.first.length && this.last.length )
	// 	{
	// 		return this.last + "," + this.first.substr( 0, lenFirst );
	// 	}
	// 	else
	// 		return this.last || this.first;
	// };

	// NH2020 Changed function to return break between first and last name
	// getListStr( lenFirst )
	// {
	// 	if ( lenFirst && this.first && this.last && this.first.length && this.last.length )
	// 	{
	// 		return this.last + ", " + this.first.substr( 0, lenFirst );
	// 	}
	// 	else
	// 		return this.last || this.first;
	// };

	getListStr( lenFirst )
	{
		if ( lenFirst && this.first && this.last && this.first.length && this.last.length )
		{
			// if (this.last.length < 10)
				return this.last + "\n" + this.first.substr( 0, lenFirst );
			// else
			// 	return this.last.substr(0, 9) + "...\n" + this.first.substr( 0, lenFirst );		
		}
		else
			return this.last || this.first;
	};

	static g_splitOnComma = true;
	static g_splitOnSpace = false;

	init( _strFull )
	{
		if ( PlayerData.g_splitOnComma )
		{
			var arrPartsColon = _strFull.split( ',' );
			if ( arrPartsColon.length === 2 )
			{
				this.first = arrPartsColon[1].trim();
				this.last = arrPartsColon[0].trim();
				return;
			}
		}
		if ( PlayerData.g_splitOnSpace )
		{
			var arrPartsSpace = _strFull.split( ' ' );
			if ( arrPartsSpace.length > 1 )
			{
				this.first = arrPartsSpace[0];
				this.last = arrPartsSpace.slice( 1 ).join( " " );

				return;
			}
		}

		this.last = _strFull;
		this.first = "";
	};

	static create = function ( _strFull )
	{
		var res = new PlayerData();
		res.init( _strFull );
		return res;
	};

	read( _buf )
	{
		this.last = _buf.readByteLenASCIIString( 50 );
		this.first = _buf.readByteLenASCIIString( 50 );

		this.last = this.last.trim();
		this.first = this.first.trim();
	};

	static readFactory = createReadFactory( PlayerData );

	write( _buf )
	{
		_buf.writeByteLenASCIIString( this.last );
		_buf.writeByteLenASCIIString( this.first );
	};
}



//////////////////////////////////////////////////////////////////////////////////////////////////////

export class EventData
{
	constructor ()
	{
		this.site = "";
		this.event = "";
		this.dt = 0;
		this.type = 0;
		this.nation = 0;

		this.category = 0;
		this.flags = 0;

		this.rounds = 0;
	};

	read( _buf )
	{
		this.site = _buf.readByteLenASCIIString( 100 );
		this.event = _buf.readByteLenASCIIString( 100 );
		this.dt = _buf.readInt();
		this.type = _buf.readShort();
		this.nation = _buf.readShort();

		this.category = _buf.readByte();
		this.flags = _buf.readByte();

		this.rounds = _buf.readShort();
	};

	static readFactory = createReadFactory( EventData );

	write( _buf )
	{
		_buf.writeByteLenASCIIString( this.site );
		_buf.writeByteLenASCIIString( this.event );
		_buf.writeInt( this.dt );
		_buf.writeShort( this.type );
		_buf.writeShort( this.nation );

		_buf.writeByte( this.category );
		_buf.writeByte( this.flags );

		_buf.writeShort( this.rounds );
	};

	toString()
	{
		var str = this.event;
		if ( this.site && this.event && this.site !== this.event )
			str += " ";
		if ( this.site !== this.event )
			str += this.site;

		return str;
	};

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export class SourceData
{
	constructor ()
	{
		this.source = "";
		this.publisher = "";
		this.pubdt = 0;
		this.verdt = 0;
		this.version = 0;
		this.quality = 0;
	};

	read( _buf )
	{
		this.source = _buf.readByteLenASCIIString( 100 );
		this.publisher = _buf.readByteLenASCIIString( 100 );
		this.pubdt = _buf.readInt();
		this.verdt = _buf.readInt();
		this.version = _buf.readByte();
		this.quality = _buf.readByte();
	};

	static readFactory = createReadFactory( SourceData );

	write( _buf )
	{
		_buf.writeByteLenASCIIString( this.source );
		_buf.writeByteLenASCIIString( this.publisher );
		_buf.writeInt( this.pubdt );
		_buf.writeInt( this.verdt );
		_buf.writeByte( this.version );
		_buf.writeByte( this.quality );
	};
}


//////////////////////////////////////////////////////////////////////////////////////////////////

export class TeamData
{
	constructor()
	{
		this.team = "";
		this.num = 0;
		this.seasoned = 0;
		this.nation = 0;
	};

	toString()
	{
		if ( this.num )
			return String.formatEx( "{team} {num}", this );
		return this.team;
	};

	read( _buf )
	{
		this.team = _buf.readByteLenASCIIString( 100 );
		this.num = _buf.readShort();
		this.seasoned = _buf.readByte();
		this.nation = _buf.readByte();
	};

	static readFactory = createReadFactory( TeamData );

	write( _buf )
	{
		_buf.writeByteLenASCIIString( this.team );
		_buf.writeShort( this.num );
		_buf.writeByte( this.seasoned );
		_buf.writeByte( this.nation );
	};
}


//////////////////////////////////////////////////////////////////////////////////////////////////

export class AnnotatorData
{

	constructor ( _name )
	{
		this.name = "";
		if ( _name )
			this.name = _name;
	};


	toString()
	{
		return this.name;
	};

	read( _buf )
	{
		this.name = _buf.readByteLenASCIIString( 100 );
	};

	static readFactory = createReadFactory( AnnotatorData );

	write( _buf )
	{
		_buf.writeByteLenASCIIString( this.name );
	};
}

//////////////////////////////////////////////////////////////////////////////////////////////////

