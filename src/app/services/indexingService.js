import initSqlJs from 'sql.js';

export async function initializeDatabase() {
    const sql = await initSqlJs(
        {
            locateFile: file => `https://sql.js.org/dist/${file}`        }
    )
    const db = new sql.Database();
    createTable(db);
    console.log("Database initialized!")
    return db;
}

function createTable(db) {
    db.run("CREATE TABLE IF NOT EXISTS files (address, cid, block, wsProvider);");
    const res = db.exec("SELECT * FROM files");
}

export function addFileToDatabase(db, address, cid, block, wsProvider) {
    db.run("INSERT INTO files VALUES (?, ?, ?, ?)", [address, cid, block, wsProvider]);
}

function getFilesForUserAndWsProvider(db, address, wsProvider) {
    const res = db.exec(`SELECT * FROM files WHERE address = ${address} AND wsProvider = ${wsProvider}`);
    return res;
}


export async function indexChain(api, from, to) {
    const startHash = await api.rpc.chain.getBlockHash(from);
    readBlock(api, startHash.toString(), from, to);
}

async function readBlock(api, blockHash, from, to) {
    let block = await api.rpc.chain.getBlock(blockHash);
    console.log(block.block.header.number.toNumber());
    if (block.block.header.number.toNumber() >= to) readBlock(block.block.header.parentHash.toString(), from, to);
    else {
        console.log(new Date());
        return;
    }
}
