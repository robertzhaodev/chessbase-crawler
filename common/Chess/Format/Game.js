// ES 6 MW: Feb 27, 2020

import { strUtil } from 'common/Tools/Tools'
import { Square } from 'common/Chess/Logic/Chess'
import { createReadFactory } from 'common/Container/DataBuffer'
import { Language } from 'common/Tools/Language'
import { TimeTools } from 'common/Tools/Tools'
import { Move } from 'common/Chess/Logic/Move'
import { DataBuffer } from 'common/Container/DataBuffer'

export var AnnoType = {
	POSTTEXT: 2,
	SYMBOL: 3,
	SQUARE_LIST: 4,
	ARROW_LIST: 5,
	DIAGRAM: 6,
	TIME: 7,
	DATE: 8,
	TRAINING: 9,
	//	gap for 6 additional annotypes with big flag

	BIGMAX: 16,
	AUDIO: 16,        		//	16		//	no big flag necessary
	PICTURE: 17,         		//	17
	VIDEO: 18,          		//	18
	GAME_QUOTATION: 19, 		//	19		//	embedded game format
	PAWN_STRUCT: 20,			//	20		//	UCHAR colour/both (white/black/both)
	PIECE_PATH: 21,				//	21		//	UCHAR square, or squarelist!
	MIDDLEGAME_CLASS: 22,		//	22		//	LONG, to be specified
	ENDGAME_CLASS: 23,			//	23		//	LONG, to be specified
	CRITICAL_POS: 24,			//	24		//	UCHAR, to be specified
	CORR: 25,						//	25
	STREAM: 26,					// 26		// ab Fritz8 Texte mit Link auf WMV Dateien
	// für CB8 zum anlegen; 
	//	im Moment nur interne Verwendung in Texten, setzt im Header AA_STREAM (02.03.2005)
	CHESS_VARIANT: 27,			//	27		//	ab Fritz 9 für andere Schachvarianten

	//	gap for 4 additional annotypes reflected in header

	MAX: 32,
	CAPTION: 32,			// 32
	FRITZ_EVAL: 33,				// 33
	MOVE_MEDAL: 34,				//	34		//	ULONG, medal for single move, only USHORT used now
	COLOR: 35,					//	35
	TIME_CONTROL: 36,			//	36		//	used in Fritz 7 to store the time control
	SYNC: 37,						//	37		//	snychronization stream/board
	EVAL_PROFILE: 38,
	//	gap for 90 additional internal annotypes


	//	interne Verwendung
	AUDIO_STREAM: 127,			// 127	// ab CB9 Texte mit Link auf WMA Dateien;
	//	im Moment nur interne Verwendung in Texten, setzt im Header AA_STREAM (02.03.2005)

	GENERIC: 0x7f,
	ANNO_BITS: 0x7f,
	PRE_BIT: 0x80,

	toString:
		function( n )
		{
			for ( var attr in this )
			{
				if ( this[ attr ] === n )
					return "AnnoType: " + attr;
			}
			return "Unknown AnnoType: " + n;
		}
};

export var AnnoMarkType =
{
	NONE: 0,
	GOOD: 1,
	BAD: 2,
	VERY_GOOD: 3,
	VERY_BAD: 4,
	INTERESTING: 5,
	DUBIOUS: 6,
	ONLY_MOVE: 8,
	ZUGZWANG: 22,
	MYMOVE: 165,
	IMPORTANT: 166,
	WHITE: 167,
	BLACK: 168,
	BOTH: 169,
};

export var AnnoEvalType =
{
	NONE: 0,

	EQUAL: 11,
	UNCLEAR: 13,
	BLACK_SLIGHTLY_BETTER: 15,
	BLACK_BETTER: 17,
	BLACK_WINS: 19,

	WHITE_WINS: 18,
	WHITE_BETTER: 16,
	WHITE_SLIGHTLY_BETTER: 14,

	COMPENSATION: 44,
	COUNTERPLAY: 132,
	INITIATIVE: 36,
	ATTACK: 40,
	ZEITNOT: 138,
	DEVELOPMENT: 32,
	NOVELTY: 146,
};

