// S.T. 2011
// ES 6 MW: Feb 28, 2020

import { CBDebug } from "common/Tools/Debug/debug_util"
import { Log } from "common/Tools/Log"
//import { CBDebug} from "common/Tools/Debug/debug_util.debug"
import { DataBuffer } from "common/Container/DataBuffer"
import { ListenersUtil } from "common/Patterns/Listeners"
import { Piece, Square, Side, CastleRights } from "common/Chess/Logic/Chess";
import { GameHeader /*, PlayerData*/ } from "common/Chess/Logic/GameHeader";
import { Annotation } from "common/Chess/Logic/Annotation";
import { AnnoType, EvalProfileAnno } from "common/Chess/Format/AnnoTypes";
import { LineStack, LineStackItem } from "common/Chess/Logic/LineStack";
import { MoveLine } from "common/Chess/Logic/MoveLine";
import { ObjUtil } from "common/Patterns/ObjectUtil";
import { Position } from "common/Chess/Logic/Position";
import { NotationGenerator, InvariantLocalization } from "common/Chess/Logic/Notation";
// import { glApp } from "common/App/App";

export var MoveEnterType = 
{
	CANCEL: -1, // 0..64: Variation numbers

	TYPE_MASK: ~63,
	LINE_MASK: 63,

	QUERY: 64,
	OVERWRITE_MAIN: 128,
	OVERWRITE_LINE: 256,
	NEWLINE: 512,
	INSERT_MAIN: 1024,
	NEWMAINLINE: 2048,
	INSERT_LINE: 4096
};

// NH2020I Abstrakte Repräsentation eines Spiels.
// Ein neuer Zug wird so hinzugefügt: Canvas2d->BoardArea->BoardControl->MoveEntry->MoveEnteredEvent->GameKernel->Game.makeMove
// Diese Klasse enthält zB auch die aktuelle Position des Spiels sowie die abstrakte Notation (LineStack, MoveLine, MainLine)
// Ebenso enthält diese Klasse eine Referenz zum GameHeader Element, in dem Informationen über Spiel und Spieler
// gespeichert sind.
// In this.stk (ein LineStack mit wohl mehreren LineStackItems) werden wohl alle Lines der Notation gespeichert. Ein LineStackItem
// enthält eine MoveLine und einen Index (in dem der aktuell ausgewählte Zug gespeichert ist?).

export class Game
{
	constructor( _pos, _mainLine )
	{
		Game.InitListeners();

		if ( !_pos )
			_pos = new Position();
		this.start = _pos;

		if ( !_mainLine )
			_mainLine = new MoveLine();

		this.mainLine = _mainLine;

		this.stk = new LineStack( this.mainLine );
		this.hdr = new GameHeader();

		this.initPost();

		this.fromDataBuf = this.read;
		this.toDataBuf = this.write;

		this.onlineDBID = null; // NH2020 Added
	};

	static InitListeners()
	{
		if ( !Game.prototype.fireEvent )
		{
			ListenersUtil.initForListeners( Game );
			ListenersUtil.addEvent( Game, "CurPosChanged", function() { return [ this, this.getCurPos() ]; } );
			ListenersUtil.addEvent( Game, "Navigate", function() { return [ this ]; } );
			ListenersUtil.addEvent( Game, "Move", function() { return [ this, this.getLastMove() ]; } );
			ListenersUtil.addEvent( Game, "Changed" );
			ListenersUtil.addEvent( Game, "HeaderChanged" );
			ListenersUtil.addEvent( Game, "AnnoChanged" );	// do not update engine, live book etc.
			ListenersUtil.addEvent( Game, "ResetGame" );
			ListenersUtil.addEvent( Game, "GameEnd", function() { return [ this, this.getResult() ]; } );
			ListenersUtil.addEvent( Game, "ClickInNotation" ); //Please! Don't!!!	-> Sonderfall Video Player.
			ListenersUtil.addEvent( Game, "NotaDoubleClick" );
			ListenersUtil.addEvent( Game, "Eval" );
		}
	}

	init( _pos, _mainLine )
	{
		Game.call( this, _pos, _mainLine );
		this.fireOnChanged();
		this.fireOnHeaderChanged();
	};

	initPost()
	{
		this.cur = ObjUtil.clone( this.start );

		//Die Züge initialisieren...
		Game.initLine( this.start, this.mainLine );
	};

	assign( _gm, noFire )
	{
		//Direkt übernehmen...
		//Das andere Spiel ist schon valid.

		//for ( var i in _gm )		// better not, might overwrite existing handlers etc. Yep! And works bad with recursive structs.
		//{
		//	if ( _gm.hasOwnProperty(i))
		//	{
		//		this[i] = _gm[i];
		//	}
		//}

		this.start = _gm.start;
		this.cur = _gm.cur;
		this.mainLine = _gm.mainLine;
		this.stk = _gm.stk;
		this.hdr = _gm.hdr;
		this.replaceGameNo = _gm.replaceGameNo;
		this.replaceDBId = _gm.replaceDBId;
		this.onlineDBID = _gm.onlineDBID; // NH2020 Added

		if ( !noFire )
		{
			this.fireOnResetGame();
			this.fireOnCurPosChanged();
			this.fireOnChanged();
			this.fireOnHeaderChanged();
		}
	};

	getMoves()
	{
		return this.mainLine;
	};

	setMoves( mainLine )
	{
		this.mainLine = mainLine;
	};

	getMainLine = this.getMoves;

	getCurPos()
	{
		return this.cur;
	};

	getStartPos()
	{
		return this.start;
	};

	isNormalInit()
	{
		var posInit = new Position();
		return ObjUtil.equals( this.start, posInit );
	};

	getNextMove()
	{
		var itmTop = this.stk.Top();
		if ( itmTop )
		{
			if ( itmTop.isLineEnd() )
				return null;

			var line = itmTop.getLine();
			var mvsToGo = itmTop.getMovesToGo();
			return line[ mvsToGo ];
		}
		return null;
	};

