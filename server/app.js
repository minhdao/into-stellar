require('./config/config.js'); // load in config file

const request = require('request');

var getAccountInfo = (accountId) => {
    return new Promise((resolve, reject) => {
        request({
            url: `https://horizon.stellar.org/accounts/${accountId}`,
            json: true
        }, (error, response, body) => {
            if (error){
                reject("Unable to connect to server.");
            }
            if (response.statusCode == 200){
                console.log('can get data');
                resolve(body);
            }else{
                reject(`Cannot fetch data due to error ${body.status} ${body.detail}`);
            }
        });
    });
};

getAccountInfo(process.env.STELLAR_ADDRESS).then((result) => {
    console.log(result);
}).catch((error) => {
    console.log(error);
});

// exports methods to use
module.exports = {
    getAccountInfo
};
