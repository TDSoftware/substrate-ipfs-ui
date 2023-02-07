const crypto = require('crypto');
const fs = require('fs');
const path = require("path");
const jpeg = require('jpeg-js');

const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require('@polkadot/keyring');
const { prompt } = require('enquirer');


const directory = 'src/tmp';

/*  
    This process is meant for benchmarking on a development node.

    1. Ask for node address
    2. Create Node Connection
    3. Create Dummy Account and get fees
    4. Ask for the amount of files to create
    5. Ask for the size of the files to create
    6. Create Dummy Files
    7. Upload Dummy Files
    8. Check RAM/ disk usage
    9. Delete Dummy Files
    10. Delete Dummy Account
*/
console.warn = () => { };

// 2MB in kilobyte = 2048
const blockSize = 2048;

const cli = async () => {
    const addressPrompt = await prompt({
        type: 'input',
        name: 'wsAddress',
        default: 'ws://127.0.0.1:9944',
        message: 'Enter the websocket address of the node you want to connect to.',
    })

    let api;
    let account;

    try {
        api = await connectToNode(addressPrompt.wsAddress);
    } catch (error) {
        console.warn(error);
    }

    const fileAmountPrompt = await prompt({
        type: 'input',
        name: 'fileAmount',
        limit: 100,
        default: 5,
        message: 'Enter the amount of files you want to create.',
    })

    const fileSizePrompt = await prompt({
        type: 'input',
        name: 'fileSize',
        limit: blockSize / fileAmountPrompt.fileAmount,
        default: 20,
        message: 'Enter the size of the files you want to create in KB. The limit is: ' + Math.round(2000 / fileAmountPrompt.fileAmount),
    })

    // ask for cid version, the options are 0 and 1 so use a select
    const cidVersionPrompt = await prompt({
        type: 'select',
        name: 'cidVersion',
        message: 'Select the CID version you want to use.',
        choices: [
            { name: 'CIDv0', message: 'CIDv0' },
            { name: 'CIDv1', message: 'CIDv1' }
        ]
    })

    let cidVersion = cidVersionPrompt.cidVersion === 'CIDv0' ? 0 : 1;
    
    if (fileSizePrompt.fileSize > blockSize / fileAmountPrompt.fileAmount) {
        console.log("File size is too big. Please try again.");
        return;
    }

    console.log(`Creating ${fileAmountPrompt.fileAmount} accounts and funding them...`);
    const files = await createDummyFileArray(fileAmountPrompt.fileAmount, fileSizePrompt.fileSize);

    // this is needed because we need a unique nonce per transaction
    let fileAccountMapping = {};
    for (const file in files) {
        const randomString = crypto.randomBytes(5).toString('hex');
        const dummyAccount = await createDummyAccount(randomString);
        await giveDummyAccountFunds(dummyAccount, api);
        fileAccountMapping[files[file]] = dummyAccount;
        await new Promise(r => setTimeout(r, 4000));
    }

    console.log("Uploading files...")

    for (const file in files) {
        try {
            console.time(`Extrinsic for File ${file} submitted in: `)
            console.time(`Returned file for ${fileAccountMapping[files[file]].address} in: `)
            await ipfsAddBytes(cidVersion, fileAccountMapping[files[file]], files[file], api);
            console.timeEnd(`Extrinsic for File ${file} submitted in: `)
        } catch(error) {
            console.log(error);
        }
    }
    console.log("All Files have been added.")

    await api.query.system.events((events) => {
        events.forEach((record) => {
            const { event } = record;
            if (event.section === "ipfs" && event.method === "AddedCid") {
                let eventData = event.data;
                for (const file in fileAccountMapping) {
                    if (eventData[0].toString() === fileAccountMapping[file].address) {
                        // file for account has been added in
                        console.timeEnd(`Returned file for ${fileAccountMapping[file].address} in: `)
                    }
                }
            }
        });
    });
    return;
}

async function ipfsAddBytes(cidVersion, account, file, api) {
    const hexByteArray = file.toString('hex');
    const SENDER = account
    let transaction = await api.tx.ipfs.addBytes(hexByteArray, cidVersion)
    await transaction.signAndSend(SENDER)
}

async function connectToNode(address) {
    let api = await ApiPromise.create({
        provider: new WsProvider(address)
    });
    return api;
}

async function createDummyAccount(name) {
    const keyring = new Keyring({ type: 'sr25519' });
    const account = keyring.addFromUri(`//${name}`, { name: name }, 'sr25519');
    return account;
}

async function giveDummyAccountFunds(account, api) {
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice', { name: 'Alice' });
    api.tx.balances.transfer(account.address, 922337203164855807n).signAndSend(alice);
}

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
    return jpegData;
}

async function createDummyFileArray(amount, size) {
    let files = [];
    for (let i = 0; i < amount; i++) {
        files.push(await createDummyFile(size));
    }
    return files;
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

cli();