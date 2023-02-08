import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'

// creates a connection to the polkadot js extension
export async function connectToExtension() {
    const extensions = await web3Enable("substrate-ipfs")
    if (extensions.length === 0) {
        console.warn('No extension found.')
    }
}

// gets all accounts from the polkadot js extension
async function getAccounts() {
    const accounts = await web3Accounts()

    if (accounts.length === 0) {
        console.info('No accounts found.')
    }
    return accounts;
}

// lists all accounts in the select element
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