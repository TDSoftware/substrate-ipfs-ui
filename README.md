# Overview

This project is a web client for the substrate-ipfs node that allows users to interact with a Polkadot node via the PolkadotJS extension. The web client allows users to upload files to IPFS and retrieve files from IPFS by providing the CID of the file.

# Installation

1. Clone the substrate-ipfs repository by running the following command:
```
git clone git@github.com:TDSoftware/substrate-ipfs.git
```
2. Run the Substrate node by using the command:
```
cargo run -- --dev
```
3. Install this repository by using the command:
```
git clone git@github.com:TDSoftware/substrate-ipfs-ui.git
```
4. Run npm install and npm run dev so start the frontend application


# Main Functionalitites
    Connect to a Polkadot node and listen to new blocks
    Connect to the PolkadotJS extension and populate available accounts
    Upload files to IPFS by providing a file and signing the transaction with an account selected by the user
    Retrieve files from IPFS by providing the CID of the file and signing the transaction with an account selected by the user
    Change the connection to the node by providing a new WebSocket address
    Get the balance of the selected account


# How to use




