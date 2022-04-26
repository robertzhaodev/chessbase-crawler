import fs from 'fs';
import path from "path"
import {WebSockMessage} from "./common/WebClient/Protocol/WebSockMessage.js";

function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

const fileContent = fs.readFileSync(`${path.resolve()}/data/sample-binary.txt`)

const msg = new WebSockMessage();
msg.fromReceiveBuf(toArrayBuffer(fileContent));

console.log(msg);
