/**
A node-fetch wrapper around the launchlibrary.net API

@module api/launchlibrary
*/

import config from '../../Configuration';
import fetch from 'node-fetch';
import presage from 'presage';

const args = {
        headers: {
            Accept: 'application/json',
            'User-Agent': config.api.userAgent
        }
    },
    baseUri = 'https://ll.thespacedevs.com/2.0.0',
    client = {
        upcomingLaunches () {
            return fetch(`${baseUri}/launch/upcoming/`, args)
                .then(response => response.json())
                .then(json => presage.filter(json.results, launch => Promise.resolve(!launch.tbddate && !launch.tbdtime && launch.status.id === 1)))
                .then(launches => presage.map(launches, launch => fetch(`${baseUri}/launch/${launch.id}/`, args).then(response => response.json())))
                .then(results => results.slice(0));
        }
    };

export default client;

export {
    args
};
