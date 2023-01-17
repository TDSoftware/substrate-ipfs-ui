import extensionService from './services/extensionService';
import { connectToExtension } from './services/extensionService';


export function myFunction(){
    var file = document.getElementById("myFile").files[0];
    // do something with the file here
    console.log("hello")
 }

async function main() {
  await connectToExtension();
  console.log('App started');
}

main();