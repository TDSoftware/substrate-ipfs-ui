import { filetypemime } from "magic-bytes.js";
import mimeDefinitions from '../data/mime.json';

// creates a byte array given a file using the FileReader API
export async function createByteArrayFromFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = (evt) => {
            if (evt.target.readyState === FileReader.DONE) {
                const arrayBuffer = evt.target.result,
                    array = new Uint8Array(arrayBuffer);
                resolve(Array.from(array));
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// creates a file from a byte array. Uses the magic numbers to determine the MIME type and the mime.json file to determine the file extension.
export function createFileFromByteArray(filename, byteArray) {
    const mimeType = getByteArrayMimeType(byteArray);
    const blob = new Blob([byteArray], { type: mimeType });
    const fullFilename = `${filename}${getExtension(mimeType)}`;

    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, fullFilename);
    } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fullFilename;
        a.click();
        URL.revokeObjectURL(a.href);
    }
}

// translator from MIME type to file extension using mime.json
function getExtension(mimeType) {
    const mimeDefinition = mimeDefinitions[mimeType];
    console.log("mimeDefinition: " + mimeDefinition);
    if (!mimeDefinition) {
        return '.txt';
    }
    return `.${mimeDefinition.extensions[0]}`;
}

//  get ByteArray MIME type by magic numbers
function getByteArrayMimeType(byteArray) {
    return filetypemime(byteArray)[0];
}

// a basic decoder for bytes
export function decoder(bytes) {
    return new TextDecoder().decode(bytes);
}