	getLastMove()
	{
		if ( this.stk )
		{
			var itmTop = this.stk.Top();
			if ( !itmTop || itmTop.isLineStart() )
				return null;

			var line = itmTop.getLine();
			if ( line )
			{
				var mvsToGo = itmTop.getMovesToGo();
				return line[ mvsToGo - 1 ];
			}
		}
		return null;
	};

	getPreviousMove = this.getLastMove;


	static initLine( _start, _line )
	{
		var cur = ObjUtil.clone( _start );

		for ( var inx = 0, len = _line.length; inx < len; ++inx )
		{
			var mv = _line[ inx ];
			cur.preCalcCtx( mv );

			if ( mv.hasLines() )
			{
				var subLines = mv.getSubLines();
				for ( var inxLn = 0, lenLines = subLines.length; inxLn < lenLines; ++inxLn )
				{
					var lineSub = subLines[ inxLn ];
					Game.initLine( cur, lineSub );
				}
			}
			cur.makeMove( mv );
			var last = inx === _line.length - 1;
			cur.postCalcCtx( mv, last );
		}
	};

	reset()
	{
		this.assign( new Game(), true /*nofire*/ );
		this.fireOnResetGame(); // e.g. deletes premoves
		this.fireOnCurPosChanged();
		this.fireOnChanged();
		this.fireOnHeaderChanged();
	};

	setResult( result )
	{
		this.hdr.setResult( result );
		this.fireOnChanged();
		this.fireOnHeaderChanged();
	};

	getResult()
	{
		return this.hdr.getResult();
	};

	getCBResult = function()
	{
		return this.hdr.getCBResult();
	}

	getTopItem()
	{
		return this.stk.Top();
	};

	getTopLine()
	{
		if ( this.stk.Top() )
			return this.stk.Top().getLine();
	};

	getTopMovesToGo()
	{
		if ( this.stk.Top() )
			return this.stk.Top().getMovesToGo();
	};

	isLineEnd()
	{
		if ( this.stk.Top() )
			return this.stk.Top().isLineEnd();
		return false;
	};

	isOnMainLine()
	{
		return this.stk.length === 1;
	};

	isGameStart()
	{
		return this.stk.length === 1 && this.stk[ 0 ].isLineStart();
	};

	isGameEnd()
	{
		return this.stk.length === 1 && this.stk[ 0 ].isLineEnd();
	};

	// NH2020I Um die Stack Position zu bekommen durchläuft das ganze von der Startposition aus
	// alle Lines bis zum jeweiligen MoveIndex des LineStack Items und führt
	// jeweils den Zug aus.
	getStackPos( _stk )
	{
		var cur = ObjUtil.clone( this.start );

		for ( var inx = 0, len = _stk.length; inx < len; ++inx )
		{
			var itm = _stk[ inx ];

			var line = itm.getLine();
			var mvsToGo = itm.getMovesToGo();

			for ( var inxMv = 0; inxMv < mvsToGo; ++inxMv )
			{
				var mv = line[ inxMv ];
				cur.makeMove( mv );
			}
		}

		return cur;
	};

	getLinePos( _line, _mvsToGo )
	{
		var stk = Game.getStackForLine( _line, _mvsToGo );
		return this.getStackPos( stk );
	};

	setStack( _stkNew )
	{
		this.stk = _stkNew;
		if ( this.stk.length > 0 )
		{
			this.mainLine = this.stk[ 0 ].line; //SICHERHEITSHALBER!!!
		}

		this.cur = this.getStackPos( this.stk );
	};

	getSimplePath()
	{
		return this.stk.getSimplePath();
	};

	getHeader()
	{
		return this.hdr;
	};

	setHeader( _hdr )
	{
		this.hdr = _hdr;
	};

	getGameNo()
	{
		return this.hdr.nGame;
	};

	requiresPremiumForDownload()
	{
		var cnt = 0;
		this.forAllMoves( function( m )
		{
			cnt++;
		} );

		if ( cnt > 2 * this.getMainLine().length )
		{
			return this.hdr.annotator.length > 5;	// No "TA", no "NA RC"
		}
		return false;
	};

	selfTest()
	{
		//	CBDebug.call( this.stk, this.stk.selfTest );
		//	CBDebug.call( this.mainLine, this.mainLine.selfTest, this.start, null, 0 );
	};


	////////////////// Read/Write /////////////////////////////////////////////

	getLineCnt( moveNr )
	{
		return this.stk.length; // is this correct?
	};



	/// make moves ///////////////////////////////////////


	/// Goto Move //////////////////////////////////////////////////////////////////////

	isOnLastMove()
	{
		return this.getMoveIndex() === this.mainLine.length;
	};

	getPlyNum()
	{
		return this.getCurPos().getPlyNum();
	};

	getMoveNo = this.getPlyNum;

	getMoveCount()
	{
		return this.mainLine.length;
	}


	//////// Lines /////////////////////////////////////////////////////////////////


	/*
	 * Move Baggage ist not serialized, just for internal use, like extra animations
	 * can be any object
	 */
	getMoveBaggage()
	{
		if ( this.getLastMove() )
			return this.getLastMove().getBaggage();
		else
			return this.baggage;
	};

	setMoveBaggage( b )
	{
		if ( this.getLastMove() )
		{
			this.getLastMove().setBaggage( b );
		}
		else
			this.baggage = b;
		this.fireOnChanged();
	};

	getAnno( _type )
	{
		if ( this.getLastMove() )
			return this.getLastMove().getAnnoItem( _type );

		if ( this.mainLine.anno )
		{
			return this.mainLine.anno.getItem( _type );
		}
	};

	setAnno( type, val )
	{
		if ( this.getLastMove() )
		{
			this.getLastMove().setAnnoItem( type, val );
			this.fireOnChanged();
		}
	};

