import fs from 'fs';
import path from "path"
import {DataBuffer} from "./common/Container/DataBuffer.js";
import {GameHeader, GameResultEnum} from "./common/Chess/Logic/GameHeader.js";
import {WebSockMessage} from "./common/WebClient/Protocol/WebSockMessage.js";

const fileContent = fs.readFileSync(`${path.resolve()}/data/sample-binary.txt`)
// sample data
// const aDB = new DataBuffer();
// aDB.buffer = fileContent.buffer;
// aDB.setSize(49604);
// aDB.viewBuf = new DataView(fileContent.buffer)

const message = "G1oAAAAAAAAAAAAAAAAAAfIAAAACAAAATQQFAAUAAABTAAAAAAAAAAAAAAAFAAAAR3Vlc3QEAAAAUGFzcxuJguzrx64SH81lKITzkykFAAAAdmktVk4MAAAATGludXggeDg2XzY05AQAAAAAAAAAAAAAAAAAAAAAAACAAAAAYQAAADUuMCAoWDExOyBMaW51eCB4ODZfNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS85Mi4wLjQ1MTUuMTU5IFNhZmFyaS81MzcuMzYfAAAAaHR0cHM6Ly9kYXRhYmFzZS5jaGVzc2Jhc2UuY29tLw=="

const buffer = Buffer.from(message, 'base64').buffer;

const view = new DataView(buffer);
const aDb = new DataBuffer();

aDb.readFromDataView(view, 0);

const nMode = aDb.readInt32( 0);
const nMode = aDb.readInt32( 0);

// const nVal = view.getInt32( 2 );
// const idSender = view.getInt32( 6 );
// const userType = view.getInt16( 10 );
// const idReceiver = view.getInt32( 12 );

console.log(nMode);
