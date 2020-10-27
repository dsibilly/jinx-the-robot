/**
A node-fetch wrapper around the icanhazdadjoke.com JSON API

@module api/icanhazdadjoke
*/
import config from '../../Configuration';
import fetch from 'node-fetch';

const args = {
        headers: {
            Accept: 'application/json',
            'User-Agent': config.api.userAgent
        }
    },
    baseUri = 'https://icanhazdadjoke.com/',
    getEndpoint = uri => fetch(uri, args).then(response => response.json()),
    client = {
        getJokeWithId (jokeId) {
            return getEndpoint(`${baseUri}/j/${jokeId}`);
        },
        joke () {
            return getEndpoint(baseUri);
        },
        searchForJokesWith (searchTerm) {
            return getEndpoint(`${baseUri}/search?term=${searchTerm}`);
        }
    };

export default client;

export {
    args
};