	setAnnoBeforeFirstMove( _type, _val, _nofire )
	{
		if ( !this.mainLine.anno )
			this.mainLine.anno = new Annotation();
		this.mainLine.anno.setItem( _type, _val );
		if ( !_nofire )
			this.fireOnChanged();
	};

	getOrCreateCurrAnno()
	{
		if ( this.getPreviousMove() )
		{
			if ( !this.getPreviousMove().hasAnno() )
			{
				this.getPreviousMove().setAnno( new Annotation() );
			}
			return this.getPreviousMove().getAnno();
		}
		else
		{
			if ( !this.getMoves().hasAnno() )
			{
				this.getMoves().setAnno( new Annotation() );
			}
			return this.getMoves().getAnno();
		}
	};

	updateFromExtern()
	{
		this.fireOnChanged();
		this.fireOnCurPosChanged(); // arrows and squares were not visible in broadcast
	};

	updateHeaderFromExtern()
	{
		this.fireOnHeaderChanged();
	};

	deleteAnnosInCurLine( type, nofire )
	{
		var curLine = this.getCurLine();

		for ( var i = 0; i < curLine.length; i++ )
		{
			if ( curLine[ i ] )
			{
				if ( type )
				{
					curLine[ i ].deleteAnnoItem( type );
				}
				else
					curLine[ i ].setAnno( null );
			}
		}
		if ( !nofire )
			this.fireOnChanged();
	};

	deleteAnno( type, nofire )
	{
		if ( this.getLastMove() )
		{
			this.getLastMove().deleteAnnoItem( type );
			if ( !nofire )
				this.fireOnAnnoChanged();
		}
	};

	getEvaluationProfile()
	{
		if ( this.mainLine.anno && this.mainLine.anno[ AnnoType.EVAL_PROFILE ] )
		{
			return this.mainLine.anno[ AnnoType.EVAL_PROFILE ];
		}

		var curLine = this.getCurLine();

		if ( curLine.length )
		{
			if ( curLine[ 0 ].annos )
				return curLine[ 0 ].annos[ AnnoType.EVAL_PROFILE ];
		}
	};

	initEvaluationProfile( _p )
	{
		if ( !this.mainLine.anno )
			this.mainLine.anno = new Annotation();

		var p = _p || new EvalProfileAnno();
		this.mainLine.anno[ AnnoType.EVAL_PROFILE ] = p;

		return p;
	};

	deleteEvaluationProfile()
	{
		if ( this.mainLine.anno )
			delete this.mainLine.anno[ AnnoType.EVAL_PROFILE ];
	};

	toString()
	{
		var notaGen = new NotationGenerator( InvariantLocalization );
		var strLine = this.hdr.toString();
		strLine += "\r\n";
		for ( var i = 0; i < this.mainLine.length; i++ )
		{
			var strMove = notaGen.getMoveNota( this.mainLine[ i ] );
			var strMoveNum = notaGen.getStrMoveNumInLine( i, this.getStartPos().getPlyNum() );
			strLine += strMoveNum + strMove;
			if ( i < this.mainLine.length - 1 )
				strLine += " ";
		}

		strLine += " " + this.hdr.getCBResult().toString();

		return strLine;
	};

	onSync( nVal )
	{
		Log.Missing();
		// NH2021D
		// if ( glApp.panelMgr && glApp.panelMgr.onSync )
		// 	glApp.panelMgr.onSync( nVal );
	};

	static createTestGame()
	{
		var gm = new Game();

		// function getRndName()
		// {
		// 	var rndName = ["Adams", "Dolmatov", "Fischer", "Gelfand", "Ivkov", "Karpov", "Lerner"];
		// 	return rndName[Math.floor( rndName.length * Math.random() )];
		// }

		// gm.hdr.white = new PlayerData( getRndName() );
		// gm.hdr.black = new PlayerData( getRndName() );

		return gm;
	};


	delayChangedEvents( msDelay )
	{
		this.delayfireOnCurPosChanged( msDelay );
		this.delayfireOnChanged( msDelay );
		this.delayfireOnHeaderChanged( msDelay );
		this.delayfireOnAnnoChanged( msDelay );
	}

	continueChangedEvents()
	{
		this.continuefireOnCurPosChanged();
		this.continuefireOnChanged();
		this.continuefireOnHeaderChanged();
		this.continuefireOnAnnoChanged();

	}

	getCurLine()
	{
		// return Game._getCurLine.call( this, false );
		return this._getCurLine( false );
	};

	getCurLineCut()
	{
		//return Game._getCurLine.call( this, true );
		return this._getCurLine( true );
	};

	getLineStartMoveNo()
	{
		var sum = 0;
		for ( var i = 0; i < this.stk.length - 1; i++ )
			sum += this.stk[ i ].getMovesToGo();
		return sum;
	};

	_getCurLine( _cut )
	{
		var curLine = [];
		for ( var inx = 0, len = this.stk.length; inx < len; ++inx )
		{
			var itmStk = this.stk[ inx ];

			var line = itmStk.getLine();
			var mvsToGo = itmStk.getMovesToGo();

			var end = mvsToGo;
			if ( !_cut && inx === len - 1 )
				end = line.length;

			if ( !end )
				continue;

			curLine = curLine.concat( line.slice( 0, end ) );
		}
		return curLine;
	};

	getCurLineIndex()
	{
		var res = 0;
		for ( var inx = 0, len = this.stk.length; inx < len; ++inx )
		{
			var itmStk = this.stk[ inx ];
			res += itmStk.getMovesToGo();
		}
		return res;
	};

