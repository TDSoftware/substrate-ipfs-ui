# Overview [![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

This project is a web client for the substrate-ipfs node that allows users to interact with an integrated IPFS node. The web client allows users to upload files to IPFS and retrieve files from IPFS by providing the CID of the file. It uses [parcel](https://parceljs.org/) as a bundler and the [polkadot.js](https://polkadot.js.org/docs/) API for node interactivity.

## Getting Started 

In order to run this web client, you will first need to have a [substrate-ipfs](https://github.com/TDSoftware/substrate-ipfs) node up and running, exposing the web sockets port 9944.
This will allow the web client to interact with the node via polkadot.js. Refer to the [installation instructions](https://github.com/TDSoftware/substrate-ipfs/blob/master/README.md) of the substrate-ipfs node for more information. If you want to use the full scope of this web client, you will need to run the substrate-ipfs node as an archive node, by adding **--state.pruning=archive** to the command you use to start the node. This is necessary if you want to use the indexing section of the web client because full node does not have access to historical data.

To run the web client, the following steps have to be taken: 

1. Download the [polkadot.js browser extension](https://polkadot.js.org/extension/) and create an account. This is necessary to sign transactions.
2. Ensure [npm](https://www.npmjs.com/) is installed on your machine.
3. Run the command **npm install** in the project directory to install necessary dependencies
4. Run the command **npm run start** in the project directory to start the web client.

The client will by default run on port 1234, so go to the URl *localhost:1234* to access the web client.

## Functionalities

This Web-Client has multiple functionalities for showcasing the capabilities of the substrate-ipfs node. These functionalitites include: 

- Uploading a file to the integrated IPFS node via the ipfs(AddBytes) extrinsic
- Retrieving a file from the integrated IPFS node via the ipfs(CatBytes) extrinsic
- listening to the events emitted by the ocw callback to retrieve the cid/ data from the extrinsics
- Converting files to byte arrays and byte arrays to file (by using magic bytes -> thus some file extensions may not be recognized)
- Signing the previously mentioned transactions via the polkadot.js browser extensions
- Indexing the connected blockchains for files uploaded by the selected account (without storage)
- Switching the connection between different nodes

## Benchmarking

In addition to the web client, this project contains a CLI simulation tool that can be used for benchmarking. The CLI will guide you through multiple steps where you definer your benchmarking needs and will then create a specified amount of dummy files of a specific size that will be uploaded to the substrate-ipfs node via the ipfs(AddBytes) extrinsic. This can be used for benchmarking and stress testing a substrate-ipfs node and the underlying rust-ipfs implementation.

To run the benchmarking, run the command **npm run benchmark**.

