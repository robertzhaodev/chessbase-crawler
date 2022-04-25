// ES 6 MW: Feb 27, 2020

export class strUtil
{
	static encodeUTF8( s )
	{
		return unescape( encodeURIComponent( s ) );
	};

	static decodeUTF8( s )
	{
		//	return decodeURIComponent( escape( s ) );
		//	return decodeURIComponent( encodeURI( s ) ); // escape is deprecated
		return  strUtil.utf8ArrayToStr( s );
	};

	static test()
	{
		var str = "Rhône";
		var u8 = strUtil.encodeUTF8( str );
		return  strUtil.mayBeUtf8( u8 );
	};

	static utf8ArrayToStr = function( array )
	{
		//Hatten wir doch eine UTF8 Konverting. Achso, wo?
		var out, i, len, c;
		var char2, char3;

		out = "";
		len = array.length;
		i = 0;
		while ( i < len )
		{
			c = array[ i++ ].charCodeAt( 0 );

			switch ( c >> 4 )
			{
				default:
					break;
				case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
					// 0xxxxxxx
					out += String.fromCharCode( c );
					break;
				case 12: case 13:
					// 110x xxxx   10xx xxxx
					if ( i < len )	// ß am Ende eines Strings
						char2 = array[ i++ ].charCodeAt( 0 );
					out += String.fromCharCode( ( ( c & 0x1F ) << 6 ) | ( char2 & 0x3F ) );
					break;
				case 14:
					// 1110 xxxx  10xx xxxx  10xx xxxx
					if ( i < len )
						char2 = array[ i++ ].charCodeAt( 0 );
					if ( i < len )
						char3 = array[ i++ ].charCodeAt( 0 );
					out += String.fromCharCode( ( ( c & 0x0F ) << 12 ) |
						( ( char2 & 0x3F ) << 6 ) |
						( ( char3 & 0x3F ) << 0 ) );
					break;
			}
		}

		return out;
	};

	// from SV Strings
	static mayBeUtf8 = function( str )
	{
		var bUtf8 = false; //  bAnsi = false;
		for ( var i = 0; i < str.length && !bUtf8; i++ )
		{
			var c = str.charCodeAt( i );
			if ( c & 0x80 )
			{
				if ( 0xC2 <= c && c <= 0xDF && 0x80 <= str.charCodeAt( i + 1 ) && str.charCodeAt( i + 1 ) <= 0xBF )
				{
					i += 2;
					bUtf8 = true;
				}
				else if ( ( c == 0xE0 && 0xA0 <= str.charCodeAt( i + 1 ) && str.charCodeAt( i + 1 ) <= 0xBF && 0x80 <= str.charCodeAt( i + 2 ) && str.charCodeAt( i + 2 ) <= 0xBF )
					|| ( ( ( 0xE1 <= c && c <= 0xEC ) || c == 0xEE || c == 0xEF )
						&& 0x80 <= str.charCodeAt( i + 1 ) && str.charCodeAt( i + 1 ) <= 0xBF
						&& 0x80 <= str.charCodeAt( i + 2 ) && str.charCodeAt( i + 2 ) <= 0xBF
					)
					|| ( c == 0xED
						&& 0x80 <= str.charCodeAt( i + 1 ) && str.charCodeAt( i + 1 ) <= 0x9F
						&& 0x80 <= str.charCodeAt( i + 2 ) && str.charCodeAt( i + 2 ) <= 0xBF
					)
				)
				{
					i += 3;
					bUtf8 = true;
				}
				else if ( ( c == 0xF0
					&& 0x90 <= str.charCodeAt( i + 1 ) && str.charCodeAt( i + 1 ) <= 0xBF
					&& 0x80 <= str.charCodeAt( i + 2 ) && str.charCodeAt( i + 2 ) <= 0xBF
					&& 0x80 <= str.charCodeAt( i + 3 ) && str.charCodeAt( i + 3 ) <= 0xBF
				)
					|| ( 0xF1 <= c && c <= 0xF3
						&& 0x80 <= str.charCodeAt( i + 1 ) && str.charCodeAt( i + 1 ) <= 0xBF
						&& 0x80 <= str.charCodeAt( i + 2 ) && str.charCodeAt( i + 2 ) <= 0xBF
						&& 0x80 <= str.charCodeAt( i + 3 ) && str.charCodeAt( i + 3 ) <= 0xBF
					)
					|| ( c == 0xF4
						&& 0x80 <= str.charCodeAt( i + 1 ) && str.charCodeAt( i + 1 ) <= 0x8F
						&& 0x80 <= str.charCodeAt( i + 2 ) && str.charCodeAt( i + 2 ) <= 0xBF
						&& 0x80 <= str.charCodeAt( i + 3 ) && str.charCodeAt( i + 3 ) <= 0xBF
					)
				)
				{
					i += 4;
					bUtf8 = true;
				}
				else
				{
				//	bAnsi = true;
				}
			}
		}
		return bUtf8;
	};

