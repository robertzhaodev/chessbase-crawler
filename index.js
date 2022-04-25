import {Connection} from "./common/WebClient/Connection.js";
import {LoginMode, LogonData} from "./common/WebClient/Protocol/LogonData.js";
import {CBGuid} from "./common/Tools/CBGuid.js";
import {SockMsgId, WebSockMessage} from "./common/WebClient/Protocol/WebSockMessage.js";

// 'wss://tbridge.chessbase.com:6008' // chat or get user info
// 'wss://tbridge.chessbase.com:6008' // chat or get user info


const conn = new Connection('wss://dbserver.chessbase.com/');

// on WS connected
conn.onConnected = () => {
    // Send login data
    const loginData = new LogonData(
        "Guest",
        "Pass",
        LoginMode.GUEST,
        new CBGuid(),
    );
    const msg = loginData.getSocketsMsg(false);
    conn.sendMessage(msg, true, true);
};

// on Receive data
conn.onReceivedData = (msg) => {
    const type = SockMsgId.toString(msg.getType())
    console.log('Received type', type);
    if(msg.getType() == SockMsgId.YOUR_ID) {
        var yourId = new YourIdData();
        yourId.fromSocketsMsg( sockMsg );
        this.connectId = yourId.nId;
        this.lobby.idReceived( yourId );
        this.onYourId( this );
    }
    conn.sendMessage( new WebSockMessage( SockMsgId.REQUEST_ONLINE_DB_USER_INFO ));
};

conn.open();

conn.socket.addEventListener('Games', (games) => {
    console.log(games)
})

conn.socket.addEventListener('Statistics', (games) => {
    console.log(games)
})

conn.socket.addEventListener('NoGamesFound', (games) => {
    console.log(games)
})

conn.socket.addEventListener('IDReceived', (games) => {
    console.log(games)
})

conn.socket.addEventListener('ScrollSearch', (games) => {
    console.log(games)
})