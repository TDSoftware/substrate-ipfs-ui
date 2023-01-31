
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp'
export async function connectToExtension() {
    const extensions = await web3Enable("Subfile")
    if (extensions.length === 0) {
        console.log('No extension found.')
    }
    console.log("Connected!")
}

export async function getAccounts() {
    const accounts = await web3Accounts()

    if (accounts.length === 0) {
        console.log('No accounts found.')
    }
    return accounts;
}

export async function populateAccounts() {
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