export var TextType =
{
	TT_ANSI: 0,
	TT_RTF: 1,
	TT_HTML: 2,
	TT_TOKEN: 3,
	TT_JSON: 4
};

AnnoType.PRETEXT = AnnoType.PRE_BIT | AnnoType.POSTTEXT;
AnnoType.PRE_SQUARE_LIST = AnnoType.PRE_BIT | AnnoType.SQUARE_LIST;
AnnoType.PRE_ARROW_LIST = AnnoType.PRE_BIT | AnnoType.ARROW_LIST;

export var Medal =
{
	BESTGAME: 0x0001,
	TOURN_DECISIVE: 0x0002,
	SAMPLE_OPENING: 0x0004,
	IMPORTANT_NOVELTY: 0x0008,
	PAWNSTRUCTURE: 0x0010,
	STRATEGY: 0x0020,
	TACTICS: 0x0040,
	ATTACK: 0x0080,
	DEFENSE: 0x0100,
	SACRIFICE: 0x0200,
	MATERIAL: 0x0400,
	PIECEPLAY: 0x0800,
	ENDGAME: 0x1000,
	TACTICAL_BLUNDER: 0x2000,
	STRATEGICAL_BLUNDER: 0x4000,
	USER: 0x8000
};

export var AnnoFactory = {};

AnnoFactory.factory = function( _type )
{
	if ( _type in this )
	{
		var func = this[ _type ];
		return new func();
	}
	return null;
};

export class AnnoRec
{
	static readHeader( _buf )
	{
		return {
			inxMv: _buf.readBEInt24(),
			type: _buf.readByte(),
			len: _buf.readBEInt16()
		};
	}

	static writeHeader( buf, inxMv, type, len )
	{
		buf.writeBEInt24( inxMv );
		buf.writeByte( type );
		buf.writeBEInt16( len );
	};

	static ANNO_HEAD_SIZE = 6;
}


///////////////////////////////////////////////////////////////////////////////////////////////
// TextAnno

export class TextAnno 
{
	constructor( _str )
	{
		this.textType = TextType.TT_ANSI;

		if ( _str )
			this.m_str = _str;
		else
		{
			this.m_str = "";
		}
	}

	//TextAnno.prototype = new AnnoRec();

	getString()
	{
		return this.m_str;
	}

	setString( _str )
	{
		this.m_str = _str;
	}

	toString()
	{
		return this.m_str;
	};

	addText( str )
	{
		this.m_str += str;
	};

	write( buf, type )
	{
		var len = AnnoRec.ANNO_HEAD_SIZE + 2 + this.m_str.length;
		buf.writeUint16( len );
		AnnoRec.writeHeader( buf, 0, type /*AnnoType.POSTTEXT*/, len );
		buf.writeByte( this.textType || TextType.TT_ANSI ); // TT_ANSI
		buf.writeByte( 0 );	// LID_DEF
		buf.writeSizedString( this.m_str );
	};

	read( _annoLen, _buf )
	{
		this.textType = _buf.readByte();
		_buf.readByte();
		this.m_str = _buf.readSizedString( _annoLen - 2 );
		if ( strUtil.mayBeUtf8( this.m_str ) )
		{
			this.m_str = strUtil.decodeUTF8( this.m_str );
		}
	};
}

AnnoFactory[ AnnoType.POSTTEXT ] = TextAnno;
AnnoFactory[ AnnoType.PRETEXT ] = TextAnno;

///////////////////////////////////////////////////////////////////////////////////////////////
// SymbolsAnno

export class SymbolsAnno extends Array
{
	toString()
	{
		return "syms";
	};

	isExclusiveMark( s )
	{
		return s >= 1 && s <= 6;
	}

	isExclusiveEval = function( s )
	{
		return ( s >= 11 && s <= 19 ) || s === 44;	// 44 is unclear
	}

