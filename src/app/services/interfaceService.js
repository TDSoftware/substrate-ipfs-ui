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
  