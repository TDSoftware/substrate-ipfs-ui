const crypto = require('crypto');
const jpeg = require('jpeg-js');
const fs = require('fs');
const jsonExport = require('jsonexport');

const { ApiPromise, WsProvider } = require("@polkadot/api");
const { Keyring } = require('@polkadot/keyring');
const { prompt } = require('enquirer');

// disable polkadot js warnings
console.warn = () => { };

const results = [];

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
    // this takes about 5-15ms per file -> not really parallel but sufficient for our purposes
    for (const file in files) {
        iterationTasks.push(addBytesToIpfs(cidVersion, fileAccountMapping[files[file]], files[file], api));
    }
    
    console.log(`Uploading ${files.length} files...`)

    await Promise.all(iterationTasks);

    const addressTable = {};
    for (const file in fileAccountMapping) {
        addressTable[fileAccountMapping[file].address] = true;
    }

    let mappingTime = 0;
    let counter = 0;
    await api.query.system.events((events) => {
        events.forEach((record) => {
            const { event } = record;
            if (event.section === "ipfs" && event.method === "AddedCid") {
                let mappingA = performance.now();
                const address = event.data[0].toString();
                if (addressTable[address]) {
                  for (const entry in results) {
                    if (results[entry].account === address) {
                      results[entry]['return'] = performance.now() - results[entry].submitStart;
                    }
                  }
                  counter++;
                  if (counter === files.length) {
                    console.log(`Mapping time: ${mappingTime}ms`);
                    console.log("All CIDs have been returned. Returning funds to the system account...");
                    returnFundsToSystemAccount(api, Object.values(fileAccountMapping));
                    analyzeResults(results);
                    for (const entry in results) {
                      delete results[entry].submitStart;
                      delete results[entry].submitEnd;
                    }
                    createCsvFile(results, counter, fileSizePrompt.fileSize);
                    return;
                  }
                }
                let mappingB = performance.now();
                mappingTime += mappingB - mappingA;
              }
        });
    })
}

async function addBytesToIpfs(cidVersion, fileAccount, file, api) {
    try {
        let rowEntry = {};
        let submitStart = performance.now();
        await ipfsAddBytes(cidVersion, fileAccount, file, api);
        let submitEnd = performance.now()
        rowEntry['fileSize'] = file.length / 1024;
        rowEntry['account'] = fileAccount.address;
        rowEntry['submitStart'] = submitStart;
        rowEntry['submitEnd'] = submitEnd;
        rowEntry['submit'] = submitEnd - submitStart;
        results.push(rowEntry);
    } catch (error) {
        console.log(error);
    }
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

const createCsvFile = (data, amount, size) => {
    jsonExport(data, function (err, csv) {
        if (err) return console.error(err);
        // name should include timestamp, amount and size
        const name = `benchmark-${amount}-${size}-${Date.now()}.csv`;

        fs.writeFile(name, csv, (err) => {
            if (err) {
                console.log(err);
            }
            console.log("CSV file has been created under the name " + name + "")
        });
    });
}

function analyzeResults(data) {
    const dataJSON = JSON.parse(JSON.stringify(data));
    const submit = dataJSON.map(entry => entry.submit);
    const returnTime = dataJSON.map(entry => entry.return);
    const fileSize = dataJSON.map(entry => entry.fileSize);
    const averageSubmit = submit.reduce((a, b) => a + b, 0) / submit.length;
    const averageReturn = returnTime.reduce((a, b) => a + b, 0) / returnTime.length;
    const averageFileSize = fileSize.reduce((a, b) => a + b, 0) / fileSize.length;
    const minSubmit = Math.min(...submit);
    const minReturn = Math.min(...returnTime);
    const minFileSize = Math.min(...fileSize);
    const maxSubmit = Math.max(...submit);
    const maxReturn = Math.max(...returnTime);
    const maxFileSize = Math.max(...fileSize);
    console.log(`\n\nResults:\n`);
    console.log(`Average submit time: ${averageSubmit} ms`);
    console.log(`Average return time: ${averageReturn} ms`);
    console.log(`Average file size: ${averageFileSize} kB\n`);
    console.log(`Minimum submit time: ${minSubmit} ms`);
    console.log(`Minimum return time: ${minReturn} ms`);
    console.log(`Minimum file size: ${minFileSize} kB\n`);
    console.log(`Maximum submit time: ${maxSubmit} ms`);
    console.log(`Maximum return time: ${maxReturn} ms`);
    console.log(`Maximum file size: ${maxFileSize} kB\n`);
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