	addSymbol( symbol )
	{
		for ( var i = 0; i < this.length; i++ )
		{
			if ( ( this.isExclusiveMark( this[ i ] ) && this.isExclusiveMark( symbol ) )
				|| ( this.isExclusiveEval( this[ i ] ) && this.isExclusiveEval( symbol ) ) )	// convention: add same symbol means removing it:
			{
				if ( symbol !== this[ i ] )
					this.push( symbol );
				this.splice( i, 1 );

				return;
			}
		}
		for ( let i = 0; i < this.length; i++ )
		{
			if ( symbol === this[ i ] )
			{
				this.splice( i, 1 );
				return;
			}
		}
		this.push( symbol );
	};

	hasExclusiveEval( symbol )
	{
		for ( var i = 0; i < this.length; i++ )
		{
			if ( symbol === this[ i ] && this.isExclusiveEval( symbol ) )
				return true;
		}
		return false;
	};

	getEval()
	{
		for ( var i = 0; i < this.length; i++ )
		{
			if ( this.isExclusiveEval( this[ i ] ) )
				return this[ i ];
		}
		return 0;
	};

	removeMyMoveMark()
	{
		for ( var i = 0; i < this.length; i++ )
		{
			if ( this[ i ] === AnnoMarkType.MYMOVE )
			{
				this.splice( i, 1 );
				return;
			}
		}
	}


	write( _buf )
	{
		//var cnt = 0;
		//for ( var i in this )
		//{
		//	if ( this.hasOwnProperty( i ) )
		//		cnt++;
		//}

		var len = AnnoRec.ANNO_HEAD_SIZE + this.length;
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.SYMBOL, len );

		for ( var i = 0; i < this.length; i++ )
		{
			_buf.writeByte( this[ i ] );
		}
	};

	read( length, _buf )
	{
		//this.length = _buf.readByte();
		for ( var inx = 0, len = length; inx < len; ++inx )
		{
			this.push( _buf.readByte() );
		}
	}
}

AnnoFactory[ AnnoType.SYMBOL ] = SymbolsAnno;

///////////////////////////////////////////////////////////////////////////////////////////////
// ColSq, ColArrow Anno

export var BoardColor = {
	NONE: 0,
	GREEN: 1,
	YELLOW: 2,
	RED: 3,

	TRANSYELLOW: 4
}

BoardColor.fromChar = function( _ch )
{
	switch ( _ch )
	{
		case 'R':
			return BoardColor.RED;
		case 'Y':
			return BoardColor.YELLOW;
		case 'G':
			return BoardColor.GREEN;
		default:
			return BoardColor.NONE;
	}
}

BoardColor.fromString = function( _str )
{
	switch ( _str )
	{
		case 'R':
		case 'LR':
			return BoardColor.RED;
		case 'Y':
			return BoardColor.YELLOW;
		case 'LG':
		case 'G':
			return BoardColor.GREEN;
		default:
			return BoardColor.GREEN;
		//	return BoardColor.NONE;
	}
}

BoardColor.toChar = function( _col )
{
	switch ( _col )
	{
		default:
			return 'X';
		case BoardColor.RED:
			return 'R';
		case BoardColor.YELLOW:
			return 'Y';
		case BoardColor.GREEN:
			return 'G';
	}
}

export class ColSq
{
	constructor( _fld, _col )
	{
		this.field = _fld;
		this.color = _col;
	}

	static STRING_LEN = 3;

	init( _strVal )
	{
		this.color = BoardColor.GREEN;
		this.field = Square.A1;

		if ( _strVal.length === 4 )
		{
			this.color = BoardColor.fromString( _strVal.substring( 0, 2 ) );
			this.field = Square.fromString( _strVal.substring( 2, 4 ) );
		}
		else if ( _strVal.length === 3 )
		{
			this.color = BoardColor.fromChar( _strVal[ 0 ] );
			this.field = Square.fromString( _strVal.substring( 1 ) );
		}

	}

	static readFactory = createReadFactory( ColSq );