	setCurLineIndex( _inx )
	{
		var stkNew = new LineStack();
		for ( var inx = 0, len = this.stk.length; inx < len; ++inx )
		{
			var itmStk = this.stk[ inx ];
			var mvsToGo = itmStk.getMovesToGo();

			if ( inx < len - 1 && mvsToGo < _inx )
			{
				stkNew.push( itmStk );
				_inx -= mvsToGo;
			}
			else
			{
				var line = itmStk.getLine();
				mvsToGo = _inx;

				var itmNew = new LineStackItem( line, mvsToGo );
				stkNew.push( itmNew );

				break;
			}
		}

		this.gotoStack( stkNew );
	}
	jump( n )
	{
		var nMove = this.getMoveIndex() + n;
		if ( nMove < 1 )
			nMove = 1;
		if ( nMove > this.mainLine.length )
			nMove = this.mainLine.length;
		this.gotoIndex( nMove );
		this.fireOnNavigate();
		this.fireOnCurPosChanged();
	};

	gotoFirst()
	{
		this.gotoIndex( 0 );
	};

	gotoLast()
	{
		this.gotoIndex( this.mainLine.length );
	};

	gotoIndex( _inxMv, noFire )
	{
		var stkNew = Game.getStackForIndex( this.mainLine, _inxMv );
		this.gotoStack( stkNew, noFire );
	};

	gotoLine( _line, _mvsToGo )
	{
		var stkNew = Game.getStackForLine( _line, _mvsToGo );

		this.gotoStack( stkNew );
	};

	gotoSimplePath( _arrSimplePath )
	{
		//	this.fireOnNavigate();

		var stkNew = Game._getStackForSimplePath.call( this, this.mainLine, _arrSimplePath );

		this.gotoStack( stkNew );
	};

	// NH2020 Added this to board position change animations possible
	goToSimplePathGenerateAnimationData (simplePath)
	{
		this.stk = Game._getStackForSimplePath.call( this, this.mainLine, simplePath );

		if ( this.stk.length > 0 )
		{
			this.mainLine = this.stk[ 0 ].line; //SICHERHEITSHALBER!!!
		}

		this.cur = this.getStackPos( this.stk );

		this.fireOnCurPosChanged();
		this.fireOnNavigate();
	};

	triggerOnClickInNotation()
	{
		this.fireOnClickInNotation();
	};

	// NH2021 Original Version
	gotoNext()
	{
		if ( this.isLineEnd() )
			return;

		var mv = this.getNextMove();
		this.cur.makeMove( mv );

		var itmTop = this.getTopItem();
		if ( itmTop )
			itmTop.incMovesToGo();

		this.fireOnCurPosChanged();
		this.fireOnNavigate();
	};

	gotoPrev( noFire )
	{
		if ( this.isGameStart() )
			return;
		var stk = /*ObjUtil.clone*/( this.stk ); //WIESO WURDE DER GESAMTE STACK GEKLONNT??? Führte zu einem Bug
		//Zug zurück...
		stk.gotoPrev();

		this.gotoStack( stk, noFire );
	};

	// HACK, MW 6/15, für TrainingPlayingMode.js
	// TODO ST <-> MW  Generell Verhalten von Clone diskutieren. -> storeOnce/restoreOnce
	gotoPrevClone()
	{
		if ( this.isGameStart() )
			return;
		var stk = ObjUtil.clone( this.stk );
		stk.gotoPrev();
		this.gotoStack( stk );
	};

	gotoStart()
	{
		this.gotoIndex( 0 );
		this.fireOnCurPosChanged();   // gotoIndex fires also in gotoStack
		this.fireOnNavigate();
	};

	gotoEnd()
	{
		this.gotoIndex( this.mainLine.length );
		this.fireOnCurPosChanged();
		this.fireOnNavigate();
	};

	gotoStack( _stkNew, noFire )
	{
		this.setStack( _stkNew );

		if ( !noFire )
		{
			this.fireOnCurPosChanged();
			this.fireOnNavigate();
		}
	};

	gotoMove( _mv, _fireOnMove )
	{
		var mvNext = this.getNextMove();
		if ( !mvNext )
			return false;
		if ( _mv.equals( mvNext ) )
		{
			_mv.mvd = mvNext.mvd;	// complete attributes here because this is reached via move entry and can leave a move incomplete.
			this.gotoNext();
			if ( _fireOnMove )
				this.fireOnMove();
			return true;
		}

		//Untervarianten?
		var line = mvNext.findLine( _mv );
		if ( line )
		{
			this.gotoLine( line, 1 );
			if ( _fireOnMove )
				this.fireOnMove();
			return true;
		}

		return false;
	};

	beginLineNextMove( nLine )
	{
		var mvNext = this.getNextMove();
		if ( !mvNext )
			return false;
		if ( !mvNext.hasLines() )
			return false;
		if ( nLine >= mvNext.getSubLines().length )
			return false;
		var firstMoveOfLine = mvNext.getSubLines()[ nLine ][ 0 ];
		if ( this.gotoMove( firstMoveOfLine ) )
			return firstMoveOfLine;

		return false;
	};

	endLine()
	{
		if ( this.stk.length > 1 )
		{
			var itm = this.stk[ this.stk.length - 2 ];
			var line = itm.getLine();
			this.gotoLine( line, itm.mvsToGo );

			return this.getMoveIndex();
		}
	};

	getMoveOffs()
	{
		return this.cur.numPly - this.start.numPly;
	};

	getMoveIndex()
	{
		var inxRes = 0;
		if ( this.stk.length > 0 )
		{
			var itmTop = this.stk[ this.stk.length - 1 ];

			var linePrev = itmTop.getLine();
			inxRes = itmTop.getMovesToGo();

			for ( var inxItm = this.stk.length - 2; inxItm >= 0; --inxItm )
			{
				var itmCur = this.stk[ inxItm ];
				var lineCur = itmCur.getLine();

				var inxParMv = linePrev.getParentMoveIndex();
				var mvLined = lineCur[ inxParMv ];

				var inxPrevLine = mvLined.indexOfLine( linePrev );

				// CBDebug.assert( inxPrevLine >= 0, "inxPrevLine >= 0" );

				for ( var inxLn = 0; inxLn < inxPrevLine; ++inxLn )
					inxRes += mvLined.getLine( inxLn ).getTreeMoveCount();

				for ( var inxMv = inxParMv + 1, lenLine = lineCur.length; inxMv < lenLine; ++inxMv )
				{
					var mv = lineCur[ inxMv ];
					if ( !mv.hasLines() )
						continue;
					for ( let inxLn = 0, lenLines = mv.getSubLinesCount(); inxLn < lenLines; ++inxLn )
						inxRes += mv.getLine( inxLn ).getTreeMoveCount();
				}

				inxRes += lineCur.length;

				linePrev = lineCur;
			}
		}

		return inxRes;
	};