	static hasASCIIgreater127 = function( str )
	{
		for ( var i = 0; i < str.length; i++ )
		{
			var c = str.charCodeAt( i );
			if ( c & 0x80 )
				return true;
		}
		return false;
	};


	static codeURLParameter = function( s )
	{
		return strUtil.base64.encode( s );
	};

	static decodeURLParameter = function( s )
	{
		return strUtil.base64.decode( s );
	};

	static base64 = {

		base64s: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",

		encode( decStr )
		{
			if ( typeof btoa === 'function' )
			{
				return btoa( decStr );
			}
			var base64s = this.base64s;
			var bits;
			var dual;
			var i = 0;
			var encOut = "";
			while ( decStr.length >= i + 3 )
			{
				bits = ( decStr.charCodeAt( i++ ) & 0xff ) << 16 | ( decStr.charCodeAt( i++ ) & 0xff ) << 8 | decStr.charCodeAt( i++ ) & 0xff;
				encOut += base64s.charAt( ( bits & 0x00fc0000 ) >> 18 ) + base64s.charAt( ( bits & 0x0003f000 ) >> 12 ) + base64s.charAt( ( bits & 0x00000fc0 ) >> 6 ) + base64s.charAt( ( bits & 0x0000003f ) );
			}
			if ( decStr.length - i > 0 && decStr.length - i < 3 )
			{
				dual = Boolean( decStr.length - i - 1 );
				bits = ( ( decStr.charCodeAt( i++ ) & 0xff ) << 16 ) | ( dual ? ( decStr.charCodeAt( i ) & 0xff ) << 8 : 0 );
				encOut += base64s.charAt( ( bits & 0x00fc0000 ) >> 18 ) + base64s.charAt( ( bits & 0x0003f000 ) >> 12 ) + ( dual ? base64s.charAt( ( bits & 0x00000fc0 ) >> 6 ) : '=' ) + '=';
			}
			return ( encOut );
		},

		decode( encStr )
		{
			if ( typeof atob === 'function' )
			{
				return atob( encStr );
			}
			var base64s = this.base64s;
			var bits;
			var decOut = "";
			var i = 0;
			for ( i = 0; i < encStr.length; i += 4 )
			{
				bits = ( base64s.indexOf( encStr.charAt( i ) ) & 0xff ) << 18 | ( base64s.indexOf( encStr.charAt( i + 1 ) ) & 0xff ) << 12 | ( base64s.indexOf( encStr.charAt( i + 2 ) ) & 0xff ) << 6 | base64s.indexOf( encStr.charAt( i + 3 ) ) & 0xff;
				decOut += String.fromCharCode( ( bits & 0xff0000 ) >> 16, ( bits & 0xff00 ) >> 8, bits & 0xff );
			}
			if ( encStr.charCodeAt( i - 2 ) === 61 )
			{
				return ( decOut.substring( 0, decOut.length - 2 ) );
			}
			if ( encStr.charCodeAt( i - 1 ) === 61 )
			{
				return ( decOut.substring( 0, decOut.length - 1 ) );
			}

			return ( decOut );
		},

		decodeToBinary( base64 )
		{
			this.lookup = new Uint8Array( 256 );
			for ( var i = 0; i < this.base64s.length; i++ )
			{
				this.lookup[ this.base64s.charCodeAt( i ) ] = i;
			}


			var bufferLength = base64.length * 0.75,
				len = base64.length, i, p = 0,
				encoded1, encoded2, encoded3, encoded4;

			if ( base64[ base64.length - 1 ] === "=" )
			{
				bufferLength--;
				if ( base64[ base64.length - 2 ] === "=" )
				{
					bufferLength--;
				}
			}

			var arraybuffer = new ArrayBuffer( bufferLength ),
				bytes = new Uint8Array( arraybuffer );

			for ( i = 0; i < len; i += 4 )
			{
				encoded1 = this.lookup[ base64.charCodeAt( i ) ];
				encoded2 = this.lookup[ base64.charCodeAt( i + 1 ) ];
				encoded3 = this.lookup[ base64.charCodeAt( i + 2 ) ];
				encoded4 = this.lookup[ base64.charCodeAt( i + 3 ) ];

				bytes[ p++ ] = ( encoded1 << 2 ) | ( encoded2 >> 4 );
				bytes[ p++ ] = ( ( encoded2 & 15 ) << 4 ) | ( encoded3 >> 2 );
				bytes[ p++ ] = ( ( encoded3 & 3 ) << 6 ) | ( encoded4 & 63 );
			}

			return arraybuffer;

		}
	};