	read( _buf )
	{
		this.color = _buf.readByte();
		this.field = _buf.readByte();
		this.color--;
		this.field--;
	};

	write( _buf )
	{
		_buf.writeByte( this.color + 1 );
		_buf.writeByte( this.field + 1 );
	};

	toString()
	{
		return BoardColor.toChar( this.color ) + Square.toString( this.field );
	};

	getColour()
	{
		// just the frames: ... less transparent:
		switch ( this.color )
		{
			default:
				return 'black';
			case BoardColor.GREEN:
				return 'hsla( 120, 65%, 50%, 0.75 )';
			case BoardColor.YELLOW:
				return 'hsla( 60, 65%, 50%, 0.8 )';
			case BoardColor.RED:
				return 'hsla( 0, 65%, 50%, 0.75 )';
		}

		// old technique: whole square
		//switch ( this.color )
		//{
		//	case 1 /*HC_GREEN*/:
		//		return 'rgba( 10, 255, 10, 0.6 )';
		//	case 2 /* HC_YELLOW*/:
		//		return 'rgba( 255, 255, 10, 0.6 )';
		//	case 3 /* HC_RED*/:
		//		return 'rgba( 255, 10, 10, 0.6 )';

		//}
	}
}

export class ColSqAnno extends Array
{
	read( length, _buf )
	{
		for ( var n = 0; n < length / 2; n++ )
		{
			var aSq = new ColSq( 0, 0 )
			aSq.read( _buf );
			this.push( aSq );
		}
	};

	write( _buf )
	{
		var len = AnnoRec.ANNO_HEAD_SIZE + this.length * 2;
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.SQUARE_LIST, len );

		for ( var n = 0; n < this.length; n++ )
		{
			this[ n ].write( _buf );
		}
	};

	toString( _sep )
	{
		if ( !_sep )
			_sep = ',';
		return this.join( _sep );
	};
}

AnnoFactory[ AnnoType.SQUARE_LIST ] = ColSqAnno;

export class ColArrow
{
	constructor( _from, _to, _col )
	{
		this.from = _from;
		this.to = _to;
		this.color = _col;
	};

	static STRING_LEN = 5;

	init( _strVal )
	{
		this.from = Square.fromString( _strVal.substring( 1, 3 ) );
		this.to = Square.fromString( _strVal.substring( 3, 5 ) );
		this.color = BoardColor.fromChar( _strVal[ 0 ] );
	};

	static readFactory = createReadFactory( ColArrow );

	read( _buf )
	{
		this.color = _buf.readByte();
		this.from = _buf.readByte();
		this.to = _buf.readByte();
		this.color--;
		this.from--;
		this.to--;
	};

	write( _buf )
	{
		_buf.writeByte( this.color + 1 );
		_buf.writeByte( this.from + 1 );
		_buf.writeByte( this.to + 1 );
	};

	toString()
	{
		return BoardColor.toChar( this.color );/* + 5Field.toString( this.from ) + Field.toString( this.to )*/
	};

	getColour()
	{
		switch ( this.color )
		{
			default:
				return 'black';
			case BoardColor.GREEN:
				return 'hsla( 120, 70%, 50%, 0.90 )';
			case BoardColor.YELLOW:
				return 'hsla( 50, 75%, 65%, 0.90 )';
			case BoardColor.RED:
				return 'hsla( 1, 85%, 45%, 0.90 )';
		}
	}
}

export class ColArrowAnno extends Array
{
	read( length, _buf )
	{
		for ( var n = 0; n < length / 3; n++ )
		{
			var anArrow = new ColArrow();
			anArrow.read( _buf );
			this.push( anArrow );
		}
	}

	write( _buf )
	{
		var len = AnnoRec.ANNO_HEAD_SIZE + this.length * 3;
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.ARROW_LIST, len );

		for ( var n = 0; n < this.length; n++ )
		{
			this[ n ].write( _buf );
		}
	}

	toString( _sep )
	{
		if ( !_sep )
			_sep = ',';
		return this.join( _sep );
	}
}

