import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp'
import { connectToExtension, getAccounts } from "./services/extensionService";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3FromAddress } from "@polkadot/extension-dapp";
import { populateAccounts } from "./services/extensionService";

// necessary variables for connecting to the node via polkadotjs
let wsProvider;
let api;
let address = document.getElementById("address-select").value;

// constants
const defaultWsAddress = "ws://127.0.0.1:9944";

async function main() {
    // create connection to node and listen to new blocks
    await createNodeConnection(defaultWsAddress, api);
    await listenToBlocks();
    addListeners();

    // connect polkadot js extension
    await new Promise((resolve) => setTimeout(resolve, 300));
    await connectToExtension();
    await populateAccounts();

    console.log("App started");
};

// function that listens to new blocks and logs them to the console
async function listenToBlocks() {
    const unsubscribe = await api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        const blockNumber = header.number;
        document.getElementById("block-number").innerHTML = blockNumber;
        console.log(`Chain is at block: #${blockNumber}`);

        // get the pending extrinsic => if there are any, log them to the console
        await api.rpc.author.pendingExtrinsics().then((extrinsics) => {
            if (extrinsics.length > 0) {
                console.log("Pending extrinsics: ");
                extrinsics.forEach((extrinsic) => {
                    let encoded = extrinsic.toHuman();
                    console.log(encoded);
                });
            }
        });

        api.query.system.events((events) => {
            events.forEach((record) => {
                const { event, phase } = record;
                if (event.section === "ipfsExample" && event.method === "AddedCid") {
                    let decoded = new TextDecoder().decode(event.data[1]);
                    let identifier = event.data[0].toString();
                    console.log(identifier + ". " + decoded);
                }
            });
        });
    });
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

async function changeConnection() {
    const wsAddress = document.getElementById("ws-address").value;
    await createNodeConnection(wsAddress);
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

            // make the signed transaction
            const SENDER = document.getElementById("address-select").value;
            const injector = await web3FromAddress(SENDER);

            const extrinsicHash = await api.tx.ipfsExample
                .ipfsAddBytes(fileByteArray)
                .signAndSend(SENDER, { signer: injector.signer }, (status) => {
                    console.log(status.toHuman());
                    console.log(`Extrinsic status: ${status.status}`);
                    printResult(status.status, "upload", true);
                });

            //reset the file input
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

        const extrinsicHash = await api.tx.ipfsExample
            .ipfsCatBytes(CID)
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

function addListeners() {
    document.getElementById("uploadButton").addEventListener("click", uploadFile);
    document.getElementById("retrieveButton").addEventListener("click", retrieveFile);
    document.getElementById("address-select").addEventListener("change", selectAccount);
    document.getElementById("change-ws-address").addEventListener("click", changeConnection);
};

export async function getBalance(address) {
    const accounts = await web3Accounts()
    const account = accounts.find((a) => a.address === address)
    if (!account) {
        console.log('Account not found.')
    } else {
        const balance = await api.query.system.account(account.address)
        console.log("Balance of user is: " + balance.data.free.toHuman())
    }
}

function selectAccount() {
    address = document.getElementById("address-select").value;
    getBalance(address);
    console.log("Address changed: " + address);
};

main();