	static getStackForLine( _line, _mvsToGo )
	{
		var arrTmp = [];
		for ( ; _line != null;
			_mvsToGo = _line.getParentMoveIndex(),
			_line = _line.getParentLine()
		)
		{
			let itm = new LineStackItem( _line, _mvsToGo );
			arrTmp.push( itm );
		}

		var stkNew = new LineStack();
		while ( arrTmp.length > 0 )
		{
			let itm = arrTmp.pop();
			stkNew.push( itm );
		}

		return stkNew;
	};

	static _getStackForSimplePath( _mainLine, _arrPath )
	{
		var stkNew = new LineStack();
		var curLine = _mainLine;
		for ( var inx = 0, len = _arrPath.length; inx < len; ++inx )
		{
			// var line = _mainLine;
			var itmSimple = _arrPath[ inx ];
			// console.log("Item Simple: " + itmSimple.inxLine + ", " + itmSimple.mvsToGo);

			var itm = new LineStackItem( curLine, itmSimple.mvsToGo );

			stkNew.push( itm );

			if ( inx < len - 1 )
			{
				// console.log("Index Line: " + itmSimple.inxLine);
				curLine = curLine[ itmSimple.mvsToGo ].getLine( itmSimple.inxLine );
				// console.log("Cur Line: " + curLine);
			}

		}

		return stkNew;
	};

	static getStackForIndex( _mainLine, _inxMv )
	{
		var stt = { complete: false, inxMv: _inxMv };
		var stkNew = new LineStack();

		Game._getStackForIndex.call( this, _mainLine, stt, stkNew );

		return stkNew;
	};

	static _getStackForIndex( _line, _stt, _stk )
	{
		var len = _line.length;
		if ( _stt.inxMv <= len )
		{
			_stk.push( new LineStackItem( _line, _stt.inxMv ) );
			_stt.complete = true;

			return true;
		}

		_stt.inxMv -= len;

		for ( var inxMv = _line.length - 1; inxMv >= 0; --inxMv )
		{
			var mv = _line[ inxMv ];
			if ( !mv.hasLines() )
				continue;

			_stk.push( new LineStackItem( _line, inxMv ) );

			for ( var inxLine = 0, lenLines = mv.getSubLinesCount(); inxLine < lenLines; ++inxLine )
			{
				var lineSub = mv.getLine( inxLine );

				Game._getStackForIndex( lineSub, _stt, _stk );

				if ( _stt.complete )
					return true;
			}

			_stk.pop();
		}

		return false;
	}

	promoteLine()
	{
		if ( this.isOnMainLine() )
			return false;

		CBDebug.call( this, this.selfTest );

		this.stk.promoteLine();

		CBDebug.call( this, this.selfTest );

		this.fireOnChanged();

		return true;
	};

	static _shiftLine( _inc )
	{
		CBDebug.call( this, this.selfTest );

		if ( this.isOnMainLine() )
			return;

		var lineTop = this.getTopLine();
		var mvParent = lineTop.getParentMove();

		var cntLines = mvParent.getSubLinesCount();

		if ( !cntLines || cntLines === 1 )
			return;

		var inxCur = mvParent.indexOfLine( lineTop );
		var inxShift = inxCur + _inc;

		if ( inxShift < 0 || inxShift >= cntLines )
			return;

		mvParent.swapLines( inxCur, inxShift );

		CBDebug.call( this, this.selfTest );

		this.fireOnChanged();
	};

	upLine()
	{
		Game._shiftLine.call( this, -1 );
	};

	downLine()
	{
		Game._shiftLine.call( this, 1 );
	};

	deleteLine()
	{
		if ( this.isOnMainLine() )
			return;

		CBDebug.call( this, this.selfTest );

		var stkNew = this.stk.shallowClone();
		var lineTop = this.getTopLine();
		var mvParent = lineTop.getParentMove();
		mvParent.removeLine( lineTop );

		stkNew.pop();

		this.setStack( stkNew );

		CBDebug.call( this, this.selfTest );

		this.fireOnCurPosChanged();
		this.fireOnChanged();
	};

	deleteRemaining( nofire )
	{
		this.stk.deleteRemaining();

		if ( !nofire )
			this.fireOnChanged();
	};

	deletePrevious()
	{
		if ( this.getCurLine().length === 0 )
			return;

		var stk = this.stk.shallowClone();
		//Zug zurück...
		stk.gotoPrev();

		var start = this.getStackPos( stk );
		this.mainLine = this.stk.deletePrevious();
		this.start = start;

		this.fireOnChanged();
	};

	unAnnotate()
	{
		//Alle Linien weg!!!
		this.mainLine.unAnnotate();

		//Klingt kommisch - ist aber so. Fritz jumpt zum Anfang.
		var stk = new LineStack( this.mainLine, 0 );

		this.setStack( stk );

		this.fireOnChanged();
		this.fireOnCurPosChanged();
	};

	startLine()
	{
		this.gotoPrev();
	};

	forAllMoves( fn )
	{
		this.mainLine.forAllMoves( fn );
	};

	static CMP( _mv1, _mv2 )
	{
		return _mv1.equals( _mv2 );
	}

