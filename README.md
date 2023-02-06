# Overview

This project is a web client for the substrate-ipfs node that allows users to interact with an integrated IPFS node. The web client allows users to upload files to IPFS and retrieve files from IPFS by providing the CID of the file. It uses [parcel](https://parceljs.org/) as a bundler and the [polkadot.js](https://polkadot.js.org/docs/) API for node interactivity.

# Getting Started 

In order to run this web client, you will first need to have a [substrate-ipfs](https://github.com/TDSoftware/substrate-ipfs) node up and running, exposing the web sockets port 9944.
This will allow the web client to interact with the node via polkadot.js. Refer to the [installation instructions](https://github.com/TDSoftware/substrate-ipfs/blob/master/README.md) of the substrate-ipfs node for more information.

To run the web client, the following steps have to be taken: 

1. Ensure [npm](https://www.npmjs.com/) is installed on your machine.
2. Run the command **npm install** in the project directory to install necessary dependencies
3. Run the command **npm run start** in the project directory to start the web client.

The client will by default run on port 1234, so go to *localhost:1234*.

# Functionalities

This Web-Client has multiple functionalities for showcasing the capabilities of the substrate-ipfs node. These functionalitites include: 

- Uploading a file to the integrated IPFS node via the ipfs(addBytes) extrinsic
- Retrieving a file from the integrated IPFS node via the ipfs(catBytes) extrinsic
- Signing the previously mentioned transactions via the polkadot.js browser extensions
- Indexing the connected blockchains for files uploaded by the selected account
- Switching the connection between different nodes

