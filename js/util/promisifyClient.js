/**
Transform the callback-based async methods registered with a
node-rest-client instance to Promise-based async methods. Uses the
presage Promise utility library.

@module util/promisifyClient
*/
import clone from './clone';
import config from '../../Configuration';
import presage from 'presage';

/**
@function promisifyClient
@arg {Client} client A node-rest-client instance
@arg {String} method The name of a registered method on the node-rest-client
@arg {Object} parameters Argument parameters to be passed to the registered methods
@returns {Promise<Object>}
*/
export default (client, method, parameters = {}) => {
    const {
        callbackFunction,
        promise
    } = presage.promiseWithCallback();

    client.methods[method](clone({
        headers: {
            Accept: 'application/json',
            'User-Agent': config.api.userAgent
        }
    }, {
        parameters
    }), response => {
        callbackFunction(null, response);
    });

    return promise;
};
