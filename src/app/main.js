import extensionService from "./services/extensionService";
import { connectToExtension, getAccounts } from "./services/extensionService";
import { ApiPromise, WsProvider } from "@polkadot/api";


async function main() {
    addListeners();
    await new Promise((resolve) => setTimeout(resolve, 300));
    await connectToExtension();
    await populateAccounts();

    console.log("App started");

    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });
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
    }
};

function addListeners() {
    document.getElementById("uploadButton").addEventListener("click", uploadFile);
};

async function populateAccounts() {
    const optionsList = await getAccounts();
    const selectElement = document.querySelector("#address-select");
    optionsList.forEach(function (item) {
        let address = item.address;
        const option = document.createElement("option");
        option.value = address;
        option.text = address;
        selectElement.appendChild(option);
    });
};

main();