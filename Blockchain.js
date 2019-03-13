const regeneratorRuntime = require("regenerator-runtime");
import {Block} from "./Block";

//Importing levelSandbox class
const LevelSandbox = require("./levelSandbox.js");

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {
    constructor() {
        var self = this;

        //init LevelDB
        self.levelDB = new LevelSandbox.LevelSandbox();

        //Check for genesis Block
        self.getBlock(0).then(
            function (value) {
                console.log("Genesis Block Found", value);
            },
            function (err) {
                self.generateGenesisBlock();
            }
        );
    }

    generateGenesisBlock() {
        //set Genesis Block
        let genesis_block = new Block("First Block!");
        genesis_block.height = 0;
        genesis_block.time = new Date()
            .getTime()
            .toString()
            .slice(0, -3);
        genesis_block.hash = SHA256(JSON.stringify(genesis_block)).toString();

        //Add Block to chain
        this.levelDB
            .addLevelDBData(
                genesis_block.height,
                JSON.stringify(genesis_block).toString()
            )
            .then(function (value) {
                console.log("Block added to chain!", value);
            })
            .catch(function (err) {
                console.log("Oops! Something went wrong!", err);
            });
    }

    // Add new block
    async addBlock(newBlock) {
        let self = this;

        newBlock.height = (await self.levelDB.getBlockHeight()) + 1;
        newBlock.time = new Date()
            .getTime()
            .toString()
            .slice(0, -3);
        //Add Hash (prev and actual)
        var parse_json = JSON.parse(await self.getBlock(newBlock.height - 1));
        var prev_hash = parse_json.hash;

        newBlock.previousBlockHash = prev_hash;
        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();


        //Add to DB
        var addDB = await self.levelDB.addLevelDBData(
            newBlock.height,
            JSON.stringify(newBlock).toString()
        );

        return newBlock;
    }

    // get block by his Height
    getBlock(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.levelDB.db.get(height, function (err, value) {
                if (err) {
                    console.log("Block " + height + " is not on the chain");
                    reject(err);
                }
                console.log("Get block return:", value);
                resolve(value);
            });
        });
    }

    getByHash(HASH) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.levelDB.db.createValueStream()
                .on('data', function (data) {
                    let blocks = JSON.parse(data);
                    if(blocks.hash === HASH){
                        resolve(blocks);
                    }
                });
        });
    }

    getByWallet(WALLET) {
        let self = this;
        let blocks_list = [];
        return new Promise((resolve, reject) => {
            self.levelDB.db.createReadStream()
                .on("data", function(data) {
                    /*let blocks = JSON.parse(data);
                    if(blocks.body.address === WALLET){
                        blocks_list.push(blocks);
                    }*/
                    let blocks = JSON.parse(data.value);
                    if(blocks.body.address === WALLET){
                        blocks_list.push(blocks);
                    }
                })
                .on("error", function(err) {
                    console.log("Oh my!", err);
                })
                .on("end", function() {
                    resolve(blocks_list);
                });
        })
    }
}

module.exports.Blockchain = Blockchain;