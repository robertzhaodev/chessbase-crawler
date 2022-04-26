/* mw 18.2.2013 */
// ES 6 MW: Feb 27, 2020

import { strUtil } from '../Tools/Tools.js'
import { CBDate } from "../Tools/CBDate.js";
import { Time } from '../Tools/Time.js'
import {BinToString} from './BinToString.js'
import { CBDebug } from "../Tools/Debug/debug_util.js";

//// Constructor:
export class DataBuffer
{
   constructor()
   {
      this.nPos = 0;
      this.nSize = 0;
      this.buffer = new ArrayBuffer( 188 );
      this.viewBuf = new DataView( this.buffer );

      this.nSizeMarker = [];
      this.nMarkedSize = [];

   };

   // Public:
   clear()
   {
      this.nPos = 0;
      this.nSize = 0;
      this.nSizeMarker = [];
      this.nMarkedSize = [];
   };

   rewind()
   {
      this.nPos = 0;
      this.nSizeMarker = [];
      this.nMarkedSize = [];
   }

   getPos()
   {
      return this.nPos;
   }

   // warning implementation incomplete due to swapBytes in this.viewBuf
   setPos( nNewPos )
   {
      if ( nNewPos <= this.nSize && nNewPos <= this.buffer.byteLength )
      {
         this.nPos = nNewPos;
      }
      else
         throw (  Error("Error: SetPos exceeds DataBuffer size" ));
   }


   // getLogicalSize in C++
   getSize()
   {
      return this.nSize;
   }

   setSize( n )
   {
      if ( n >= this.buffer.byteLength )
         throw (Error( "DBuf setSize illegal" ));
      this.nSize = n;
   }

   getWriteSize()
   {
      return this.nSize + 4;
   }

   // NH2020 Added this. Important!
   getCheckSum16 ()
   {
      var sum = 0;

//      console.log( "getCheck: ")
      for ( var i = 0; i < this.nSize; i++ )
      {
         sum += ( this.viewBuf.getUint8( i ) + i );
   //       console.log( "check: " + sum );
      }
      var check = Math.abs( sum % 0x7fff );
      //  console.log( "Check Result = " + check );
      return check;
   };

   writeToDataView( dataView, nFirstPos )
   {
      dataView.setInt32( nFirstPos, this.nSize );
      this._swapBytes( dataView, nFirstPos, 4 );        // little endian required
      nFirstPos += 4;
      for ( var i = 0; i < this.nSize; i++ )
      {
         dataView.setUint8( i + nFirstPos, this.viewBuf.getUint8( i ) );
      }
      return this.nSize + 4; // NH2020 Added this. Important!
   };

   readFromDataView( dataView, nFirstPos )
   {
      this._swapBytes( dataView, nFirstPos, 4 );        // little endian required
      var nSize = dataView.getInt32( nFirstPos );
      if ( nSize < 350000 && nSize >= 0 )
      {
         this._checkAlloc( nSize );
         nFirstPos += 4;
         for ( var i = 0; i < nSize; i++ )
         {
            var uint8 = dataView.getUint8( i + nFirstPos );
            this.viewBuf.setUint8( i, uint8 );
         }
         this._incSize( nSize );
      }
      //"#IFDEBUG"
      // if ( nSize >= 350000 || nSize < 0 )
      //    Log.Log( "Cannot Read DBuf from View, size=" + nSize, "LogError" );
      //"#ENDIF"
   };

   writeString( strUnicode )
   {
      var strUTF8 = strUtil.encodeUTF8( strUnicode );
      this.writeUTFString( strUTF8 );
      //this._checkAlloc( strUTF8.length + 4 );
      //this.writeInt32( strUTF8.length );
      //for ( var i = 0; i < strUTF8.length; i++ ) {
      //	var n = strUTF8.charCodeAt( i );
      //	this.viewBuf.setUint8( this.nPos + i, n );
      //}
      //this._incSize( strUTF8.length );
   };

   writeUTFString( strUTF8 ) // same as writeASCIIString 
   {
      this._checkAlloc( strUTF8.length + 4 );
      this.writeInt32( strUTF8.length );
      for ( var i = 0; i < strUTF8.length; i++ )
      {
         var n = strUTF8.charCodeAt( i );
         this.viewBuf.setUint8( this.nPos + i, n );
      }
      this._incSize( strUTF8.length );
   };

