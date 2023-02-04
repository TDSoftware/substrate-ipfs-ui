const crypto = require('crypto');
const fs = require('fs');
const path = require("path");
const jpeg = require('jpeg-js');

const directory = 'src/tmp';

async function createDummyFile(fileSizeInKb) {
    await clearTmpFolder();
    const data = crypto.randomBytes(fileSizeInKb * 1024);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.floor(Math.random() * 256);
    }

    let quality = 100;
    let jpegData = null;

    while (jpegData === null || Buffer.byteLength(jpegData) > fileSizeInKb * 1024) {
        const width = Math.ceil(Math.sqrt(fileSizeInKb * 1024));
        const height = Math.ceil(fileSizeInKb * 1024 / width);

        jpegData = jpeg.encode({
            data: data,
            width: width,
            height: height
        }, quality).data;

        quality -= 10;
    }

    fs.writeFileSync('src/tmp/' + fileSizeInKb + '-dummy.jpg', jpegData);
}

async function clearTmpFolder() {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
      
        for (const file of files) {
          fs.unlink(path.join(directory, file), (err) => {
            if (err) throw err;
          });
        }
    });  
}

createDummyFile(800);