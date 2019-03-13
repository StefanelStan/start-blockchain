# Star Registry Service

This project allows users to claim ownership of their favorite star in the night sky, with the use ob blockchain.

### Prerequisites

Once you cloned the repo on your pc, install the dependencies by run:

```
npm install
```

And be sure to have Curl or [Postman](https://www.getpostman.com/) installed for test the GET/POST request.

### How to use it

Before using the API we need to set-up our server by running:

```
node stars.js
```

As you can see there are already a default data set. This is the workflow you should follow to add a block into the blockchain:

* POST : [server-url]/requestValidation

* POST : [server-url]/message-signature/validate

* POST : [server-url]/block

Now you can interrogate the blockhain with:

* GET : [server-url]/block/{number} -> get the block by {number} height

* GET : [server-url]/stars/hash:{hash} -> get the block by {hash} 

* GET : [server-url]/stars/address:{address} -> get the block by {address} 



## Built With

* [NodeJS](https://nodejs.org/en/)
* [LevelDB](http://leveldb.org/)
* [Hapi.js](https://hapijs.com/)

## License

This project is licensed under the MIT License