   readString( nMaxLen )
   {
      var strUnicode;
      var nLen = this.readInt32();
      if ( nLen <= nMaxLen && nLen < 250000 )
      {
         var strUTF8 = "";
         for ( var i = 0; i < nLen; i++ )
         {
            var n = this.viewBuf.getUint8( this.nPos + i );
            // efficient in modern browsers due to optimization (see http://jsperf.com/)
            strUTF8 += String.fromCharCode( n );
         }
         strUnicode = strUtil.decodeUTF8( strUTF8 );
         this.nPos += nLen;
      }
      else
         throw ( new Error( "data Error: Read Strings" ) );

      return strUnicode;
   };

   writeASCIIString( str )
   {
      this._checkAlloc( str.length + 4 );
      this.writeInt32( str.length );
      for ( var i = 0; i < str.length; i++ )
      {
         var n = str.charCodeAt( i );
         this.viewBuf.setUint8( this.nPos + i, n );
      }
      this._incSize( str.length );
   };

   readASCIIString( nMaxLen )
   {
      var strASCII = "";
      var nLen = this.readInt32();
      if ( nLen <= nMaxLen && nLen < 250000 )
      {
         for ( var i = 0; i < nLen; i++ )
         {
            var n = this.viewBuf.getUint8( this.nPos + i )
            strASCII += String.fromCharCode( n );
         }
         this.nPos += nLen;
      }
      else
         throw ( new Error( String.f( "data Error: Read Strings, Len={0}, maxLen={1}", nLen, nMaxLen ) ) );

      return strASCII;
   };

   writeByteLenASCIIString( str )
   {
      this._checkAlloc( str.length + 2 );
      this.writeUint8( str.length + 1 );
      for ( var i = 0; i < str.length; i++ )
      {
         var n = str.charCodeAt( i );
         this.viewBuf.setUint8( this.nPos + i, n );
      }
      this.viewBuf.setUint8( this.nPos + str.length, 0 );

      this._incSize( str.length + 1 );
   };

   readByteLenASCIIString( nMaxLen )
   {
      var strASCII = "";
      var nLen = this.readUint8();
      if ( nLen > 0 )
         nLen -= 1;	// ignore trailing zero
      if ( nLen < 1000 )
      {
         for ( var i = 0; i < nLen; i++ )
         {
            var n = this.viewBuf.getUint8( this.nPos + i )
            strASCII += String.fromCharCode( n );
         }
         if ( nLen <= nMaxLen )
            this.nPos += nLen + 1;
         else
         {
            throw ( new Error(`data Error: Read ByteLenString, len=${nLen}, maxLen=${nMaxLen}`) );
         }
      }
      else
         throw ( new Error( String.f( "data Error: Read ByteLenString > 1000, len={0}", nLen ) ) );

      return strASCII;
   };

   readSizedString( len )
   {
      var strASCII = "";
      if ( len < 250000 )
      {
         for ( var i = 0; i < len; i++ )
         {
            var n = this.viewBuf.getUint8( this.nPos + i );
            // efficient in modern browsers due to optimization (see http://jsperf.com/)
            strASCII += String.fromCharCode( n );
         }
         this.nPos += len;
      }
      else
         throw ( new Error( "data Error: Read SizedString, max=" + len ) );

      return strASCII;
   };


   // used in annotations, no string length written (it is calculated from anno len)
   writeSizedString( str )
   {
      var len = str.length;
      this._checkAlloc( len );
      for ( var i = 0; i < len; i++ )
      {
         var n = str.charCodeAt( i );
         this.viewBuf.setUint8( this.nPos + i, n );
      }
      this._incSize( len );
   };

   readSizedUTF8String( len )
   {

      var strUnicode;
      if ( len < 250000 )
      {
         var strUTF8 = "";
         for ( var i = 0; i < len; i++ )
         {
            var n = this.viewBuf.getUint8( this.nPos + i );
            // efficient in modern browsers due to optimization (see http://jsperf.com/)
            strUTF8 += String.fromCharCode( n );
         }
         strUnicode = strUtil.decodeUTF8( strUTF8 );
         this.nPos += len;
      }
      else
         throw ( new Error( "data Error: Read UTF8String, len=" + len ) );

      return strUnicode;

   };

