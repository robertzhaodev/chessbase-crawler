import {Connection} from "../common/WebClient/Connection.js";
import {LoginMode, LogonData} from "../common/WebClient/Protocol/LogonData.js";
import {CBGuid} from "../common/Tools/CBGuid.js";
import {SockMsgId, WebSockMessage} from "../common/WebClient/Protocol/WebSockMessage.js";
import {YourIdData} from "../common/WebClient/Protocol/YourId.js";
import {GameHeader} from "../common/Chess/Logic/GameHeader.js";
import fs from 'fs';
import path from "path"

export class GamesCrawler extends Connection {

    static start(uri) {
        return new GamesCrawler(uri);
    }

    constructor(uri) {
        super(uri);
        this.open();
    }

    /**
     * On connected to websocket
     */
    onConnected() {
        // Send login data
        const loginData = new LogonData(
            "Guest",
            "Pass",
            LoginMode.GUEST,
            new CBGuid(),
        );
        const msg = loginData.getSocketsMsg(false);
        this.sendMessage(msg, true, true);
    }

    /**
     * Handle websocket data
     * @param msg
     */
    onReceivedData = (msg) => {
        const type = SockMsgId.toString(msg.getType())
        console.log('Received type, ', type, '\n');

        // 1. Receive connect ID
        if (msg.getType() === SockMsgId.YOUR_ID) {
            const yourId = new YourIdData();
            yourId.fromSocketsMsg(msg);
            this.connectId = yourId.nId;
            return;
        }

        // 2. Get db user info
        if (msg.getType() === SockMsgId.DEFAULTGROUPS) {
            const aMsg = new WebSockMessage(SockMsgId.REQUEST_ONLINE_DB_USER_INFO);
            this.sendMessage(aMsg);
            return;
        }

        // 3. On Received db user info
        if (msg.getType() === SockMsgId.ONLINE_DB_USER_INFO) {
            this.getGameIds();
            return;
        }

        // 4. On received db number
        if (msg.getType() === SockMsgId.ONLINE_DB_NUMBERS) {
            this.getGamesFromIds(msg);
            return;
        }

        // 5. Received games list
        if (msg.getType() === SockMsgId.ONLINE_DB_GAMES) {
            this.onReceivedGamesList(msg);
        }
    };

    /**
     * getGameIds
     */
    getGameIds() {
        const getBoardMsg = new WebSockMessage(SockMsgId.QUERY_ONLINE_DB);

        const rDB = getBoardMsg.buf;

        rDB.beginSizedWrite();
        rDB.writeByte(1 /* sizeof(byte)*/);
        rDB.writeASCIIString(""); // white mask
        rDB.writeASCIIString(""); // black mask
        rDB.writeASCIIString(""); // title
        rDB.writeASCIIString(""); // place
        rDB.writeInt(0); // min year
        rDB.writeInt(3000); // max year
        rDB.writeInt(0); // m_iWhiteMinElo
        rDB.writeInt(0); // m_iBlackMinElo

        rDB.writeUint16(0); // m_nMinECO
        rDB.writeUint16(0xffff); // m_nMaxECO
        rDB.writeInt(881); // flag

        // Hmm? what is this params mean ??
        // TODO: learn about method getUseBoard of file SearchMask.js
        const useBoard = [5, 6, 0, 0, 0, 0, 14, 13, 3, 6, 0, 0, 0, 0, 14, 11, 4, 6, 0, 0, 0, 0, 14, 12, 2, 6, 0, 0, 0, 0, 14, 10, 1, 6, 0, 0, 0, 0, 14, 9, 4, 6, 0, 0, 0, 0, 14, 12, 3, 6, 0, 0, 0, 0, 14, 11, 5, 6, 0, 0, 0, 0, 14, 13];

        if (useBoard) //this.getUseBoard()
        {
            rDB.writeByte(0);
            for (let i = 0; i < 64; i++) {
                rDB.writeByte(useBoard[i]);
            }

        }

        // Maybe it is search text?
        rDB.writeASCIIString(""); // freeText
        rDB.endSizedWrite();

        this.sendMessage(getBoardMsg, false, false)
    }


    /**
     * getGamesFromIds
     * @param msg
     */
    getGamesFromIds(msg) {
        const dbGameMsg = msg.getBuf();
        const nGames = dbGameMsg.readUint32();
        const nTotalFound = dbGameMsg.readUint32();

        console.log(`Fetching ${nGames}/${nTotalFound} games from given ids..`);

        const gameIds = [];
        for (let i = 0; i < nGames; i++) {
            gameIds.push(dbGameMsg.readUint32());
        }

        if (!gameIds.length) {
            console.log('No games found!');
            return;
        }

        // Request get games
        const getGamesMsg = new WebSockMessage(SockMsgId.REQUEST_ONLINE_DB_GAMES);
        getGamesMsg.setVal(2);
        getGamesMsg.buf.writeUint32(gameIds.length);

        for (let n = 0; n < gameIds.length; n++) {
            getGamesMsg.buf.writeUint32(gameIds[n]);
        }

        this.sendMessage(getGamesMsg);
    }

    /**
     * onReceivedGamesList
     * @param msg
     */
    onReceivedGamesList(msg) {
        const aDB = msg.getBuf();
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
                date: g.date.toString(),
                result: g.result,
                event: g.event.event,
                elow: g.eloWh,
                elob: g.eloBl,
                plyCount: g.plyCount,
                flags: g.flags
            };
        });

        const folder = `${path.resolve()}/data`;
        const fileName = `${folder}/games-list.json`;

        fs.mkdirSync(folder, {recursive: true});
        fs.writeFileSync(fileName, JSON.stringify(simpleData, null, '\t'));

        console.log('File saved at: ' + fileName);

        process.exit(0);
    }
}