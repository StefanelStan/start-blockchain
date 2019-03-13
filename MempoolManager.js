const bitcoinMessage = require('bitcoinjs-message');

class MempoolManager {
    constructor (){
        this.unvalidatedRequests = new Map();
        this.validatedRequests = new Map();
        this.requestsToDelete = new Map();
    }
   
    //Ask to register the request.
    //First check if address is not already in the unvalidatedRequest. If it's not there, check if it has already been validated. If it's not there, 
    //then add it in unvalidated and in requestsToDelete
    registerRequest(address) {
        if(this.isRequestRegistered(address) == false){
            if(this.isRequestValidated(address) == false){
                let timeStamp = new Date().getTime().toString().slice(0, -3);
                this.unvalidatedRequests.set(address, timeStamp);
                this.createDeletionEvent(address);
                return this.buildMessageToSign(address, timeStamp);
            }
            else {
                throw new Error('Address has already been validated! Please register a star now!');     
            }
        }
        else {
            //in this scenario the user already has one active request. The response should a message to sign a new message but with a smaller time=frame
            return this.buildMessageWithShrunkWindow(address);
        }
    }

   async validateRequest(address, signature) {
    //check if address is in the unvalidatedRequests OR if this has not already been validated. 
    //if the request is in unvalidatedRequests, check the validationwondow..to be under 300 (althought the event createDeletionEvent should have removed it by itself)
    //you rebuild the message here: ${address}:${timeStamp}:starRegistry`. timestamp is already in the unvalidatedRequests.
    //await verifyMessageSignature ()
    //also remember to clear the expiration timeout by clearTimeout(this.requestsToDelete.get(address));
   }

    isRequestRegistered(address) {
        let request = this.getUnvalidatedRequest(address);
        if (request == null || request == undefined){
            return false;
        }
        return true;
    }

    isRequestValidated(address) {
        let request = this.getValidatedRequest(address);
        if (request == null || request == undefined){
            return false;
        }
        return true;
    }
    
    getUnvalidatedRequest(address){
        return  this.unvalidatedRequests.get(address);
    }

    getValidatedRequest(address) {
        return this.validatedRequests.get(address);
    }

    buildMessageWithShrunkWindow(address) {
        let timeStamp = this.getUnvalidatedRequest(address);
        return {
            address,
            'requestTimeStamp': timeStamp,
            'message': `${address}:${timeStamp}:starRegistry`,
            "validationWindow": 300 - (parseInt(new Date().getTime().toString().slice(0, -3) - parseInt(timeStamp)))
        };
    }

    buildMessageToSign(address, timeStamp) {
        return {
            address,
            'requestTimeStamp': timeStamp,
            'message': `${address}:${timeStamp}:starRegistry`,
            "validationWindow": 300
        };
    }

    createDeletionEvent(address) {
        this.requestsToDelete.set(address, setTimeout(() => {
            this.requestsToDelete.delete(address);
        }, 300000));
    }

    async verifyMessageSignature(message, address, signature) {
        console.log("this is the MSG:", typeof message, (message));
        console.log("this is the address:", typeof address, (address));
        console.log("this is the signature:", typeof signature, (signature));
        try {
            return await bitcoinMessage.verify(message, address, signature);
        } catch (err) {
            return false;
        }
    };
    
    
}


module.exports = {
    MempoolManager
}