   readByteArray( len )
   {
      var arr = [];
      for ( var i = 0; i < len && this.nPos + i < this.nSize; i++ )
      {
         arr.push( this.viewBuf.getUint8( this.nPos + i ) );
      }

      this.nPos += len;

      return arr;
   };

   writeByteArray( arr, len )
   {
      for ( var i = 0; i < arr.length && i < len; i++ )
      {
         this.writeByte( arr[ i ] );
      }
   };

   writeDataBuffer( buf )
   {
      this.writeInt32( buf.getSize() );
      this._checkAlloc( buf.getSize() );

      for ( var i = 0; i < buf.getSize(); i++ )
      {
         this.viewBuf.setUint8( this.nPos + i, buf.viewBuf.getUint8( i ) );
      }
      this._incSize( buf.getSize() );
   };

   readDataBuffer()
   {
      var buf = new DataBuffer();

      var size = this.readInt32();
      buf._checkAlloc( size );
      for ( var i = 0; i < size; i++ )
      {
         buf.viewBuf.setUint8( i, this.viewBuf.getUint8( this.nPos + i ) );
      }
      this.nPos += size;
      buf._incSize( size );
      buf.nPos = 0;	// return in rewound state

      return buf;
   };

   writeData( buf )
   {
      this._checkAlloc( buf.getSize() );

      for ( var i = 0; i < buf.getSize(); i++ )
      {
         this.viewBuf.setUint8( this.nPos + i, buf.viewBuf.getUint8( i ) );
      }
      this._incSize( buf.getSize() );
   };


   writeBool( b )
   {
      if ( b === undefined )
      {
         throw ( Error( "writeBool, value undefined" ) );
      }

      this._checkAlloc( 1 );
      if ( b )
         this.viewBuf.setUint8( this.nPos, 1 );
      else
         this.viewBuf.setUint8( this.nPos, 0 );
      this._incSize( 1 );
   };

   readBool()
   {
      let b = this.viewBuf.getUint8( this.nPos );
      this.nPos += 1;
      return b !== 0;
   };

   writeUint8( nUint8 )
   {
      if ( nUint8 === undefined )
      {
         throw ( Error( "writeUint8, value undefined" ) );
      }

      this._checkAlloc( 1 );
      this.viewBuf.setUint8( this.nPos, nUint8 );
      this._incSize( 1 );
   };

   readUint8()
   {
      var nRet = this.viewBuf.getUint8( this.nPos );
      this.nPos += 1;
      return nRet;
   }

   readByte = this.readUint8;
   writeByte = this.writeUint8;

   writeInt16( nInt16 )
   {
      if ( nInt16 === undefined )
      {
         throw ( Error( "writeInt16, value undefined" ) );
      }

      this._checkAlloc( 2 );
      this.viewBuf.setInt16( this.nPos, nInt16 );
      this._swapBytes( this.viewBuf, this.nPos, 2 );
      this._incSize( 2 );
   }

   readInt16()
   {
      var nRet = 0;
      if ( this.nPos <= this.viewBuf.byteLength - 2 )
      {
         this._swapBytes( this.viewBuf, this.nPos, 2 );
         nRet = this.viewBuf.getInt16( this.nPos );
         this._swapBytes( this.viewBuf, this.nPos, 2 );	// leave buffer intact because of setPos/getPos
         this.nPos += 2;
      }
      return nRet;
   };

   readShort = this.readInt16;
   writeShort = this.writeInt16;

   writeUint16( nUint16 )
   {
      if ( nUint16 === undefined )
      {
         throw ( Error( "writeUint16, value undefined" ) );
      }

      this._checkAlloc( 2 );
      this.viewBuf.setUint16( this.nPos, nUint16 );
      this._swapBytes( this.viewBuf, this.nPos, 2 );
      this._incSize( 2 );
   };