AnnoFactory[ AnnoType.ARROW_LIST ] = ColArrowAnno;
AnnoFactory[ AnnoType.DIAGRAM ] = TextAnno;

///////////////////////////////////////////////////////////////////////////////////////////////
// EvalAnno

export class EvalAnno
{
	constructor( _eval, _depth )
	{
		this.eval = 0.0;
		this.depth = 0;

		if ( _eval )
			this.eval = _eval;
		if ( _depth )
			this.depth = _depth;
	}

	toString()
	{
		return this.eval + "/" + this.depth;
	}

	read( len, buf )
	{
		this.eval = buf.readInt16();
		this.type = buf.readInt16();
		this.depth = buf.readInt16();
	}
}

AnnoFactory[ AnnoType.FRITZ_EVAL ] = EvalAnno;


///////////////////////////////////////////////////////////////////////////////////////////////
// TimeAnno

export class TimeAnno
{
	constructor( time )
	{
		this.time = time || 0;
	}

	getString()
	{
		var h = this.time >> 24,
			m = ( this.time >> 16 ) & 0xff,
			s = ( this.time >> 8 ) & 0xff,
			cs = this.time & 0xff;

		var str = "";
		if ( h > 0 )
			str = h + ":";
		if ( m > 0 )
		{
			if ( m < 10 && str.length > 0 )
				str += "0";
			str += m + ":";
		}
		if ( s < 10 && str.length > 0 )
			str += "0";
		if ( m == 0 && h === 0 && s < 10 )
		{
			str += s;
			var centis = Math.floor( cs / 10 );
			if ( centis > 0 )
				str += "." + centis;
		} else
		{
			var secs = Math.round( s + cs / 50 );
			if ( secs === 60 )
				secs = 59;
			str += secs;
		}
		return str;
	};

	fromCentiSecs( centiSecs )
	{
		this.time = TimeTools.getCBTimeOfCentiSecs( centiSecs );
	};

	toString()
	{
		return "Time: " + Math.round( this.getTimeIn100th() / 100 ) + "s";
	};

	read( len, buf )
	{
		this.time = buf.readBEInt32();
		//	LOG( "TimeAnno=" + this.getTimeIn100th() );
	};

	write( _buf )
	{
		var len = AnnoRec.ANNO_HEAD_SIZE + 4;
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.TIME, len );
		_buf.writeBEInt32( this.time );
	};

	getTimeIn100th()
	{
		var h = this.time >> 24,
			m = ( this.time >> 16 ) & 0xff,
			s = ( this.time >> 8 ) & 0xff,
			cs = this.time & 0xff;

		//	LOG( "TimeAnno, h=" + h + ", m=" + m + ", s=" + s );
		return 360000 * h
			+ 6000 * m
			+ 100 * s
			+ cs;
	}
}

AnnoFactory[ AnnoType.TIME ] = TimeAnno;

///////////////////////////////////////////////////////////////////////////////////////////////
// TimeControlAnno

export class TimeControlAnno
{
	toString()
	{
		return "TC=NOTIMPL";
	};

	read( len, buf )
	{
		for ( var n = 0; n < len; n++ )
		{
			buf.readByte();
		}
	}
}

AnnoFactory[ AnnoType.TIME_CONTROL ] = TimeControlAnno;

///////////////////////////////////////////////////////////////////////////////////////////////
// SyncAnno

export class SyncAnno
{
	constructor()
	{
		this.data = [];
	};

	toString()
	{
		return "Sync";
	};

	read( len, buf )
	{
		for ( var n = 0; n < len; n++ )
		{
			this.data[ n ] = buf.readByte();
		}
	};

	write( _buf )
	{
		var len = AnnoRec.ANNO_HEAD_SIZE + 4;
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.SYNC, len );

		//_buf.writeByte( this.data.length );
		for ( let inx = 0, len = this.data.length; inx < len; ++inx )
		{
			_buf.writeByte( this.data[ inx ] );
		}
	}

}

AnnoFactory[ AnnoType.SYNC ] = SyncAnno;

