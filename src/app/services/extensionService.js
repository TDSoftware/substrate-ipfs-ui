
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'

// load accounts
// ask for permission
// sign transaction

export async function connectToExtension() {
    const extensions = await web3Enable("Subfile")
    if(extensions.length === 0) {
        console.log('No extension found.')
    }
    console.log(getAccounts())
}

export async function getAccounts() {
    const accounts = await web3Accounts()
    
    if(accounts.length === 0) {
        console.log('No accounts found.')
    } else {
        console.log(accounts)
    }
    return accounts;
}

function selectAccount(position){
    const account = this.accounts[position]
    this.selectedAccount = account
}