   readUint16()
   {
      var nRet = 0;
      if ( this.nPos <= this.viewBuf.byteLength - 2 )
      {
         this._swapBytes( this.viewBuf, this.nPos, 2 );
         nRet = this.viewBuf.getUint16( this.nPos );
         this._swapBytes( this.viewBuf, this.nPos, 2 );	// leave buffer intact because of setPos/getPos
         this.nPos += 2;
      }
      return nRet;
   };

   writeInt32( nInt32 )
   {
      if ( nInt32 === undefined )
      {
         throw ( Error( "writeInt32, value undefined" ) );
      }
      this._checkAlloc( 4 );
      this.viewBuf.setInt32( this.nPos, nInt32 );
      this._swapBytes( this.viewBuf, this.nPos, 4 );
      this._incSize( 4 );
   };

   writeFakeInt64( nInt32 )
   {
      this.writeInt32( nInt32 );
      this.writeInt32( 0 );	// if protocol requires 64Bit int
   };

   readFakeInt64()
   {
      var nRet = this.readInt32();
      this.readInt32(); // must be zero!
      return nRet;
   };

   readInt32()
   {
      var nRet = 0;
      if ( this.nPos <= this.viewBuf.byteLength - 4 )
      {
         this._swapBytes( this.viewBuf, this.nPos, 4 );
         nRet = this.viewBuf.getInt32( this.nPos );
         this._swapBytes( this.viewBuf, this.nPos, 4 );	// leave buffer intact because of setPos/getPos
         this.nPos += 4;
      }
      return nRet;
   };

   writeInt = this.writeInt32;
   readInt = this.readInt32;

   writeUint32( nUint32 )
   {
      this._checkAlloc( 4 );
      this.viewBuf.setUint32( this.nPos, nUint32 );
      this._swapBytes( this.viewBuf, this.nPos, 4 );
      this._incSize( 4 );
   };

   readUint32()
   {
      var nRet = 0;
      if ( this.nPos <= this.viewBuf.byteLength - 4 )
      {
         this._swapBytes( this.viewBuf, this.nPos, 4 );
         nRet = this.viewBuf.getUint32( this.nPos );
         this._swapBytes( this.viewBuf, this.nPos, 4 );	// leave buffer intact because of setPos/getPos
         this.nPos += 4;
      }
      return nRet;
   };

   writeCBDate( aDate )
   {
      var nDate = ( aDate.getYear() << 9 ) | ( aDate.getMonth() << 5 ) | aDate.getDay();
      this.writeUint32( nDate );
   };

   readCBDate()
   {
      // NH2020 assuming CBDate
      var aDate = new CBDate();
      var dateAsInt = this.readUint32();
      aDate.setYear( dateAsInt >> 9 );
      aDate.setMonth( ( dateAsInt >> 5 ) & 0x0f );
      aDate.setDay( dateAsInt & 0x1f );
      return aDate;
   };

   readCBTime()
   {
      var timeAsInt = this.readUint32();
      var aTime = new Time( timeAsInt );
      return aTime;
   };

   writeInt64( nInt64 )
   {
      if ( nInt64 === undefined )
      {
         throw ( Error( "writeInt64, value undefined" ) );
      }

      var higherPart = Math.floor( nInt64 / 4294967296.0 );
      var lowerPart = nInt64 - higherPart;
      this.writeInt32( lowerPart );
      this.writeInt32( higherPart );
   };

   readUint64()
   {
      if ( this.nPos <= this.viewBuf.byteLength - 8 )
      {
         this._swapBytes( this.viewBuf, this.nPos, 8 );
         var nRetHigh = this.viewBuf.getUint32( this.nPos );
         this.nPos += 4;
         var nRetLow = this.viewBuf.getUint32( this.nPos );
         this.nPos += 4;
         return ( nRetHigh * 4294967296.0 ) + nRetLow;
      }
      else
         return 0;
   };

   readInt64()
   {
      if ( this.nPos <= this.viewBuf.byteLength - 8 )
      {
         this._swapBytes( this.viewBuf, this.nPos, 8 );		// now in BE format.
         var nRetHigh = this.viewBuf.getInt32( this.nPos );
         this.nPos += 4;
         var nRetLow = this.viewBuf.getUint32( this.nPos );
         this.nPos += 4;
         return ( nRetHigh * 4294967296.0 ) + nRetLow;
      }
      else
         return 0;
   };