///////////////////////////////////////////////////////////////////////////////////////////////
// MoveMedalAnno

export class MoveMedalAnno
{
	constructor( val )
	{
		this.medal = val;
	};

	toString()
	{
		return "Medal-" + this.medal;
	};

	getString()
	{
		return this.toString();
	};

	getOneMedal()
	{
		if ( this.medal & Medal.SACRIFICE )
		{
			return Medal.SACRIFICE;
		}
		if ( this.medal & Medal.ENDGAME )
		{
			return Medal.ENDGAME;
		}
		if ( this.medal & Medal.STRATEGY )
		{
			return Medal.STRATEGY;
		}
		if ( this.medal & Medal.TACTICAL_BLUNDER )
		{
			return Medal.TACTICAL_BLUNDER;
		}
		return this.medal;
	};

	read( len, buf )
	{
		this.medal = buf.readUint32();
	}

	write( _buf )
	{
		var len = AnnoRec.ANNO_HEAD_SIZE + 4;
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.MOVE_MEDAL, len );
		_buf.writeUint32( this.medal );
	}
}

AnnoFactory[ AnnoType.MOVE_MEDAL ] = MoveMedalAnno;


///////////////////////////////////////////////////////////////////////////////////////////////////////
// EvalProfileAnno

export class EvalProfileAnno
{
	constructor( first, last, evalArr )
	{
		this.first = first || 0;
		this.last = last || 0;
		this.evalArr = evalArr || [];
		this.min = 32767;
		this.max = -32767;

		this.detMinMax();
	};

	static EV_INVALID = 32767;

	detMinMax()
	{
		for ( var i = 0; i < this.evalArr.length; i++ )
		{
			if ( this.evalArr[ i ] !== EvalProfileAnno.EV_INVALID )
			{
				if ( this.evalArr[ i ] > this.max )
					this.max = this.evalArr[ i ];
				if ( this.evalArr[ i ] < this.min )
					this.min = this.evalArr[ i ];
			}
		}
	};

	range()
	{
		return Math.max( 1, this.max - this.min );
	};

	toString()
	{
		return "MoveMedal";
	};

	isValid()
	{
		return this.last > this.first;
	};

	read( len, buf )
	{
		this.evalArr = [];
		this.first = 0;
		this.last = 0;

		var n = buf.readBEInt16();
		if ( n < 600 )
		{
			for ( var i = 0; i < n; i++ )
			{
				var arrbuf = new ArrayBuffer( 4 );
				var view = new DataView( arrbuf );
				view.setInt8( 0, buf.readByte() );
				view.setInt8( 1, buf.readByte() );
				view.setInt8( 2, buf.readByte() );
				view.setInt8( 3, buf.readByte() );

				var ev = view.getInt16( 2 );
				/*var depth = */ view.getInt8( 1 );
				var type = view.getInt8( 0 );

				if ( type === -1 )
					this.evalArr.push( EvalProfileAnno.EV_INVALID );
				else
				{
					if ( type === 1 )	// mate
					{
						if ( ev < 0 )
							ev = -30000 + ev;
						else
							ev = 30000 - ev;
					}
					this.evalArr.push( ev );
				}
			}
			this.last = n - 1;
		}
		this.detMinMax();
	};

	static readFactory = createReadFactory( EvalProfileAnno );

	write( _buf )
	{
		var len = AnnoRec.ANNO_HEAD_SIZE + 2 + this.evalArr.length * 4;
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.EVAL_PROFILE, len );

		//_buf.writeBEInt16( this.last );
		_buf.writeBEInt16( this.evalArr.length );
		for ( var e = 0; e < this.evalArr.length; e++ )
		{
			var arrbuf = new ArrayBuffer( 4 );
			var view = new DataView( arrbuf );
			if ( this.evalArr[ e ] === EvalProfileAnno.EV_INVALID )
			{
				view.setInt8( 0, 255 ); // type
				view.setInt16( 2, 0 ); // ev
			}
			else
			{
				view.setInt8( 0, 0 ); // type
				view.setInt16( 2, this.evalArr[ e ] );
			}
			view.setInt8( 1, 0 ); // depth

			_buf.writeBEInt32( view.getInt32( 0 ) );
		}
	};
}

