const {MempoolManager} = require('./MempoolManager.js');

let mempoolManager;

//Normally you would use mocha, chai for testing purposes but let's use this crude and basic way of testing stuff...
//run this with node basicTesting.js . If this window doesn't close, then use CTRL + C to force close it down.

mempoolManager = new MempoolManager();

//test to see if mempoolManager can register a request. From your console you do node basicTestins.js
let status = mempoolManager.registerRequest("myAddress");
console.log(status);

//now ask to register again and see if the validation window has shrunk by 3 seconds;

setTimeout(() => {
    let status = mempoolManager.registerRequest("myAddress");
    console.log(status);
    },
    3000);


    