	merge( _gm, _noFire )
	{
		var posStart = _gm.getStartPos();

		var stk = this._findPos( posStart );

		if ( !stk ) //Wir haben nix gemeinsam! Wir müssen uns trennen!
			return this.assign( _gm, _noFire );

		//Nun solange der Variante folgen, bis die Züge total gleich sind.
		var itm = stk.Top();

		var lnMe = itm.getLine();
		var inxMeStart = itm.getMovesToGo();

		var inxSrc = 0;

		var lnSrc = _gm.mainLine;

		var inxMe = inxMeStart;

		//ZUERST PROLO MERGING!
		for ( ; inxMe < lnMe.length && inxSrc < lnSrc.length; ++inxMe, ++inxSrc )
		{
			var mvMe = lnMe[ inxMe ];
			var mvSrc = lnSrc[ inxSrc ];

			if ( !Game.CMP( mvMe, mvSrc ) )
				break;
		}
		//Die SRC-Linie ist ausgeschöpft.
		if ( inxSrc >= lnSrc.length )
			return;

		var lnDst = null;
		if ( inxMe >= lnMe.length )
		{
			//Am Ende anhängen...
			lnDst = lnMe;
		} else
		{
			var mvLast = lnMe[ inxMe ];
			//Neune Variante!!!
			var lnNew = new MoveLine( lnMe, inxMe );
			mvLast.addLine( lnNew );

			lnDst = lnNew;
		}

		for ( ; inxSrc < lnSrc.length; ++inxSrc )
		{
			var mv = lnSrc[ inxSrc ];
			lnDst.push( mv );
		}

		lnDst.setSubParentData( false );

		if ( !_noFire )
		{
			this.fireOnChanged();
		}
	};

	// warning: This does not work with annotated games (infinite recursion because of moveline.parent)
	// -> Stanislav
	// TM: We can use the re/storeOnce functions in Tactics App as we are stripping the game of its annotations.

	storeOnce()
	{
		this.storeState = {
			start: ObjUtil.clone( this.start ),
			cur: ObjUtil.clone( this.cur ),
			mainLine: ObjUtil.clone( this.mainLine ),
			stk: ObjUtil.clone( this.stk )
		};
	};

	restoreOnce()
	{
		if ( this.storeState )
		{
			this.start = ObjUtil.clone( this.storeState.start );
			this.cur = ObjUtil.clone( this.storeState.cur );
			this.mainLine = ObjUtil.clone( this.storeState.mainLine );
			this.stk = ObjUtil.clone( this.storeState.stk );
		}
	};

	// unannotated: 
	storeOnce2()
	{
		this.storeState = {
			start: ObjUtil.clone2( this.start ),
			cur: ObjUtil.clone2( this.cur ),
			mainLine: ObjUtil.clone2( this.mainLine ),
			stk: ObjUtil.clone2( this.stk )
		};
	};

	restoreOnce2()
	{
		if ( this.storeState )
		{
			this.start = ObjUtil.clone2( this.storeState.start );
			this.cur = ObjUtil.clone2( this.storeState.cur );
			this.mainLine = ObjUtil.clone2( this.storeState.mainLine );
			this.stk = ObjUtil.clone2( this.storeState.stk );
		}
	};

	beginLine( mv )
	{
		Game._makeMoveNewLine.call( this, mv );
	};

	makeMove( _mv, _mvType )
	{
		// what about variation numbers?

		if ( _mvType >= 0 && _mvType <= 63 )
		{
			_mvType = MoveEnterType.NEWLINE;
		}

		if ( this.gotoMove( _mv ) )
			return true;

		var undo = null;

		var mvType = _mvType & MoveEnterType.TYPE_MASK;
		var inxLine = _mvType & MoveEnterType.LINE_MASK;

		switch ( mvType )
		{
			case MoveEnterType.CANCEL & MoveEnterType.TYPE_MASK:
			case MoveEnterType.CANCEL:
				break;
			case MoveEnterType.NEWMAINLINE:
				undo = Game._makeMoveNewMainLine.call( this, _mv );
				break;
			case MoveEnterType.NEWLINE:
				undo = Game._makeMoveNewLine.call( this, _mv );
				break;
			case MoveEnterType.INSERT_MAIN:
				undo = Game._makeMoveInsertMove.call( this, _mv );
				break;
			default:
			case MoveEnterType.OVERWRITE_MAIN:
				undo = Game._makeMoveOverwriteMain.call( this, _mv );
				break;
			case MoveEnterType.OVERWRITE_LINE:
				undo = Game._makeMoveOverwriteLine.call( this, _mv, inxLine );
				break;
			case MoveEnterType.INSERT_LINE:
				undo = Game._makeMoveInsertLine.call( this, _mv, inxLine );
				break;
		}
		if ( undo )
		{
			_mv.undo = undo;
			return true;
		}
		else
		{
			Log.Exception( "No Undo", "Type=" + mvType + ", mv=" + _mv );
		}
		return false;
	};

	static _makeMoveSetCtx( _mv )
	{
		this.cur.preCalcCtx( _mv );
		var undo = this.cur.makeMove( _mv );
		this.cur.postCalcCtx( _mv, true );

		return undo;
	};

	static _makeMoveOverwriteMain( _mv )
	{
		return Game._makeMoveInMain.call( this, _mv, function( _ln, _mvsToGo )
		{
			_ln.length = _mvsToGo + 1;
		} );
	};

	//private
	static _makeMoveInMain( _mv, _fnCut )
	{
		var undo = Game._makeMoveSetCtx.call( this, _mv );

		if ( !undo )
			Log.Exception( "MoveInMain, no undo", _mv );

		var itmTop = this.stk.Top();

		if ( itmTop )
		{
			var line = itmTop.getLine();
			var mvsToGo = itmTop.getMovesToGo();

			line[ mvsToGo ] = _mv;
			_fnCut( line, mvsToGo );

			itmTop.setMovesToGo( mvsToGo + 1 );

			// need to check remaining moves? 
		}
		_mv.undo = undo;
		this.fireOnMove( _mv );
		this.fireOnCurPosChanged();	// overwrites board attributes in setBoard

		return undo;
	};

