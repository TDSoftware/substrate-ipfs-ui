import { filetypemime } from "magic-bytes.js";
import mimeDefinitions from '../data/mime.json';

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
      return '';
    }
    return `.${mimeDefinition.extensions[0]}`;
}

//  get ByteArray MIME type by magic numbers
function getByteArrayMimeType(byteArray) {
    return filetypemime(byteArray)[0];
}