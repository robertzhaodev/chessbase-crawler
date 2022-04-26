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

const nRead = aDB.readUint32();

const gameList = [];

for (let n = 0; n < nRead; n++) {
    aDB.beginSizedRead();
    const nGameNo = aDB.readUint32();
    if (nGameNo > 0) {
        const gameHeader = new GameHeader();
        gameHeader.read(aDB)
        gameList.push(gameHeader);
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
