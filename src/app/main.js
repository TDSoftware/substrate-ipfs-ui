import extensionService from "./services/extensionService";
import { connectToExtension, getAccounts } from "./services/extensionService";

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  await connectToExtension();
  await populateAccounts();

  console.log("App started");
}

async function populateAccounts() {
    const optionsList = await getAccounts();
    const selectElement = document.querySelector("#address-select");
    optionsList.forEach(function(item) {
    let address = item.address;
      const option = document.createElement("option");
      option.value = address;
      option.text = address;
      selectElement.appendChild(option);
    });
};

main();