   writeFloat32( float32 )
   {
      this._checkAlloc( 4 );
      this.viewBuf.setFloat32( this.nPos, float32 );
      this._swapBytes( this.viewBuf, this.nPos, 4 );
      this._incSize( 4 );
   };

   readFloat32()
   {
      this._swapBytes( this.viewBuf, this.nPos, 4 );
      var nRet = this.viewBuf.getFloat32( this.nPos );
      this.nPos += 4;
      return nRet;
   };

   writeFloat64( float64 )
   {
      this._checkAlloc( 8 );
      this.viewBuf.setFloat64( this.nPos, float64 );
      this._swapBytes( this.viewBuf, this.nPos, 8 );
      this._incSize( 8 );
   };

   readFloat64()
   {
      this._swapBytes( this.viewBuf, this.nPos, 8 );
      var nRet = this.viewBuf.getFloat64( this.nPos );
      this.nPos += 8;
      return nRet;
   };

   exportAsCompressedString()
   {
      var nSize = this.getSize();

      var strOut = "";

      var vecByte = [];
      for ( var i = 0; i < nSize; i++ )
      {
         var n = this.viewBuf.getUint8( i );
         vecByte[ i ] = n;
      }

      strOut = BinToString.ByteArrayToString( vecByte, nSize );
      return strOut;
   }


   constructFromString( strText, bCompressed )
   {
      this.clear();

      if ( bCompressed )
      {
         var aMsg = [];

         var nLen = BinToString.StringToByteArray( aMsg, strText );
         if ( nLen > 0 )
         {
            for ( var n = 0; n < nLen; n++ )
            {
               this.writeByte( aMsg[ n ] );
            }
         }
      }
      else
      {
         var nSize = 0;
         if ( strText.length > 10 )
         {
            nSize = parseInt( strText.substr( 0, 10 ), 10 );
         }
         if ( nSize < 0 )
            nSize = 0;
         for ( var x = 0; x < nSize; x++ )
         {
            var strElement = strText.substr( 10 + x * 2, 2 );
            var bElement = parseInt( strElement, 16 );
            this.writeByte( bElement );
         }
      }
   }

   constructFromBase64( strText )
   {
      this.clear();

      // var buffer = null;
      var value = strUtil.base64.decodeToBinary( strText );
      var view = new Uint8Array( value );
      for ( var i = 0; i < value.byteLength; i++ )
      {
         this.writeByte( view[ i ] );
      }

      this.writeByteArray( value, value.byteLength );

      this.rewind();
   };

   readBEInt32()
   {
      var v1 = this.readUint8();
      var v2 = this.readUint8();
      var v3 = this.readUint8();
      var v4 = this.readUint8();

      return ( v1 << 24 ) | (v2 << 16 )| (v3 << 8) | v4;
   };

   writeBEInt32( nInt32 )
   {
      if ( nInt32 === undefined )
      {
         throw ( Error( "writeInt32, value undefined" ) );
      }
      this._checkAlloc( 4 );
      this.viewBuf.setInt32( this.nPos, nInt32 );
      // this._swapBytes( this.viewBuf, this.nPos, 4 );
      this._incSize( 4 );
   };


   readBEInt24()
   {
      var v1 = this.readUint8();
      var v2 = this.readUint8();
      var v3 = this.readUint8();

      return (v1 << 16) | (v2 << 8 )| v3;
   };

   readBEInt16()
   {
      var v1 = this.readUint8();
      var v2 = this.readUint8();

      return v1 * 256 + v2;

      // TODO: more efficient.
      //var nRet = this.viewBuf.getUint16( this.nPos );
      //this.nPos += 2;
      //return nRet;
   };

   writeBEInt24( n )
   {
      var v1 = n >> 16,
         v2 = n >> 8,
         v3 = n & 255;
      this.writeUint8( v1 );
      this.writeUint8( v2 );
      this.writeUint8( v3 );
   };

   writeBEInt16( n )
   {
      var v1 = n >> 8,
         v2 = n & 255;
      this.writeUint8( v1 );
      this.writeUint8( v2 );
   };

