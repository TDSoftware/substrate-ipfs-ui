import extensionService from "./services/extensionService";
import { connectToExtension, getAccounts } from "./services/extensionService";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { populateAccounts } from "./services/extensionService";

let api;
let wsProvider;
let address = document.getElementById("address-select").value;

async function main() {
    addListeners();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await connectToExtension();
    await populateAccounts();

    console.log("App started");

    // connecting to the API
    let wsAddress = 'ws://127.0.0.1:9944'
    wsProvider = new WsProvider(wsAddress);
    api = await ApiPromise.create({ provider: wsProvider });
    console.log(await api.rpc.chain.getHeader());
    if(api.isConnected) {
        document.getElementById("status-text").innerHTML = "Connected to " + wsAddress;
    }
};

async function uploadFile() {
    var input = document.getElementById("myFile");
    var files = input.files;

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

        // make the signed transaction
        const SENDER = document.getElementById("address-select").value;
        const injector = await web3FromAddress(SENDER);

        const extrinsicHash = await api.tx.ipfsExample
        .ipfsAddBytes(fileByteArray)
        .signAndSend(SENDER, { signer: injector.signer });
    
        console.log("Transaction sent: " + extrinsicHash);
        
    } else {
        alert("Failed to load file");
    }
};

async function retrieveFile() {
    const SENDER = document.getElementById("address-select").value;
    const injector = await web3FromAddress(SENDER);
    const CID = document.getElementById("cid").value;
    console.log("Trying to retrieve file with CID: " + CID)

    const extrinsicHash = await api.tx.ipfsExample
    .ipfsCatBytes(CID)
    .signAndSend(SENDER, { signer: injector.signer });

    console.log("Transaction sent: " + extrinsicHash);
}

// get extrinsic by extrinsic hash


function addListeners() {
    document.getElementById("uploadButton").addEventListener("click", uploadFile);
    document.getElementById("retrieveButton").addEventListener("click", retrieveFile);
    document.getElementById("address-select").addEventListener("change", selectAccount);
};

function selectAccount() {
    address = document.getElementById("address-select").value;
    console.log("Address changed: " + address);
};

main();