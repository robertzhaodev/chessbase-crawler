
export var VersionCodeEnum =
{
	JSPLAYCHESS: 1101,
	JSLIVEBLITZ: 1102,
	JSNLINE: 1103,
	JSOPENINGS: 1104,
	JSPREMIUM: 1105,
	JSFRITZ: 1106,
	JSTEST: 1107,
	JSMYGAMES: 1108,
	JSPLAYERDB: 1109,
	JSTACTICS: 1110,
	JSTACTICSBOARD: 1111,
	JSNLINEBOARD: 1112,
	JSPREMIUMBOARD: 1113,
	JSENDGAMES: 1114,
	JSLIVE: 1115,
	JSREADER: 1116,
	JSPLAY: 1117,
	JSSTUDY: 1118,
	JSINTERACTIVEFRITZ: 1119,
	JSPLUGIN: 1120,
	JSFFLINE: 1121,


	toString: function ( n )
	{
		for ( let a in VersionCodeEnum )
		{
			if ( VersionCodeEnum[a] === n )
				return a;
		}
		return n;
	}
};

export class VersionCode
{
	constructor ( family, major, minor, beta )
	{
		if ( family !== undefined )
			this.nFamily = family;
		else
			this.nFamily = VersionCodeEnum.JSPLAYCHESS;
		if ( major !== undefined )
			this.nMajor = major;
		else
			this.nMajor = 0;
		if ( minor !== undefined )
			this.nMinor = minor;
		else
			this.nMinor = 0;
		if ( beta !== undefined )
			this.nBeta = beta;
		else
			this.nBeta = 0;
	};

	toDataBuf( buf )
	{
		buf.writeInt16( this.nFamily );
		buf.writeInt16( this.nMajor );
		buf.writeInt16( this.nMinor );
		buf.writeInt16( this.nBeta );
		buf.writeInt16( 83 ); // server protocol F13_DF13
		buf.writeInt16( 0 );  // see ShellVersion.cpp
		buf.writeInt32( 0 );  // Flags
		buf.writeInt16( 0 );
		buf.writeInt16( 0 );
	}

	toString()
	{
		return this.familyToString( this.nFamily ) + " " + this.getStrVersion();
	};

	getStrVersion()
	{
		var v = this.nMajor + "." + this.nMinor;

		// if ( this.nBeta )
		// 	v += "." + this.nBeta;
		//
		// if ( System.isCordova() )
		// 	v += "c";
		// if ( System.browserIsSafeForEngine() )
		// 	v += "e";
		// if ( System.isMobile() )
		// 	v += "m";

		return v + 'e';
	};

	familyToString( eFamily )
	{
		switch ( eFamily )
		{
			default:
				return VersionCodeEnum.toString( eFamily );
			case VersionCodeEnum.JSPLAYCHESS:
				return "Playchess";
			case VersionCodeEnum.JSLIVEBLITZ:
				return "LiveBlitz";
			case VersionCodeEnum.JSNLINE:
				return "OnlineDB";
			case VersionCodeEnum.JSOPENINGS:
				return "Openings";
			case VersionCodeEnum.JSFRITZ:
				return "Fritz";
			case VersionCodeEnum.JSMYGAMES:
				return "MyGames";
			case VersionCodeEnum.JSTRAINING:
				return "Training";
			case VersionCodeEnum.JSENDGAMES:
				return "Endgames";
			case VersionCodeEnum.JSLIVE:
				return "Live";
			case VersionCodeEnum.JSREADER:
				return "Reader";
			case VersionCodeEnum.JSPLAY:
				return "Play";
         case VersionCodeEnum.JSSTUDY:
            return "Study";
		}
	}

	GetNCompressedVersion64() 
	{
	   return (((this.nFamily) << 48) | ((this.nMajor) << 32) | ((this.nMinor) << 16) | (this.nBeta));
	}

}