AnnoFactory[ AnnoType.EVAL_PROFILE ] = EvalProfileAnno;


////////////////////////////////////////////////////////////////////////////////////////////

export class TrainingAnno
{
	constructor( correctMove )
	{
		this.move = correctMove;
		this.solved = false;
		this.nHelpClicked = 0;
		this.texts = {};
		this.texts[ "en" ] = {
			question: "",
			help: ""
		}
	};

	static lns = [ "en", "de", "es", "it" ];
	static lIds = [ Language.ENG, Language.DEU, Language.ESP, Language.ITA ];	// ginge auch Language.getLanguageIdOfParam()

	getQuestion( ln )
	{
		if ( this.texts[ ln ] )
			return this.texts[ ln ].question;
		for ( var l = 0; l < TrainingAnno.lns.length; l++ )
			if ( this.texts[ TrainingAnno.lns[ l ] ] )
				return this.texts[ TrainingAnno.lns[ l ] ].question;
	};

	getHelp( ln )
	{
		if ( this.texts[ ln ] )
			return this.texts[ ln ].help;

		for ( var l = 0; l < TrainingAnno.lns.length; l++ )
			if ( this.texts[ TrainingAnno.lns[ l ] ] )
				return this.texts[ TrainingAnno.lns[ l ] ].help;
	};

	toString()
	{
		return "Training";
	};

	decodeLocals( buf )
	{
		/*var seconds = */ buf.readUint32();
		/*var maxPoints = */ buf.readUint16();

		var nQuestions = buf.readUint16();
		for ( var i = 0; i < nQuestions && i < 10; i++ )
		{
			var q = this.decodeString( buf );
			var ln = q.ln;
			if ( ln )
			{
				if ( !this.texts[ ln ] )
				{
					this.texts[ ln ] = {};
				}
				this.texts[ ln ].question = q.str;
			}
		}

		var nDefaultWrong = buf.readUint16();
		for ( let i = 0; i < nDefaultWrong && i < 10; i++ )
		{
			this.decodeString( buf );
		}
		var nHelp1 = buf.readUint16();
		for ( let i = 0; i < nHelp1 && i < 10; i++ )
		{
			let q = this.decodeString( buf );
			let ln = q.ln;
			if ( ln )
			{
				if ( !this.texts[ ln ] )
				{
					this.texts[ ln ] = {};
				}
				this.texts[ ln ].help = q.str;
			}
		}

		var nHelp2 = buf.readUint16();
		for ( let i = 0; i < nHelp2 && i < 10; i++ )
		{
			this.decodeString( buf );
		}

	}

	readMoveInputItem( buf )
	{
	    /*var totLen = */ buf.readUint16();
		this.decodeLocals( buf );
		var nMoves = buf.readByte();
		for ( var i = 0; i < nMoves && i < 60; i++ )
		{
			var from = buf.readByte();
			var to = buf.readByte();
			var prom = buf.readByte();
			/*var points =*/ buf.readByte();
			var nFeedback = buf.readUint16();
			if ( i === 0 )
			{
				this.move = new Move( from, to, prom );
			}
			for ( var n = 0; n < nFeedback; n++ )
			{
				this.decodeString( buf );
			}
		}
	}

	readMultipleChoiceItem( buf )
	{
		/*var totLen = */ buf.readUint16();
		this.decodeLocals( buf );
		var nAnswers = buf.readByte();
		for ( var i = 0; i < nAnswers && i < 60; i++ )
		{
			// var pts = buf.readByte();
			var nStrings = buf.readUint16();
			for ( var n = 0; n < nStrings; n++ )
			{
				this.decodeString( buf );

			}
			nStrings = buf.readUint16();
			for ( var n = 0; n < nStrings; n++ )
			{
				this.decodeString( buf );

			}
		}
	}