   writeArray( arr )
   {
      var len = arr.length;
      this.writeInt32( len );

      for ( var inx = 0; inx < len; ++inx )
      {
         arr[ inx ].write( this );
      }
   };

   writeArrayShort( arr )
   {
      var len = arr.length;
      this.writeInt16( len );

      for ( var inx = 0; inx < len; ++inx )
      {
         arr[ inx ].write( this );
      }
   };

   readArray( arr, fnRdr )
   {
      var len = this.readInt32();

      if ( len > 65534 )
         CBDebug.assert( len < 65535 );

      arr.length = len;
      for ( var inx = 0; inx < len; ++inx )
      {
         var obj = fnRdr( this );
         arr[ inx ] = obj;
      }
   };

   readArrayShort( arr, fnRdr )
   {
      var len = this.readInt16();

      arr.length = len;
      for ( var inx = 0; inx < len; ++inx )
      {
         var obj = fnRdr( this );
         arr[ inx ] = obj;
      }
   };

   beginSizedWrite()
   {
      this.nSizeMarker.push( this.getPos() );
      this.writeInt32( 0 );
   };

   endSizedWrite()
   {
      var nCurrPos = this.getPos();
      if ( this.nSizeMarker.length > 0 )
      {
         this.setPos( this.nSizeMarker[ this.nSizeMarker.length - 1 ] );
         var keepSize = this.nSize; // size has already been incremented in beginSizedWrite
         this.writeInt32( nCurrPos - this.nSizeMarker[ this.nSizeMarker.length - 1 ] - 4 );
         this.nSize = keepSize;
         this.setPos( nCurrPos );
         this.nSizeMarker.pop();
      }
      else
         throw Error( "DB::EndWrite" );
   };

   beginSizedRead()
   {
      this.nSizeMarker.push( this.getPos() );
      this.nMarkedSize.push( this.readInt32() );
   };

   endSizedRead()
   {
      if ( this.nSizeMarker.length > 0 && this.nMarkedSize.length > 0 )
      {
         var nSizeRead = this.getPos() - this.nSizeMarker[ this.nSizeMarker.length - 1 ] - 4;
         this.skip( this.nMarkedSize[ this.nMarkedSize.length - 1 ] - nSizeRead );
         this.nSizeMarker.pop();
         this.nMarkedSize.pop();
      }
      else
         throw Error( "DB::EndRead" );
   };

   skipSizedRead()
   {
      var len = this.readInt32();
      this.skip( len );
   };

   skip( n )
   {
      if ( this.nPos + n <= this.nSize )
      {
         this.nPos += n;
      }
      //else
      //   throw ( Error( "DB::Skip" ) );
   };

   writeAtPrevPos( nPrevPos, fnWrite )
   {
      var savePos = this.getPos();
      this.setPos( nPrevPos );
      fnWrite();
      this.setPos( savePos );
   };


   //// Protected: //////////////////////////////////////////////////////////////////////////

   _checkAlloc( nNew )
   {
      if ( this.nPos + nNew >= this.buffer.byteLength || this.nSize + nNew >= this.buffer.byteLength )
      {
         var maxS = Math.max( this.nPos, this.nSize );

         var nNewBufSize = Math.floor( ( ( ( maxS + nNew ) * 3 ) / 16. ) + 1 ) * 8; // 3/2 of old size, rounded to be divisible by 8
         if ( nNewBufSize < nNew + maxS )
            throw new Error( "DataBuffer Size" );
         var newBuffer = new ArrayBuffer( nNewBufSize );
         var viewNew = new DataView( newBuffer );
         // copy in 4 byte chunks:
         for ( var i = 0; i < this.buffer.byteLength / 4; i++ )
            viewNew.setUint32( i * 4, this.viewBuf.getUint32( i * 4 ) );
         this.buffer = newBuffer;
         this.viewBuf = viewNew;
         //	Log.Log( "NewBufSize=" + this.buffer.byteLength );
      }
   }

