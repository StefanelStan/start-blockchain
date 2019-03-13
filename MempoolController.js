import {Block} from "./Block";
import {Blockchain} from "./Blockchain";

const bitcoinMessage = require('bitcoinjs-message');


//Add to blockchain
const blockchain = new Blockchain();


class Mempool {

    constructor(server) {
        this.server = server;
        this.invalidMempool = [];
        this.validMempool = [];
        this.AddRequestValidation();
        this.validateRequestByWallet();
        this.verifyAddressRequest();

        this.getBlockByHash();
        this.getBlockByAddress();
        this.getBlockByHeight();
    }

    AddRequestValidation() {
        const self = this;
        this.server.route({
            method: 'POST',
            path: '/requestValidation',
            handler: (request, h) => {
                //Store the data
                let data = request.payload;

                //Check for request in the invalid Mempool
                let foundRequest = this.invalidMempool.find(function (element) {
                    return element.address === data.address;
                });

                if (foundRequest) {
                    //Calculate the remaining time
                    let timeStamp = foundRequest.requestTimeStamp;
                    let actualTime = (new Date().getTime().toString().slice(0, -3));
                    let differenceTime = actualTime - timeStamp;

                    //Update the validationWindow
                    foundRequest.validationWindow = foundRequest.validationWindow - (differenceTime / 10);
                    return foundRequest;
                } else {
                    const TimeoutRequestsWindowTime = 5 * 60;

                    //Create block for the invalidMempool
                    data.requestTimeStamp = (new Date().getTime().toString().slice(0, -3));
                    data.message = data.address + ":" + data.requestTimeStamp + ":starRegistry";
                    data.validationWindow = TimeoutRequestsWindowTime;

                    /***SetTimeout for Mempool to be validated****/
                    data.timeoutRequest = () => {
                        setTimeout(function () {
                            self.removeValidationRequest(data.address);
                        }, 300);
                    };


                    /***Push to invalidMempool Array***/
                    this.invalidMempool.push(data);
                    console.log("This is the data", data);
                    console.log("this is the invalid chain: ", this.invalidMempool);
                    return data;
                }
            }
        });
    }

    removeValidationRequest(address) {
        //Check if the block exist on the invalidMempool Array
        let foundRequest = this.invalidMempool.find(function (element) {
            return element.address === address;
        });
        if (foundRequest) {
            //Delete the block in the mempool
            for (let i = 0; i < this.invalidMempool.length; i++) {
                if (this.invalidMempool[i].address === address) {
                    this.invalidMempool.splice(this.invalidMempool[i], 1);
                }
            }
            console.log("Block deleted");
        } else {
            return "Cant delete the block, block expired";
        }
    }

    validateRequestByWallet() {
        this.server.route({
            method: 'POST',
            path: '/message-signature/validate',
            handler: async (request, h) => {
                //Store the data
                let data = request.payload;
                console.log("This is the data:", data);
                const self = this;

                //Set field for validMempool
                var address = data.address;
                var signature = data.signature;
                var message;

                (function test() {
                    self.invalidMempool.forEach(function (element) {
                        if (element.address === data.address) {
                            message = element.message;
                            return message;
                        }
                    });
                })();


                //Chek for address provide by user in the InvalidMempool
                let found = this.invalidMempool.find(function (element) {
                    return element.address === data.address;
                });


                let verify = await verifyMessageSignature(message, address, signature);
                console.log(verify);

                console.log("Verify?", bitcoinMessage.verify(message, address, signature));
                if (bitcoinMessage.verify(message, address, signature) && found !== undefined) {
                    //Create new Valid Object
                    let validObj = {};
                    validObj.registerStar = true;
                    validObj.status = {
                        address: data.address,
                        requestTimeStamp: (new Date().getTime().toString().slice(0, -3)),
                        message: data.address + ":" + validObj.requestTimeStamp + ":starRegistry",
                        validationWindow: 200,
                        messageSignature: true
                    };

                    //Add to validMempool and return to user
                    console.log("Added to validMempool", this.validMempool);
                    this.validMempool.push(validObj);
                    return validObj;
                } else {
                    return "I'm sorry your block is expired or the signature is not valid"
                }
            }
        });
    }

    verifyAddressRequest() {
        this.server.route({
            method: 'POST',
            path: '/block',
            handler: (request, h) => {
                //Default data
                let data = request.payload;

                //Search the element into the validMempool
                let found = this.validMempool.find(function (element) {
                    return element.status.address === data.address;
                });

                if (found !== undefined) {
                    //Sent to encoding function, return promises
                    let block = this.encodeStarInfo(data).then(function (result) {
                        return result;
                    }).catch(function (err) {
                        consol.log(err);
                    });

                    //Remove from validMempool
                    for (let i = 0; i < this.validMempool.length; i++) {
                        if (this.validMempool[i]['status'].address === data.address) {
                            this.validMempool.splice(this.validMempool[i], 1);
                        }
                    }

                    return block;
                } else {
                    return "I'm sorry, your block is no more on the mempool"
                }
            }
        });
    }

    encodeStarInfo(star_info) {
        //create body of the block for the blockchain
        let body = {
            address: star_info.address,
            star: {
                ra: star_info.star.ra,
                dec: star_info.star.dec,
                mag: (star_info.star.mag ? star_info.star.mag : 'no mag data'),
                cen: (star_info.star.cen ? star_info.star.cen : 'no cen data'),
                story: Buffer(star_info.star.story).toString('hex'),
                storyDecoded: star_info.star.story
            }
        };

        //Sent to createBlock function
        let result = this.createBlock(body);
        return result;
    }

    createBlock(body) {
        //Create Block
        let block = new Block(body);
        //Add block to blockchain
        let result = blockchain.addBlock(block);
        return result;
    }

    getBlockByHash() {
        this.server.route({
            method: 'GET',
            path: '/stars/hash:{hash}',
            handler: (request, h) => {
                const HASH = request.params.hash;
                return blockchain.getByHash(HASH);
            }
        });
    }

    getBlockByAddress() {
        this.server.route({
            method: 'GET',
            path: '/stars/address:{address}',
            handler: (request, h) => {
                const WALLET = request.params.address;
                return blockchain.getByWallet(WALLET);
            }
        });
    }

    getBlockByHeight() {
        this.server.route({
            method: 'GET',
            path: '/block/{height}',
            handler: async (request, h) => {
                console.log("Interrogo la Blockchain!");
                let output = await blockchain.getBlock(request.params.height);
                return JSON.parse(output);
            }
        });
    }
}

var verifyMessageSignature = async (message, address, signature) => {
    console.log("this is the MSG:", typeof message, (message));
    console.log("this is the address:", typeof address, (address));
    console.log("this is the signature:", typeof signature, (signature));
    try {
        return await bitcoinMessage.verify(message, address, signature);
    } catch (err) {
        return "there are some errors";
    }
};

module.exports = (server) => {
    return new Mempool(server);
};