import fs from 'fs';
import path from "path"
import {DataBuffer} from "./common/Container/DataBuffer.js";
import {readGameHeader, readGameMoves} from "./helpers/functions.js";
import {gameResultCodeToString} from "./helpers/ultils.js";


const fileContent = fs.readFileSync(`${path.resolve()}/data/sample-binary.txt`)

// sample data
const aDB = new DataBuffer();
aDB.buffer = fileContent.buffer;
aDB.setSize(49604);
aDB.viewBuf = new DataView(fileContent.buffer)

const nRead = aDB.readUint32();

const gameList = [];

for (let n = 0; n < nRead; n++) {
    aDB.beginSizedRead();
    const nGameNo = aDB.readUint32();

    if (nGameNo > 0) {
        // read headers
        const headers = readGameHeader(aDB)
        // read moves
        const moves = readGameMoves(aDB);

        gameList.push({...headers, moves});
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
        date: g.date,
        result: gameResultCodeToString(g.result),
        event: g.event.event,
        eloWhite: g.eloWh,
        eloBlack: g.eloBl,
        playCount: g.plyCount,
        flags: g.flags,
        moves: g.moves,
    };
});

const folder = `${path.resolve()}/data`;
const fileName = `${folder}/games-list-sample.json`;

fs.mkdirSync(folder, {recursive: true});
fs.writeFileSync(fileName, JSON.stringify(simpleData, null, '\t'));

console.log('File saved at: ' + fileName);

process.exit(0);