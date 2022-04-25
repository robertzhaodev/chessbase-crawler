// CBGuid, mw 21.1.2013

export class CBGuid
{
	constructor ()
	{
		this.uint32Data1 = 0;
		this.uint16Data2 = 0;
		this.uint16Data3 = 0;
		this.uint8Data4 = [0, 0, 0, 0, 0, 0, 0, 0];
	}

	fromRandom (appSeed)
	{
		var nSeed = 0;
		if ( appSeed !== undefined )
		{
			for ( var i = 0; i < appSeed.length; i++ )
			{
				nSeed += appSeed.charCodeAt( i );
			}
		}

		this.uint32Data1 = Math.floor( Math.random() * 0x100000000 + nSeed );
		this.uint16Data2 = Math.floor( Math.random() * 0x10000 + nSeed );
		this.uint16Data3 = Math.floor( Math.random() * 0x10000 + nSeed );
		for ( var i = 0; i < 8; i++ )
		{
			this.uint8Data4[i] = Math.floor( Math.random() * 0x100 + nSeed );
		}
	}

	toString ()
	{
		var strRet = this.uint32Data1.toString( 16 )
			+ "-" + this.uint16Data2.toString( 16 )
			+ "-" + this.uint16Data3.toString( 16 )
			+ "-";

		for ( var i = 0; i < 2; i++ )
			strRet += this.uint8Data4[i].toString( 16 );

		strRet += "-";

		for ( var i = 2; i < 8; i++ )
			strRet += this.uint8Data4[i].toString( 16 );

		return strRet;
	}

	toDataBuf (buf)
	{
		buf.writeUint32( this.uint32Data1 );
		buf.writeUint16( this.uint16Data2 );
		buf.writeUint16( this.uint16Data3 );
		for ( var i = 0; i < 8; i++ )
			buf.writeUint8( this.uint8Data4[i] );
	}

	fromDataBuf (buf)
	{
		this.uint32Data1 = buf.readUint32();
		this.uint16Data2 = buf.writeUint16();
		this.uint16Data3 = buf.writeUint16();
		for ( var i = 0; i < 8; i++ )
			this.uint8Data4[i] = buf.readUint8();
	}

}