	static getURLParam = function( paramName )
	{
		//    paramName = paramName.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		paramName = paramName.replace( /[\[]/, "\\[" ).replace( /[\]]/, "\\]" );

		var regexS = "[\\?&]" + paramName + "=([^&#]*)";
		var regex = new RegExp( regexS );
		var results = regex.exec( window.location.href );

		if ( results === null )
		{
			return "";
		}

		// remove trailing /
		var ret = results[ 1 ];
		if ( ret.length && ret.charAt( ret.length - 1 ) == '/' )
			ret = ret.slice( 0, ret.length - 1 );

		return ret;
	};

	static shortenURL = function( url )
	{
		if ( url )
		{
			var shortURL = url.toLowerCase();
			shortURL.replace( /</g, "(" );		// no tags please
			shortURL.replace( />/g, ")" );
			if ( shortURL && shortURL.length > 15 )
			{
				if ( url.search( "http://" ) != -1 )
				{
					shortURL = shortURL.slice( 7 );
				}
				if ( url.search( "https://" ) != -1 )
				{
					shortURL = shortURL.slice( 8 );
				}
				var nFirstSlash = shortURL.indexOf( '/' );
				if ( nFirstSlash > 0 )
					shortURL = shortURL.slice( 0, nFirstSlash );
			}
			return shortURL;
		}
		return "";
	};

	static trimQuotes = function( str )
	{
		var ret = str;

		ret = ret.replace( "%22", "\"" );
		//	ret = ret.replace( "%22", "\"" );
		ret = ret.replace( "%27", "'" );
		//	ret = ret.replace( "%27", "'" );

		if ( ret.charAt( 0 ) == '"' || ret.charAt( 0 ) == "'" )
			ret = ret.slice( 1, ret.length - 1 );

		return ret;
	};

	static escapeHtmlEntities = function( text )
	{
		return text.replace( /[\u00A0-\u2666<>\&]/g,
			function( c )
			{
				return '&#' + c.charCodeAt( 0 ) + ';';
			} );
	};

static htmlEncode = function( text )
{
	return text.replace( /[\u00A0-\u2666<>\&]/g,
		function( c )
		{
			return '&#' + c.charCodeAt( 0 ) + ';';
		} );
};

static htmlDecode = function( str )
{
	return str.replace( /&#(\d+);/g, function( match, dec )
	{
		return String.fromCharCode( dec );
	} );
};

static tryConvertCyrillicAscii = function( str )
{
	var cnt8BitAscii = 0;
	var ret = "";
	for ( var i = 0; i < str.length; i++ )
	{
		var c = str.charCodeAt( i );
		if ( c > 255 )
			return str;
		if ( c > 127 )
			cnt8BitAscii++;
		var cy = this.conv1252[ c ];
		ret += String.fromCharCode( cy );
	}
	if ( cnt8BitAscii > 0.7 * str.length )
		return ret;
	return str;
};

static conv1252 = [
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0x0020, 0x0021, 0x0022, 0x0023, 0x0024, 0x0025, 0x0026, 0x0027,
	0x0028, 0x0029, 0x002A, 0x002B, 0x002C, 0x002D, 0x002E, 0x002F,
	0x0030, 0x0031, 0x0032, 0x0033, 0x0034, 0x0035, 0x0036, 0x0037,
	0x0038, 0x0039, 0x003A, 0x003B, 0x003C, 0x003D, 0x003E, 0x003F,
	0x0040, 0x0041, 0x0042, 0x0043, 0x0044, 0x0045, 0x0046, 0x0047,
	0x0048, 0x0049, 0x004A, 0x004B, 0x004C, 0x004D, 0x004E, 0x004F,
	0x0050, 0x0051, 0x0052, 0x0053, 0x0054, 0x0055, 0x0056, 0x0057,
	0x0058, 0x0059, 0x005A, 0x005B, 0x005C, 0x005D, 0x005E, 0x005F,
	0x0060, 0x0061, 0x0062, 0x0063, 0x0064, 0x0065, 0x0066, 0x0067,
	0x0068, 0x0069, 0x006A, 0x006B, 0x006C, 0x006D, 0x006E, 0x006F,
	0x0070, 0x0071, 0x0072, 0x0073, 0x0074, 0x0075, 0x0076, 0x0077,
	0x0078, 0x0079, 0x007A, 0x007B, 0x007C, 0x007D, 0x007E, 0x0402,
	0x0403, 0x201A, 0x0453, 0x201E, 0x2026, 0x2020, 0x2021, 0x20AC,
	0x2030, 0x0409, 0x2039, 0x040A, 0x040C, 0x040B, 0x040F, 0x0452,
	0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, 0x2122,
	0x0459, 0x203A, 0x045A, 0x045C, 0x045B, 0x045F, 0x00A0, 0x040E,
	0x045E, 0x0408, 0x00A4, 0x0490, 0x00A6, 0x00A7, 0x0401, 0x00A9,
	0x0404, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x0407, 0x00B0, 0x00B1,
	0x0406, 0x0456, 0x0491, 0x00B5, 0x00B6, 0x00B7, 0x0451, 0x2116,
	0x0454, 0x00BB, 0x0458, 0x0405, 0x0455, 0x0457, 0x0410, 0x0411,
	0x0412, 0x0413, 0x0414, 0x0415, 0x0416, 0x0417, 0x0418, 0x0419,
	0x041A, 0x041B, 0x041C, 0x041D, 0x041E, 0x041F, 0x0420, 0x0421,
	0x0422, 0x0423, 0x0424, 0x0425, 0x0426, 0x0427, 0x0428, 0x0429,
	0x042A, 0x042B, 0x042C, 0x042D, 0x042E, 0x042F, 0x0430, 0x0431,
	0x0432, 0x0433, 0x0434, 0x0435, 0x0436, 0x0437, 0x0438, 0x0439,
	0x043A, 0x043B, 0x043C, 0x043D, 0x043E, 0x043F, 0x0440, 0x0441,
	0x0442, 0x0443, 0x0444, 0x0445, 0x0446, 0x0447, 0x0448, 0x0449,
	0x044A, 0x044B, 0x044C, 0x044D, 0x044E, 0x044F ];

}

