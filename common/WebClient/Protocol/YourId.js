// YourIdData, mw 22.2.2013
// MW 5.3.2020

import { ConnectId } from "../Connection.js";


export class YourIdData {
  constructor() {
    this.nId = ConnectId.NONE;
    this.nIdDefaultPlayingGroup = 0;
    this.nIdBroadcastGroup = 0;
    this.nIdCMSArchive = 0;
    this.strToken = "";
    this.strUserId = "";
    this.accountType = 0;
    this.nFlags = 0;
  };

  fromSocketsMsg(msg) {
    msg.getBuf().rewind();
    this.nIdDefaultPlayingGroup = msg.getBuf().readInt32();	// irrelevant, its coming from the bridge.
    this.nIdBroadcastGroup = msg.getBuf().readInt32();
    this.nId = msg.getBuf().readInt32();
    this.nIdCMSArchiv = msg.getBuf().readInt32();
    this.strToken = msg.getBuf().readASCIIString(200);
    this.accountType = msg.getBuf().readInt16();
    this.strUserId = msg.getBuf().readASCIIString(200);
    this.nFlags = msg.getBuf().readInt32();
  };

  isFromBridge() {
    return (this.nFlags & 2) !== 0;
  }
}