	read( len, buf )
	{
		/*var nMax =*/ buf.readUint16();
		var type = buf.readByte();
		switch ( type )
		{
			default:
				break;
			case 1:
				this.readMoveInputItem( buf );
				break;
			case 2:
				this.readMultipleChoiceItem( buf );
				break;
		}
	}

	write( _buf )
	{
		var trBuf = new DataBuffer();

		// TrainingDescriptor:
		trBuf.writeUint16( 1 ); // nMax!?
		trBuf.writeByte( 1 );		// training type TTI_MOVE_INPUT

		// MoveInputItem from here
		var lenPos = trBuf.getPos();
		trBuf.writeUint16( 0 );	// len place holder

		// question and help:
		trBuf.writeUint32( 300 );	// seconds
		trBuf.writeUint16( 0 );	// max points
		var nStringsPos = trBuf.getPos();
		trBuf.writeUint16( 0 );	// nStrings place holder
		var nQuestions = 0;

		for ( var l = 0; l < TrainingAnno.lns.length; l++ )
		{
			if ( this.texts[ TrainingAnno.lns[ l ] ] )
			{
				if ( this.texts[ TrainingAnno.lns[ l ] ].question )
				{
					nQuestions = this.encodeString( this.texts[ TrainingAnno.lns[ l ] ].question, trBuf, nQuestions, TrainingAnno.lIds[ l ] );
				}
			}
		}
		trBuf.writeAtPrevPos( nStringsPos, function()
		{
			trBuf.writeUint16( nQuestions );
		} );

		trBuf.writeUint16( 0 );	// no defaultWrong1


		var nHelp1 = 0;
		var nHelpPos = trBuf.getPos();
		trBuf.writeUint16( 0 );	// nStrings place holder
		for ( var l = 0; l < TrainingAnno.lns.length; l++ )
		{
			if ( this.texts[ TrainingAnno.lns[ l ] ] )
			{
				if ( this.texts[ TrainingAnno.lns[ l ] ].help )
				{
					nHelp1 = this.encodeString( this.texts[ TrainingAnno.lns[ l ] ].help, trBuf, nHelp1, TrainingAnno.lIds[ l ] );
				}
			}
		}

		trBuf.writeAtPrevPos( nHelpPos, function()
		{
			trBuf.writeUint16( nHelp1 );
		} );

		trBuf.writeUint16( 0 );	// no help2

		// just one move with points and no feedback strings:
		trBuf.writeByte( 1 ); // one move
		trBuf.writeByte( this.move.from );
		trBuf.writeByte( this.move.to );
		trBuf.writeByte( this.move.prom );
		trBuf.writeByte( 5 );	// points
		trBuf.writeUint16( 0 );	// feedback strings

		var nSize = trBuf.getPos();
		trBuf.writeAtPrevPos( lenPos, function()
		{
			trBuf.writeUint16( nSize );
		} );

		let len = AnnoRec.ANNO_HEAD_SIZE + trBuf.getSize();
		_buf.writeUint16( len );
		AnnoRec.writeHeader( _buf, 0, AnnoType.TRAINING, len );
		_buf.writeData( trBuf );
	}

	decodeString( buf )
	{
		/*let type = */ buf.readByte();
		let lid = buf.readByte();
		let len = buf.readUint16();
		let str = buf.readSizedString( len );
		if ( strUtil.mayBeUtf8( str ) )
		{
			str = strUtil.decodeUTF8( str );
		}

		return {
			ln: Language.getParamOfLanguageId( lid ),
			str: str
		}
	}

	encodeString( str, buf, _nStrings, lId )
	{
		let nStrings = _nStrings;

		if ( str )
		{
			buf.writeByte( lId );
			buf.writeByte( 0 /*TI_TEXT*/ );
			buf.writeUint16( str.length );
			buf.writeSizedString( str );
			nStrings++;
		}

		return nStrings;
	};
}

AnnoFactory[ AnnoType.TRAINING ] = TrainingAnno;


