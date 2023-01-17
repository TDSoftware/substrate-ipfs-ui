export function fileToByteArray(file) {
    const file = fs.readFileSync('file.txt');
    const byteArray = new Uint8Array(file);
    return byteArray;
}

export function byteArrayToFile(byteArray) {
    const byteArray = new Uint8Array(file);
    const blob = new Blob([byteArray], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    return url;
}