	static _makeMoveInsertMove( _mv )
	{

		return Game._makeMoveInMain.call( this, _mv, function( _ln, _mvsToGo )
		{
			Game._cutIllegalMoves( this.cur, _ln, _mvsToGo + 1 );
		}.bind( this ) );
	};


	//private
	static _makeMoveInLine( _mv, _line, _fnCut )
	{
		var undo = Game._makeMoveSetCtx.call( this, _mv );

		var itmTop = this.stk.Top();
		var mvsToGo = itmTop.getMovesToGo();
		var line = itmTop.getLine();

		var mvNext = line[ mvsToGo ];

		var lineToCut = mvNext.getLine( _line );
		lineToCut[ 0 ] = _mv;

		_fnCut( lineToCut );

		var itmNew = new LineStackItem( lineToCut, 1 );

		this.stk.push( itmNew );


		this.fireOnMove();
		this.fireOnCurPosChanged();

		return undo;
	};

	static _makeMoveOverwriteLine( _mv, _line )
	{
		return Game._makeMoveInLine.call( this, _mv, _line, function( _ln ) { _ln.length = 1; } );
	};

	static _makeMoveInsertLine( _mv, _line )
	{
		var fnCut = function( _ln )
		{
			Game._cutIllegalMoves( this.cur, _ln, 1 );
		}.bind( this );

		return Game._makeMoveInLine.call( this, _mv, _line, fnCut );
	};

	static _makeMoveNewLine( _mv )
	{
		var undo = Game._makeMoveSetCtx.call( this, _mv );

		// This.stk == LineStack. Top returns last Element of Array (Wohl ein LineStackItem?)
		var itmTop = this.stk.Top();
		
		// Log.Log("Item top: " + itmTop);

		if ( !itmTop )	// this happens, strange
			return;

		var line = itmTop.getLine();
		var mvsToGo = itmTop.getMovesToGo();

		// NH2020 Wenn Es noch mehr Züge in der Line gibt
		if ( mvsToGo < line.length )
		{
			// Log.Log("There are moves to go.");

			var mvNext = line[ mvsToGo ];
			var lineNew = mvNext.newLine( line, mvsToGo );

			var itmNew = new LineStackItem( lineNew, 0 );
			itmNew.pushMove( _mv );

			this.stk.push( itmNew );
		}
		// NH2020 Wenn es keine Züge mehr in der Line gibt: Neuen Zug hinzufügen.
		else
		{
			// Log.Log("Create New Move");
			itmTop.pushMove( _mv );
		}
		// Log.Log("Fire On Move!");
		this.fireOnMove();
		this.fireOnCurPosChanged();

		return undo;
	};

	static _makeMoveNewMainLine( _mv )
	{
		var undo = Game._makeMoveNewLine.call( this, _mv );
		this.promoteLine();
		return undo;
	};

	//private
	static _cutIllegalMoves( _posStart, _line, _inxStart )
	{
		_inxStart = _inxStart || 0;

		var pos = ObjUtil.clone( _posStart );
		var inxMv = _inxStart;

		for ( ; inxMv < _line.length; ++inxMv )
		{
			var mvToCheck = _line[ inxMv ];

			if ( !pos.isLegalMove( mvToCheck ) )
				break;

			if ( mvToCheck.hasLines() )
			{
				var cnt = mvToCheck.getSubLinesCount();
				for ( var inx = cnt - 1; inx >= 0; --inx )
				{
					var line = mvToCheck.getLine( inx );

					Game._cutIllegalMoves( pos, line );

					if ( line.length === 0 )
						mvToCheck.removeLine( inx );
				}
			}

			pos.makeMove( mvToCheck );
		}
		_line.length = inxMv;
	};

	fromBuf64( str64 )
	{
		var buf = new DataBuffer();
		buf.constructFromBase64( str64 );

		var game = new Game();
		var hdr = new GameHeader();
		hdr.compactFromDataBuf( buf );
		/*var gameType = */ buf.readInt32();
		game.readGameOnly2( buf );
		game.setHeader( hdr );
		this.assign( game );
	};

	write( _buf )
	{
		var inxMv = this.getMoveIndex();
		_buf.writeInt( inxMv );

		var version = 0;
		_buf.writeInt( version );

		this.hdr.write( _buf );

		Game._writeGame.call( this, _buf );
	};

	static _writeStartPos( _buf )
	{
		var init = new Position();
		var normalInit = ObjUtil.equals( this.start, init );

		_buf.writeBool( normalInit );
		if ( !normalInit )
		{
			this.start.write( _buf );
			_buf.writeShort( 0 );
			_buf.writeShort( this.start.getMoveNum() );

			_buf.writeBool( normalInit );
		}
	};

	static _writeMoves( _buf )
	{
		this.mainLine.write( _buf );
	};

	static _writeMoves2( _buf )
	{
		this.mainLine.write2( _buf );
	};

	static _readMoves( _buf )
	{
		this.mainLine.read( _buf );
	};

	static _readMoves2( _buf )
	{
		this.mainLine.read2( _buf );
	};

	read( _buf )
	{
		var inxMv = _buf.readInt();

		/*var version = */_buf.readInt();

		this.hdr.read( _buf );

		Game._readGame.call( this, _buf );

		this.initPost();

		CBDebug.call( this, this.selfTest );

		this.fireOnChanged();

		this.gotoIndex( inxMv );
	};

	read2( _buf )
	{
		// Auskommentiert von MW, da OnlineDB nicht mehr ging.

		//var inxMv = _buf.readInt();	

		//var version = _buf.readInt();

		var ret = false;
		if ( this.hdr.read( _buf ) )
		{
			Game._readGame2.call( this, _buf );
			ret = true;
		}

		this.initPost();

		return ret;

		//CBDebug.call(this, this.selfTest);

		//this.fireOnChanged();

		//this.gotoIndex(inxMv);
	};

