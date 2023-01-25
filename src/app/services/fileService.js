
export function fileToByteArray(files) {
    const reader = new FileReader();
    const fileByteArray = [];
    reader.onloadend = (evt) => {
        if (evt.target.readyState === FileReader.DONE) {
            const arrayBuffer = evt.target.result,
                array = new Uint8Array(arrayBuffer);
            for (const a of array) {
                fileByteArray.push(a);
            }
            console.log(fileByteArray)
        }
    }
    reader.readAsArrayBuffer(files[0]);
    return fileByteArray;
}

export function byteArrayToFile(byteArray) {
    const byteArray = new Uint8Array(file);
    const blob = new Blob([byteArray], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    return url;
}
