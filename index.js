import {Connection} from "./common/WebClient/Connection.js";

const conn = new Connection('wss://dbserver.chessbase.com');

conn.open();