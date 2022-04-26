import fs from 'fs';
import path from "path"
import {DataBuffer} from "./common/Container/DataBuffer.js";
import {GameHeader, GameResultEnum} from "./common/Chess/Logic/GameHeader.js";

const fileContent = fs.readFileSync(`${path.resolve()}/data/sample-binary.txt`)
// sample data
const aDB = new DataBuffer();
aDB.buffer = fileContent.buffer;
aDB.setSize(49604);
aDB.viewBuf = new DataView(fileContent.buffer)

function bufferToHex (buffer) {
    return [...new Uint8Array (buffer)]
        .map (b => b.toString (16).padStart (2, "0"))
        .join ("");
}

// console.log(bufferToHex(fileContent.buffer));


const nRead = aDB.readUint32();

// progress
const gameList = [];
for (let n = 0; n < nRead; n++) {
    aDB.beginSizedRead();
    const nGameNo = aDB.readUint32();
    if (nGameNo > 0) {
        const gameHeader = new GameHeader();
        gameHeader.read(aDB)
        gameList.push(gameHeader);


        // // start pos
        // readPos();
        //
        // readAnotation();

        // //start anno...
        // var anno = new Annotation();
        // anno.read( _buf );
        // //		Annotation.readFactory( _buf );
        // Game._readMoves.call( this, _buf );
    }
    aDB.endSizedRead();
}

const simpleData = gameList.map((g) => {
    return {
        black: `${g.black.first} ${g.black.last}`,
        white: `${g.white.first} ${g.white.last}`,
        round: g.round,
        subRound: g.subRound,
        board: g.board,
        eco: g.eco,
        date: new Date(g.date.toString()),
        result: GameResultEnum.toString(g.result),
        event: g.event.event,
        eloWhite: g.eloWh,
        eloBlack: g.eloBl,
        playCount: g.plyCount,
        flags: g.flags
    };
});

const folder = `${path.resolve()}/data`;
const fileName = `${folder}/games-list-sample.json`;

fs.mkdirSync(folder, {recursive: true});
fs.writeFileSync(fileName, JSON.stringify(simpleData, null, '\t'));

console.log('File saved at: ' + fileName);

process.exit(0);

//
// function readPos() {
//     let normalInit = aDB.readBool();
//     // if ( !normalInit )
//     // {
//     //     // Read start position
//     //     const board = aDB.readByteArray( Board.SIZE );
//     //     const sd = aDB.readInt();
//     //     const ep = aDB.readByte() - 1;
//     //     const cr = aDB.readByte();
//     //
//     //     console.log(board, sd, ep, cr)
//     //     // end read start
//     //
//     //
//     //     // read anotation
//     //     var cntAnnos = aDB.readShort();
//     //     for ( var inx = 0; inx < cntAnnos; ++inx )
//     //     {
//     //         /*var annoLen = */aDB.readShort();
//     //
//     //         var hdr = AnnoRec.readHeader( _buf );
//     //
//     //         // CBDebug.assert( hdr.len === annoLen, "LEN OK" );
//     //
//     //         hdr.len -= AnnoRec.ANNO_HEAD_SIZE;
//     //
//     //         var anno = AnnoFactory.factory( hdr.type );
//     //
//     //         if ( !anno )
//     //         {
//     //             aDB.skip( hdr.len );
//     //             continue;
//     //         }
//     //         anno.read( hdr.len, _buf );
//     //     }
//     //
//     //     aDB.readShort();
//     //     const numMv = aDB.readShort();
//     //     normalInit = aDB.readBool();
//     //     console.log(numMv, normalInit)
//     // }
// }
//
// function readAnotation() {
//     var _cntAnnos = aDB.readShort();
//     for ( var inx = 0; inx < _cntAnnos; ++inx )
//     {
//         var annoLen = aDB.readShort();
//         const inxMv = aDB.readBEInt24();
//         const type = aDB.readByte();
//         const len = aDB.readBEInt16();
//
//         console.log(annoLen, inxMv, type, len)
//         // var hdr = AnnoRec.readHeader( aDB );
//
//         //
//         // // CBDebug.assert( hdr.len === annoLen, "LEN OK" );
//         //
//         // hdr.len -= AnnoRec.ANNO_HEAD_SIZE;
//         //
//         // var anno = AnnoFactory.factory( hdr.type );
//         //
//         // if ( !anno )
//         // {
//         //     aDB.skip( hdr.len );
//         //     continue;
//         // }
//         //
//         // anno.read( hdr.len, aDB );
//     }
// }