	// jb: read3 ist notwendig fur live stream
	read3( _buf )
	{
		var inxMv = _buf.readInt();

	    /*var version = */ _buf.readInt();

		this.hdr.read( _buf );

		Game._readGame2.call( this, _buf );

		_buf.beginSizedWrite();	// see void CBGame::WriteToDataBuffer2
		_buf.endSizedWrite();

		this.initPost();

		CBDebug.call( this, this.selfTest );

		this.fireOnChanged();
		this.fireOnHeaderChanged();

		this.gotoIndex( inxMv );
	};

	// used in CloudManager because of compact header
	readGameOnly2( _buf )
	{
		Game._readGame2.call( this, _buf );
		this.initPost();
	};

	writeGameOnly2( _buf )
	{
		Game._writeGame2.call( this, _buf );
	};


	static _readStartPos( _buf )
	{
		var normalInit = _buf.readBool();
		if ( !normalInit )
		{
			this.start.read( _buf );
			_buf.readShort();
			var numMv = _buf.readShort();

			this.start.setMoveNum( numMv );

			normalInit = _buf.readBool();

			if ( normalInit )
				this.start = new Position();
		}
	};

	static _writeGame( _buf )
	{
		Game._writeStartPos.call( this, _buf );

		var anno = new Annotation();
		anno.write( _buf );

		Game._writeMoves.call( this, _buf );

		_buf.beginSizedWrite();
		_buf.endSizedWrite();
	};

	static _writeGame2( _buf )
	{
		Game._writeStartPos.call( this, _buf );

		//var anno = new Annotation();
		//anno.write( _buf );
		_buf.writeUint8( 0 );

		Game._writeMoves2.call( this, _buf );
	};

	static _readGame( _buf )
	{
		Game._readStartPos.call( this, _buf );
		//start anno...
		var anno = new Annotation();
		anno.read( _buf );
		//		Annotation.readFactory( _buf );
		Game._readMoves.call( this, _buf );

		if ( !anno.empty() )
		{
			this.mainLine.setAnno( anno );
		}
		_buf.beginSizedRead();
		_buf.endSizedRead();
	};

	static _readGame2( _buf )
	{
		Game._readStartPos.call( this, _buf );
		//start anno...
		var anno = new Annotation();
		anno.read2( _buf );
		//		Annotation.readFactory( _buf );
		Game._readMoves2.call( this, _buf );

		if ( !anno.empty() )
		{
			this.mainLine.setAnno( anno );
		}
	};

	static canCut( _mv, _posTarget, _posWrk )
	{
		_posWrk.preSetMinCtx( _mv );

		var sd = _posWrk.sd;

		var mvd = _mv.getMoved();
		/*var vct = */ _posWrk.getPiece( _mv.to );

		var from = _mv.from;
		var to = _mv.to;

		var rFrom = Square.R( from );
		var rTo = Square.R( to );

		var pcPawn = Piece.make( Piece.PAWN, sd );
		var rStart = sd === Side.WHITE ? Square.R_2 : Square.R_7;

		if ( mvd === pcPawn && rFrom === rStart && _posTarget.getPiece( from ) === pcPawn )
			return true;

		var pcKilledPawn = Piece.changeSide( pcPawn );
		var rKilledStart = sd === Side.WHITE ? Square.R_7 : Square.R_2;

		if ( mvd === pcKilledPawn && rTo === rKilledStart && _posTarget.getPiece( to ) === pcKilledPawn )
			return true;

		if ( !!( _posTarget.cr & CastleRights.W_ALL ) )
		{
			if ( mvd === Piece.W_KING )
				return true;
		}
		if ( !!( _posTarget.cr & CastleRights.B_ALL ) )
		{
			if ( mvd === Piece.B_KING )
				return true;
		}


		return false;
	};

	hasPos( _pos )
	{
		return this._findPos( _pos );
	};

	static _findPos( _posTarget, _posWrk, _ln, _stk )
	{
		if ( _ln.isMainLine() && ObjUtil.equals( _posTarget, _posWrk ) )
		{
			_stk.push( new LineStackItem( _ln ) );
			return true;
		}

		var posWrk = ObjUtil.clone( _posWrk );

		for ( var inx = 0; inx < _ln.length; ++inx )
		{
			var mv = _ln[ inx ];

			if ( mv.hasLines() )
			{


				for ( var inxLn = mv.getSubLinesCount() - 1; inxLn >= 0; --inxLn )
				{
					var lnSub = mv.getLine( inxLn );

					_stk.push( new LineStackItem( _ln, inx ) );

					if ( Game._findPos( _posTarget, posWrk, lnSub, _stk ) )
						return true;

					_stk.pop();
				}
			}

			//var mv = new Move(mv.from, mv.to, mv.prom);

			if ( !Game.canCut( mv, _posTarget, posWrk ) )
			{
				posWrk.makeMove( mv );

				if ( ObjUtil.equals( _posTarget, posWrk ) )
				{
					_stk.push( new LineStackItem( _ln, inx + 1 ) );
					return true;
				}
			} else
				return false;
		}

		return false;
	};

	_findPos( _pos )
	{
		var posWrk = this.getStartPos();

		var stk = new LineStack();

		if ( Game._findPos( _pos, posWrk, this.mainLine, stk ) )
			return stk;
		return null;
	};


	gotoPos( _pos, noFire )
	{
		var stk = this._findPos( _pos );
		if ( !stk )
			return false;

		this.gotoStack( stk, noFire );

		CBDebug.call( this, this.selfTest );

		CBDebug.assert( this.cur.equals( _pos ) );

		return true;
	};

	findInTree( tree )
	{
		this.gotoEnd();
		while ( this.getMoveNo() > 0 )
		{
			if ( tree.hasPos( this.getCurPos() ) )
				return this.getMoveNo();
			this.gotoPrev();
		}
		return -1;
	};

}

