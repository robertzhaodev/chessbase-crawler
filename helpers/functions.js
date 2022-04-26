/**
 * Read game headers
 * @param _buf
 * @returns
 */
export function readGameHeader(_buf) {
    const white = {
        last: _buf.readByteLenASCIIString( 50 ),
        first: _buf.readByteLenASCIIString( 50 ),
    };

    const black = {
        last: _buf.readByteLenASCIIString( 50 ),
        first: _buf.readByteLenASCIIString( 50 ),
    };

    try
    {
        // event
        const event = {
            site: _buf.readByteLenASCIIString( 100 ),
            event: _buf.readByteLenASCIIString( 100 ),
            dt: _buf.readInt(),
            type: _buf.readShort(),
            nation: _buf.readShort(),
            category: _buf.readByte(),
            flags: _buf.readByte(),
            rounds: _buf.readShort(),
            toString() {
                let str = this.event;
                if ( this.site && this.event && this.site !== this.event )
                    str += " ";
                if ( this.site !== this.event )
                    str += this.site;
                return str;
            },
        };

        // source
        const source = {
            source: _buf.readByteLenASCIIString( 100 ),
            publisher: _buf.readByteLenASCIIString( 100 ),
            pubdt: _buf.readInt(),
            verdt: _buf.readInt(),
            version: _buf.readByte(),
            quality: _buf.readByte(),
        };

        const annotator = _buf.readByteLenASCIIString( 100 );

        const eloWh = _buf.readShort();
        const eloBl = _buf.readShort();

        const nEco = _buf.readUint16();
        const eco = ECOtoString( nEco );

        // result
        const result = _buf.readByte();
        _buf.readByte();
        _buf.readByte();
        // end result


        // read date
        const d = _buf.readInt();
        const year = d >> 9;
        const month = ( d >> 5 ) & 0x0f;
        const day = d & 0x1f;
        const date = new Date(year, month, day);
        // end read date

        const plyCount = _buf.readShort();

        const round = _buf.readByte();
        const subRound = _buf.readByte();

        //2 reserved
        _buf.readInt();
        _buf.readInt();

        //teams
        _buf.skipSizedRead();

        return {
            black,
            white,
            event,
            annotator,
            eloWh,
            eloBl,
            nEco,
            eco,
            result,
            plyCount,
            round,
            subRound,
            date,
        };

    } catch (e) {
        console.log('Error when red game headers', e);
        return {};
    }
}

/**
 * readGameMoves
 * @param _buf
 * @returns {*[]}
 */
export function readGameMoves(_buf) {
    readStartPos(_buf);

    readAnnotation(_buf);
    const moves = readMoves(_buf);

    _buf.beginSizedRead();
    _buf.endSizedRead();

    return moves;
}

/**
 * Read start position
 * @param _buf
 */
function readStartPos(_buf) {
    let isNormalInit = _buf.readBool();

    if (!isNormalInit) {
        console.log("Read start position");
        const board = _buf.readByteArray(64); //Board.SIZE

        const sd = _buf.readInt();
        const ep = _buf.readByte() - 1;
        const cr = _buf.readByte();

        _buf.readShort();
        const numMv = _buf.readShort();

        isNormalInit = _buf.readBool();
    }
}

/**
 * Read readAnnotation
 * @param _buf
 */
function readAnnotation(_buf) {
    const _cntAnnos = _buf.readByte();
    // console.log('_cntAnnos', _cntAnnos)

    for (let inx = 0; inx < _cntAnnos; ++inx) {
        _buf.readShort();

        const hdr = {
            inxMv: _buf.readBEInt24(),
            type: _buf.readByte(),
            len: _buf.readBEInt16()
        };

        hdr.len -= 6;

        // see https://database.chessbase.com/static/js/common/Chess/Format/AnnoTypes.js
        if (hdr.type !== 2 && hdr.type !== (0x80 | 2)) {
            _buf.skip(hdr.len);
            continue;
        }

        // Read annotation
        const _annoLen = hdr.len;
        const textType = _buf.readByte();

        _buf.readByte();
        const m_str = _buf.readSizedString(_annoLen - 2);
    }
}

/**
 * Read list move steps
 * @param _buf
 * @returns {*[]}
 */
function readMoves(_buf) {
    let lineLen = _buf.readUint8();

    const moves = [];

    if (lineLen & 0x80) {
        lineLen = (((lineLen << 8) | _buf.readUint8()) & 0x7fff);
    }

    if (lineLen > 0) {
        if (lineLen > 0x800) {
            return [];
        }

        if (lineLen > 0) {
            for (let n = 0; n < lineLen; n++) {
                const from = _buf.readByte();
                const to = _buf.readByte();

                // space
                _buf.readByte();

                let prom = 0;

                if ((from & 0xC0) === 0x40) {
                    prom = 2 /* Piece.QUEEN */ + (to >> 6);
                }
                moves.push({from, to, prom});
            }
        }

        return moves;
    }

    return [];
}

/**
 * ECO code to ECO String
 * @param nClass
 * @returns {string}
 * @constructor
 */
function ECOtoString( nClass )
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
}