/**
A node-rest-client wrapper around the launchlibrary.net API

@module api/launchlibrary
*/

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

// TODO: Upgrade to launchlibrary v1.3 API
client.registerMethod('agency', 'https://launchlibrary.net/1.2/agency', 'GET');
client.registerMethod('agencyType', 'https://launchlibrary.net/1.2/agencytype', 'GET');
client.registerMethod('eventType', 'https://launchlibrary.net/1.2/eventtype', 'GET');
client.registerMethod('launch', 'https://launchlibrary.net/1.2/launch', 'GET');
client.registerMethod('launchEvent', 'https://launchlibrary.net/1.2/launchevent', 'GET');
client.registerMethod('launchStatus', 'https://launchlibrary.net/1.2/launchstatus', 'GET');
client.registerMethod('location', 'https://launchlibrary.net/1.2/location', 'GET');
client.registerMethod('mission', 'https://launchlibrary.net/1.2/mission', 'GET');
client.registerMethod('missionEvent', 'https://launchlibrary.net/1.2/missionevent', 'GET');
client.registerMethod('missionType', 'https://launchlibrary.net/1.2/missiontype', 'GET');
client.registerMethod('nextLaunch', 'http://launchlibrary.net/1.2/launch/next/1', 'GET');
client.registerMethod('pad', 'https://launchlibrary.net/1.2/pad', 'GET');
client.registerMethod('rocket', 'https://launchlibrary.net/1.2/rocket', 'GET');
client.registerMethod('rocketEvent', 'https://launchlibrary.net/1.2/rocketevent', 'GET');
client.registerMethod('rocketFamily', 'https://launchlibrary.net/1.2/rocketfamily', 'GET');

export default client;

export {
    args
};