///////////////////////////////////////////////////////////////////////////////////////////////////18.01.2013
// Byte Formats

export function byteswap_ushort( nSwap )
{
	var aBuf = new ArrayBuffer( 2 );
	var aView = new DataView( aBuf );
	aView.setUInt16( 0, nSwap );
	var a = aView.GetUint8();
	aView.SetUint8( 0, aView.GetUint8( 1 ) );
	aView.SetUint8( 1, a );
	return aView.GetUint16( 0 );
}

export function byteswap_ulong( nSwap )
{
	var aBuf = new ArrayBuffer( 4 );
	var aView = new DataView( aBuf );
	aView.setUInt32( 0, nSwap );
	var aBuf2 = new ArrayBuffer( 4 );
	var aView2 = new DataView( aBuf2 );
	for ( var i = 0; i < 4; i++ )
		aView2.setUint8( i, aView.getUint8( 3 - i ) );

	return aView2.GetUint32( 0 );
}

export function byteswap_uint64( nSwap )
{
	var aBuf = new ArrayBuffer( 8 );
	var aView = new DataView( aBuf );
	aView.setUInt64( 0, nSwap );
	var aBuf2 = new ArrayBuffer( 8 );
	var aView2 = new DataView( aBuf2 );
	for ( var i = 0; i < 8; i++ )
		aView2.setUint8( i, aView.getUint8( 7 - i ) );

	return aView2.GetUint64( 0 );
}



///////////////////////////////////////////////////////////////////////////////////////////
// Num, Integer

export function idiv( _a, _b )
{
	return ( _a - ( _a % _b ) ) / _b;
};

export function isNumber( _str )
{
	return !isNaN( parseInt( _str, 10 ) );
}

////////////////////////////////////////////////////////////////////////////////////////////
// Flags:

export function setFlag( obj, bits, boolVal )
{
	if ( typeof ( bits ) != "number" )
		throw ( Error( "setFlag: number expected for bits" ) );
	if ( obj.flags === undefined )
		obj.flags = 0;
	if ( boolVal )
		obj.flags = obj.flags | bits;
	else
		obj.flags = obj.flags & ~bits
};

export function isFlag( flags, bits )
{
	return ( flags & bits ) !== 0;
};

/////////////////////////////////////////////////////////////////////////////////////////////
// Time

export class TimeTools
{
	static getCBTimeOfCentiSecs( centiSecs )
	{
		var jsTime = new Date( centiSecs * 10 );
		var cbTime = ( jsTime.getUTCHours() << 24 )
			| ( jsTime.getUTCMinutes() << 16 )
			| ( jsTime.getUTCSeconds() << 8 )
			| ( jsTime.getUTCMilliseconds() / 10);

		return cbTime;
	};
}
