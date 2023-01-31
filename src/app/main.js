import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp'
import { connectToExtension, getAccounts } from "./services/extensionService";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { populateAccounts } from "./services/extensionService";
import { initializeDatabase, addFileToDatabase } from './services/indexingService';

// necessary variables for connecting to the node via polkadotjs
let address = document.getElementById("address-select").value;
let selectedCidVersion = 0;
let wsProvider;
let db = null;
let api;

// constants
const defaultWsAddress = "ws://127.0.0.1:9944";

async function main() {
    // create connection to node and listen to new blocks
    await createNodeConnection(defaultWsAddress, api);
    await listenToBlocks();
    db = initializeDatabase();
    addListeners();

    // connect polkadot js extension
    await new Promise((resolve) => setTimeout(resolve, 300));
    await connectToExtension();
    await populateAccounts();
    console.log("App started");

    // indexing experiment
    const latestBlockHash = await api.rpc.chain.getFinalizedHead();
    const block = await api.rpc.chain.getBlock(latestBlockHash);
    await indexChain(block.block.header.number, 1);
};


function addFileToFileList(cid, block) {
    let fileList = document.querySelector(".file-list");
    let newFileItem = document.createElement("div");
    newFileItem.classList.add("file-item");

    let newCID = document.createElement("div");
    newCID.classList.add("cid");
    newCID.innerText = cid;

    let newBlock = document.createElement("div");
    newBlock.classList.add("block");
    newBlock.innerText = "Block: " + block;

    newFileItem.appendChild(newCID);
    newFileItem.appendChild(newBlock);

    fileList.appendChild(newFileItem);
}

export async function indexChain(from, to) {
    const startHash = await api.rpc.chain.getBlockHash(from);
    readBlock(startHash.toString(), from, to);
    document.querySelector(".file-list-title").innerText = "ADDED FILES (Indexing...)";
}

async function readBlock(blockHash, from, to) {
    let block = await api.rpc.chain.getBlock(blockHash);
    const apiAt = await api.at(blockHash);
    const blockEvents = await apiAt.query.system.events();

    // if the address matches the selected one, add the cid to the file list
    blockEvents.forEach((record) => {
        const { event, phase } = record;
        if (event.section === "ipfs" && event.method === "AddedCid") {
            let uploaderAddress = event.data[0];
            let cid = new TextDecoder().decode(event.data[1]);
            console.log(event.data[0] == address)
            if (uploaderAddress == address) {
                addFileToFileList(cid, block.block.header.number);
            }
        }
    });

    // ensure to run the condition as long as there are blocks to read
    if (block.block.header.number.toNumber() >= to) readBlock(block.block.header.parentHash.toString(), from, to);
    else {
        console.log("Indexing finished at: " + new Date());
        document.querySelector(".file-list-title").innerText = "ADDED FILES";
        return;
    }
}

async function createNodeConnection(address) {
    try {
        wsProvider = new WsProvider(address);
        api = await ApiPromise.create({ provider: wsProvider });
        document.getElementById("status-icon").setAttribute("src", "https://cdn-icons-png.flaticon.com/512/190/190411.png");
        document.getElementById("status-text").innerHTML = "Connected to: ";
        document.getElementById("ws-address").value = address;
        console.log("Connected to " + address);
    } catch (error) {
        document.getElementById("status-icon").src = "https://cdn-icons-png.flaticon.com/512/3389/3389152.png"
        document.getElementById("status-text").innerHTML = "Disconnected";
        api.disconnect();
        console.log("Connecting failed to: " + address + ". Api has been disconnected.");
    }
}

async function uploadFile() {
    var input = document.getElementById("myFile");
    var files = input.files;
    try {
        if (files[0]) {
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

            const SENDER = document.getElementById("address-select").value;
            const injector = await web3FromAddress(SENDER);

            await api.tx.ipfs
                .addBytes(fileByteArray, selectedCidVersion)
                .signAndSend(SENDER, { signer: injector.signer }, (status) => {
                    console.log(status.toHuman());
                    console.log(`Extrinsic status: ${status.status}`);
                    printResult(status.status, "upload", true);
                });

            document.getElementById("myFile").value = "";
        } else {
            alert("Failed to load file");
        }
    } catch (error) {
        printResult("Failed to upload file: " + error, "upload", false);
        document.getElementById("myFile").value = "";
    }
};

async function retrieveFile() {
    try {
        const SENDER = document.getElementById("address-select").value;
        const injector = await web3FromAddress(SENDER);
        const CID = document.getElementById("cid").value;
        console.log("Trying to retrieve file with CID: " + CID)

        await api.tx.ipfs
            .catBytes(CID)
            .signAndSend(SENDER, { signer: injector.signer }, (status) => {
                console.log(status.toHuman());
                console.log(`Extrinsic status: ${status.status}`);
                printResult(status.status, "retrieve", true);
            });
        document.getElementById("cid").value = "";
    } catch (error) {
        printResult("Failed to retrieve file: " + error, "retrieve", false);
        document.getElementById("cid").value = "";
    }
}

function printResult(message, box, success) {
    switch (box) {
        case "upload":
            resultBox = document.getElementById("uploadResultMessage");
            break;
        case "retrieve":
            resultBox = document.getElementById("retrieveResultMessage");
            break;
    }

    resultBox.innerHTML = message;
    if (success == true) {
        resultBox.classList.add("success");
        resultBox.classList.remove("error");
    } else {
        resultBox.classList.add("error");
        resultBox.classList.remove("success");
    }
}

function resetFileList() {
    let fileList = document.querySelector(".file-list");
    let fileItems = document.querySelectorAll(".file-item");

    fileItems.forEach(function (fileItem) {
        fileList.removeChild(fileItem);
    });
}


/*
    Listener Stuff
*/

function addListeners() {
    document.getElementById("uploadButton").addEventListener("click", uploadFile);
    document.getElementById("retrieveButton").addEventListener("click", retrieveFile);
    document.getElementById("address-select").addEventListener("change", selectAccount);
    document.getElementById("change-ws-address").addEventListener("click", changeConnection);
    document.querySelector(".toggle input[type='checkbox']").addEventListener("change", toggleVersion);
}

function toggleVersion() {
    selectedCidVersion = this.checked ? 1 : 0;
    console.log("CID version changed to: " + selectedCidVersion);
}

async function changeConnection() {
    const wsAddress = document.getElementById("ws-address").value;
    await createNodeConnection(wsAddress);
}

function selectAccount() {
    address = document.getElementById("address-select").value;
    console.log("Address changed: " + address);
    resetFileList();
};

main();