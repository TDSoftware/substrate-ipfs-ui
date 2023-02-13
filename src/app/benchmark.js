const crypto = require('crypto');
const jpeg = require('jpeg-js');

const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require('@polkadot/keyring');
const { prompt } = require('enquirer');

// disable polkadot js warnings
console.warn = () => { };

const cli = async () => {
    const addressPrompt = await prompt({
        type: 'input',
        name: 'wsAddress',
        default: 'ws://127.0.0.1:9944',
        message: 'Enter the websocket address of the node you want to connect to.',
    })

    let api;

    try {
        api = await connectToNode(addressPrompt.wsAddress);
    } catch (error) {
        console.warn(error);
    }

    const blockSize = parseInt(await api.consts.system.blockLength.toHuman().max.normal.replace(/,/g, '')) / 1024;

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
        message: 'Enter the size of the files you want to create in KB. The limit is ' + Math.round(blockSize / fileAmountPrompt.fileAmount) + ' KB.',
    })

    const randomizeFileSize = await prompt({
        type: 'confirm',
        name: 'randomizeFileSize',
        message: 'Do you want to randomize the file size? If yes, the file size will be between ' + fileSizePrompt.fileSize + 'KB and ' + Math.round(fileSizePrompt.fileSize / 10) + ' KB.',
    })

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

    if (fileSizePrompt.fileSize > blockSize) {
        console.log("File size is too big. Please try again.");
        return;
    }

    let files = [];
    console.log(`Creating ${fileAmountPrompt.fileAmount} test accounts and funding them... This can take a moment...`);
    switch (randomizeFileSize.randomizeFileSize) {
        case true:
            files = await createRandomFileArrayOfRandomSize(fileAmountPrompt.fileAmount, fileSizePrompt.fileSize);
            break;
        case false:
            files = await createDummyFileArray(fileAmountPrompt.fileAmount, fileSizePrompt.fileSize);
            break;
    }

    let fileAccountMapping = {};
    for (const file in files) {
        const randomString = crypto.randomBytes(5).toString('hex');
        const dummyAccount = await createDummyAccount(randomString);
        fileAccountMapping[files[file]] = dummyAccount;
    }

    await batchFunding(api, Object.values(fileAccountMapping));

    // let a new block settle in
    await new Promise(resolve => setTimeout(resolve, 5000));

    const iterationTasks = [];
    for (const file in files) {
        iterationTasks.push(addBytesToIpfs(cidVersion, fileAccountMapping[files[file]], files[file], file, api));
    }

    await Promise.all(iterationTasks);

    console.log(`Uploading ${files.length} files...`)

    let counter = 0;
    await api.query.system.events((events) => {
        events.forEach((record) => {
            const { event } = record;
            if (event.section === "ipfs" && event.method === "AddedCid") {
                let eventData = event.data;
                for (const file in fileAccountMapping) {
                    if (eventData[0].toString() === fileAccountMapping[file].address) {
                        console.log(`File size: ${file.length / 1024} KB`);
                        console.timeEnd(`Returned file for ${fileAccountMapping[file].address} in: `)
                        counter++;
                        if (counter === files.length) {
                            console.log("Found all files. Returning funds to the system account...");
                            returnFundsToSystemAccount(api, Object.values(fileAccountMapping));
                            return;
                        }
                    }
                }
            }
        });
    })
}

async function batchFunding(api, accounts) {
    const txs = accounts.map(account => api.tx.balances.transfer(account.address, 922337203164855807n));
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice', { name: 'Alice' });

    await api.tx.utility.batch(txs).signAndSend(alice, ({ status }) => {
        if (status.isInBlock) {
            console.log("Funded " + accounts.length + " accounts successfully.");
        }
    });
}

async function addBytesToIpfs(cidVersion, fileAccount, file, index, api) {
    try {
        console.time(`Extrinsic for File ${index} submitted in: `);
        console.time(`Returned file for ${fileAccount.address} in: `);
        await ipfsAddBytes(cidVersion, fileAccount, file, api);
        console.timeEnd(`Extrinsic for File ${index} submitted in: `);
    } catch (error) {
        console.log(error);
    }
}

async function returnFundsToSystemAccount(api, accounts) {
    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice', { name: 'Alice' });
    accounts.forEach(async (account) => {
        const balance = (await api.query.system.account(account.address)).toHuman().data.free;
        await api.tx.balances.transfer(alice.address, BigInt(balance.replace(/,/g, '') * 0.9)).signAndSend(account);
    });
}

async function ipfsAddBytes(cidVersion, account, file, api) {
    // has to be converted because polkadot js has a low limit for Uint8Array
    const hexByteArray = Array.prototype.map.call(new Uint8Array(file), x => ('00' + x.toString(16)).slice(-2));
    const SENDER = account
    let transaction = await api.tx.ipfs.addBytes(hexByteArray, cidVersion)
    return await transaction.signAndSend(SENDER)
}

async function connectToNode(address) {
    let wsProvider = new WsProvider(address);
    let api = await ApiPromise.create({ provider: wsProvider });
    return api;
}

async function createDummyAccount(name) {
    const keyring = new Keyring({ type: 'sr25519' });
    const account = keyring.addFromUri(`//${name}`, { name: name }, 'sr25519');
    return account;
}

async function createRandomFileArrayOfRandomSize(amount, size) {
    const files = [];
    for (let i = 0; i < amount; i++) {
        const randomSize = Math.floor(Math.random() * size) + 1;
        const randomFile = await createDummyFile(randomSize);
        files.push(randomFile);
    }
    return files;
}

async function createDummyFile(fileSizeInKb) {
    const data = crypto.randomBytes(fileSizeInKb * 1024);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.floor(Math.random() * 256);
    }

    let quality = 100;
    let jpegData = null;

    const width = Math.ceil(Math.sqrt(fileSizeInKb * 1024));
    const height = Math.ceil(fileSizeInKb * 1024 / width);

    jpegData = jpeg.encode({
        data: data,
        width: width,
        height: height
    }, quality).data;

    return jpegData;
}

async function createDummyFileArray(amount, size) {
    let files = [];
    for (let i = 0; i < amount; i++) {
        files.push(await createDummyFile(size));
    }
    return files;
}

cli();