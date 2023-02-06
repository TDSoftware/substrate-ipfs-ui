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

export function resetFileList() {
    let fileList = document.querySelector(".file-list");
    let fileItems = document.querySelectorAll(".file-item");

    fileItems.forEach(function (fileItem) {
        fileList.removeChild(fileItem);
    });
}

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
  