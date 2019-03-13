/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require("level");
const chainDB = "./chaindata";

class LevelSandbox {
    constructor() {
        this.db = level(chainDB);
    }

    // Add data to levelDB with key/value pair
    addLevelDBData(key, value) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.put(key, value, function(err) {
                if (err) {
                    console.log("Block " + key + " cannot be added to chain ", err);
                    reject(err);
                }
                resolve(value);
            });
        });
    }

    // Get data from levelDB with key
    getLevelDBData(height) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.db.get(height, function(err, value) {
                if (err) {
                    console.log("Block " + height + " is not on the chain");
                    reject(err);
                }
                resolve(value);
            });
        });
    }

    // Method that return the height
    getBlockHeight() {
        let self = this;
        let countKey = [];
        return new Promise(function(resolve, reject) {
            self.db
                .createReadStream()
                .on("data", function(data) {
                    countKey.push(data.key);
                })
                .on("error", function(err) {
                    console.log("Error with getting info by Address!", err);
                })
                .on("end", function() {
                    resolve(countKey.length - 1);
                });
        });
    }
}

module.exports.LevelSandbox = LevelSandbox;
