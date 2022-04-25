// Connection, mw 21.2.2013
// ES6 5.3.2020

import WebSocket from 'ws';
import {SockMsgId, WebSockMessage} from "./Protocol/WebSockMessage.js";

export var ConnectId = {
    NONE: 0,
    UNKNOWN: 0,
    SERVER: 1
};

export var SockState = {
    CONNECTING: 0,
    CONNECTED: 1,
    CLOSING: 2,
    CLOSED: 3
};

export class Connection {
    constructor(uri) {
        this.connectId = ConnectId.NONE;

        this.wsUri = uri;
        this.onConnected = () => {}
        this.onReceivedData = (msg) => {}

        this.error = false;
        this.msgCnt = 0;
    }

    open() {
        try {
            if (this.socket)
                this.socket.close();

            console.log("Start Open Web Socket Uri: " + this.wsUri);
            this.socket = new WebSocket(this.wsUri, [], {
                headers: {
                    "Origin": "https://database.chessbase.com"
                }
            });

            this.error = false;

            this.socket.onopen = () => {
                console.log('Socket connected!')
                this.onConnected()
            };

            this.socket.onclose = (ev) => {
                console.log("Close Connection: " + this.wsUri + " " + ev.code);
            };

            this.socket.onerror = (error) => {
                console.log("Error: " + this.wsUri + " " + error);
            };

            this.socket.onmessage = (evt) => {
                if (evt.data instanceof ArrayBuffer) {
                    var msg = new WebSockMessage();
                    try {
                        msg.fromReceiveBuf(evt.data);
                    } catch (x) {
                        console.log(x.toString());
                    }
                    this.onReceivedData(msg);
                } else {
                    console.log(evt.data, "", "conn");
                    console.log( 'RESPONSE: ' + evt.data );
                }
            };

        } catch (x) {
            console.log("Conn exception", x);
        }
    }

    close() {
        if (this.isConnected() || this.isConnecting())
            this.socket.close();
    }

    isConnected() {
        return this.socket && this.socket.readyState === SockState.CONNECTED;
    }

    isConnecting() {
        return this.socket && this.socket.readyState === SockState.CONNECTING;
    }

    onSocketError() {
    };

    // NH2020 added "noCheck"
    sendMessage(sockMsg, noId, noCheck) {
        console.log('Send message, type: ', sockMsg.type)
        if (!this.socket)
            return;

        if (!sockMsg.getType()) {
            throw (Error("Sending invalid sockMsg"));
        }

        if (noId) {
            sockMsg.msgId = 0;
            if (this.msgCnt > 0) {
                //	console.log( "NOID + " + this.connectId );
                // "#IFDEBUG"
                // if ( sockMsg.type != 7002 )	// logon
                // 	alert( "SOCKMSG NOID" + " " + sockMsg );
                // "#ENDIF"
            }
        } else {
            sockMsg.msgId = ++this.msgCnt;
            //	console.log( sockMsg.msgId + " " + sockMsg.type + " " + this.connectId );
        }


        if (sockMsg.getIdReceiver() === ConnectId.NONE)
            sockMsg.setIdReceiver(ConnectId.SERVER);

        sockMsg.setIdSender(this.connectId);

        if (this.socket.readyState === SockState.CONNECTED) {
            this.socket.binaryType = "arraybuffer";
            var arrBufSend = sockMsg.fillSendArrBuf(!noId, !noCheck);  // JS ArrayBuffer, not DataBuffer!
            this.socket.send(arrBufSend);
        }

        // open called, but handshaking not finished:
        else if (this.socket.readyState === SockState.CONNECTING) {
            console.log("MSGs WAITING TO SEND=", "LogRed");
        } else {
            if (this.socket.readyState !== SockState.CLOSING && this.socket.readyState !== SockState.CLOSED) {
                this.error = true;
                this.onSocketError();
            }
        }
    };
}
