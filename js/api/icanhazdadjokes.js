import {
    Client
} from 'node-rest-client';

import config from '../../Configuration';

const args = {
        headers: {
            Accept: 'application/json',
            'User-Agent': config.api.userAgent
        }
    },
    client = new Client();

client.registerMethod('joke', 'https://icanhazdadjoke.com/', 'GET');
client.registerMethod('getJokeWithId', 'https://icanhazdadjoke.com/j/${jokeId}', 'GET');
client.registerMethod('searchForJokesWith', 'https://icanhazdadjoke.com/search?term=${searchTerm}', 'GET');

export default client;

export {
    args
};