   _incSize( nLen )
   {
      if ( this.nPos + nLen >= this.buffer.byteLength )
      {
         // "#IFDEBUG"
         // alert( "DBuf._incSize: " + this.nSize + ", " + nLen );
         // "#ENDIF"
         throw new Error( "DataBuffer overrun" );
      }
      this.nPos += nLen;
      this.nSize += nLen;
      if ( this.nSize >= this.buffer.byteLength )
      {
         throw new Error( "DataBuffer Size Limit exc." );
      }
   }
bufSwap
   // All numbers are little endian in C++ DataBuffer:
   _swapBytes( view, nStart, nLen )
   {
      var bufSwap = [];
      for ( let i = 0; i < nLen; i++ )
         bufSwap.push( view.getUint8( nStart + i ) );

      for ( let i = 0; i < nLen; i++ )
         view.setUint8( nStart + i, bufSwap[ nLen - i - 1 ] );
   }

   toStringDebug() {
      return `s=${this.getSize()}, p=${this.getPos()}, nMaskSize=${this.nMarkedSize}, nSizeMarker=${this.nSizeMarker}`
   }

}

///////////////////////////////////////////////////////////////////////////////////////////////////17.01.2013

// function testDataBuffers( nArraySize )
// {
//    var buf1 = new DataBuffer();
//    buf1.writeString( "Максим Горький" );
//    var bool1 = true;
//    var bool2 = false;

//    buf1.writeInt32( nArraySize );
//    for ( var i = 0; i < nArraySize; i++ )
//       buf1.writeInt32( i );
//    buf1.writeInt32( nArraySize );
//    for ( var i = 0; i < nArraySize; i++ )
//       buf1.writeUint32( i * i );
//    buf1.writeBool( bool1 );
//    buf1.writeBool( bool2 );

//    // Read: 
//    buf1.rewind();
//    var str = buf1.readString( 200 );
//    if ( str != "Максим Горький" )
//       return false;
//    textOut( str );
//    var nLenRead = buf1.readInt32();
//    for ( var i = 0; i < nLenRead; i++ )
//       if ( buf1.readInt32() != i )
//          return false;
//    nLenRead = buf1.readInt32();
//    for ( var i = 0; i < nLenRead; i++ )
//       if ( buf1.readUint32() != i * i )
//          return false;

//    if ( buf1.readBool() != bool1 )
//       return false;
//    if ( buf1.readBool() != bool2 )
//       return false;

//    var buf3 = new DataBuffer();
//    buf3.beginSizedWrite();
//    buf3.writeInt32( 0xaaaa );
//    buf3.beginSizedWrite();
//    buf3.writeInt32( 0x23 );
//    buf3.beginSizedWrite();
//    buf3.writeInt32( 0x5555 );
//    buf3.endSizedWrite();
//    buf3.endSizedWrite();
//    var fTest = 12.34567;
//    buf3.writeFloat32( fTest );
//    buf3.writeFloat64( fTest );
//    buf3.endSizedWrite();
//    buf3.rewind();

//    buf3.beginSizedRead();
//    if ( buf3.readInt32() != 0xaaaa )
//       return false;
//    buf3.beginSizedRead();
//    if ( buf3.readInt32() != 0x23 )
//       return false;
//    buf3.beginSizedRead();
//    if ( buf3.readInt32() != 0x5555 )
//       return false;
//    buf3.endSizedRead();
//    buf3.endSizedRead();
//    var fl32 = buf3.readFloat32();
//    textOut( fl32 );
//    var fl64 = buf3.readFloat64();
//    textOut( fl64 );
//    if ( fl64 != fTest )
//       return false;
//    buf3.endSizedRead();

//    var buf4 = new DataBuffer();
//    var arrBuf = new ArrayBuffer( 300 );
//    var view = new DataView( arrBuf );
//    view.setUint32( 0, 250 );
//    buf4._swapBytes( view, 0, 4 );
//    for ( var i = 4; i < 250; i++ )
//       view.setUint8( i, i );
//    buf4.readFromDataView( view, 0 );

//    return true;
// }

/////////////////////////////////////////////////////////////

export function createReadFactory( _func )
{
   return function( _buf )
   {
      var res = new _func();
      res.read( _buf );
      return res;
   }
}

export function createReadFactory2( _func )
{
   return function( _buf )
   {
      var res = new _func();
      res.read2( _buf );
      return res;
   }
}

