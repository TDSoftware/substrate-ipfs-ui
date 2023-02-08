// add a file entry to the list of indexed files
export function addFileToFileList(cid, block) {
    let fileList = document.querySelector(".file-list");
    let newFileItem = document.createElement("div");
    newFileItem.classList.add("file-item");

    let newCID = document.createElement("div");
    newCID.classList.add("cid");
    newCID.innerText = cid;

    let newBlock = document.createElement("div");
    newBlock.classList.add("block");
    newBlock.innerText = "Block: " + block;

    newFileItem.appendChild(newCID);
    newFileItem.appendChild(newBlock);

    fileList.appendChild(newFileItem);
}

// clear the file list of indexed files
export function resetFileList() {
    let fileList = document.querySelector(".file-list");
    let fileItems = document.querySelectorAll(".file-item");

    fileItems.forEach(function (fileItem) {
        fileList.removeChild(fileItem);
    });
}

// print results to the result boxes in the UI
export function printResult(message, box, success) {
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
  