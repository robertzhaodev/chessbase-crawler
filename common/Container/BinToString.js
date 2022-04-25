/* jb 05.4.13 */
//TS 1.9.2014 - Static?
// ES6 1.3.2020 mw

export var BinToString = {
	StringToByteArray: function(pBuf, rStr)
	{
		var BASECHAR = 64;

		var nByte = 0, nBit = 0;
		var cByte = 0; //	one char buffer, trailing bits are not written to pBuf!

		for (var nChar = 0; nChar < rStr.length; nChar++)
		{
			var c = rStr[nChar].charCodeAt(0);
			if ((c < BASECHAR - 1) || (c > BASECHAR - 1 + 0x3f))
				return 1;
			c -= (BASECHAR - 1);
			if (nBit <= 2)
			{
				cByte |= (c << (2 - nBit)); //	may leave trailing bits!
				nBit += 6;
				if (nBit >= 8)
				{
					nBit -= 8;
					pBuf[nByte++] = cByte & 0xff;
					cByte = 0;
				}
			} else
			{
				nBit -= 2;
				cByte |= (c >> nBit);
				pBuf[nByte++] = cByte & 0xff;
				cByte = (c << (8 - nBit)); //	may leave trailing bits!
			}
		}

		return nByte;
	},


	ByteArrayToString: function(pBuf, nBufLen)
	{
		var BASECHAR = 64;

		var rStr = "";
		if (nBufLen > 0)
		{
			var encode = [];
			var pEncode = 0;
			var nByte = 0, nBit = 0;

			while (nByte < nBufLen)
			{
				if (nBit <= 2)
				{
					encode[pEncode++] = (BASECHAR - 1 + ((pBuf[nByte] >> (2 - nBit)) & 0x3f)) & 255;
					nBit += 6;
					if (nBit >= 8)
					{
						nByte++;
						nBit -= 8;
					}
				} else
				{
					nBit -= 2;
					encode[pEncode] = (((pBuf[nByte] << nBit) & 0x3f)) & 255;
					nByte++;
					if (nByte < nBufLen)
					{
						encode[pEncode] |= (((pBuf[nByte] >> (8 - nBit)) & 0x3f)) & 255;
					} else
						nBit = 0;
					encode[pEncode++] += BASECHAR - 1;
				}
			}

			encode[pEncode] = 0;


			for (var n = 0; n < pEncode; n++)
				rStr += String.fromCharCode(encode[n]);
		} else
			rStr = ("");
		return rStr;
	},

	ByteArrayToBase64: function(_data)
	{
		var KEY_STR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		while (i < _data.length)
		{
			chr1 = _data[i++];
			chr2 = _data[i++];
			chr3 = _data[i++];
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2))
			{
				enc3 = enc4 = 64;
			} else if (isNaN(chr3))
			{
				enc4 = 64;
			}
			output = output +
				KEY_STR.charAt(enc1) + KEY_STR.charAt(enc2) +
				KEY_STR.charAt(enc3) + KEY_STR.charAt(enc4);
		}

		return output;
	},

	ByteArrayToDataURI: function(_data, _mime)
	{
		var output = this.ByteArrayToBase64(_data);
		return 'data:'+_mime + ';charset=utf-8;base64,' + output;
	}
};
