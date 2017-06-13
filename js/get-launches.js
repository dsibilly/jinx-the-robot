import launchLib, {
    args
} from './launch-library-api';

import clone from './clone';
import countdown from 'countdown';
import Discord from 'discord.js';
import padStart from 'pad-start';
import presage from 'presage';

const timeToLaunch = date => {
        const timespan = countdown(date);

        return `L-${timespan.days === 1 ?
            '1 day' :
            `${timespan.days} days`}, ${padStart(timespan.hours, 2, 0)}:${padStart(timespan.minutes, 2, 0)}:${padStart(timespan.seconds, 2, 0)}`;
    },
    promisify = (client, method, parameters) => {
        const {
            callbackFunction,
            promise
        } = presage.promiseWithCallback();

        client.methods[method](clone(args, {
            parameters
        }), response => {
            callbackFunction(null, response);
        });

        return promise;
    },
    nextLaunches = (client, next) => promisify(client, 'launch', {
        next
    }),
    nextLaunch = (client, launchId) => promisify(client, 'launch', {
        id: launchId,
        mode: 'verbose'
    }),
    getLaunches = numberOfLaunches => nextLaunches(launchLib, numberOfLaunches).then(response => presage.filter(response.launches, launch => Promise.resolve(!launch.tbddate && !launch.tbdtime))).then(launches => presage.map(launches, launch => nextLaunch(launchLib, launch.id))).then(launches => presage.map(launches, launchData => new Promise(resolve => {
        const launchObject = launchData.launches[0];

        resolve(launchObject);
        // resolve(`Mission: ${mission}\nLaunch vehicle: ${rocket}\nLaunch Site: ${launchSite}\nLaunch window opens at ${launchTime} (${timeToLaunch(launchTime)})\nWatch online: ${videoUrl}\n`);
    })));

export default (bot, message) => new Promise((resolve, reject) => {
    getLaunches(1).then(launches => {
        const nextLaunch = launches[0],
            windowOpens = new Date(nextLaunch.windowstart);

        message.channel.send({
            embed: new Discord.RichEmbed()
                .setTitle('Next Rocket Launch')
                // .setAuthor(bot.user.username, bot.user.avatarURL)
                .setColor(0x00AE86).setThumbnail(nextLaunch.rocket.imageURL)
                .setURL(nextLaunch.vidURLs[0])
                .addField('Date', `${windowOpens} (${timeToLaunch(windowOpens)})`)
                .addField('Mission', nextLaunch.missions[0].name)
                .addField('Launch Vehicle', nextLaunch.rocket.name)
                .addField('Launch Site', nextLaunch.location.pads[0].name)
        }).then(() => {
            resolve();
        }).catch(error => {
            reject(error);
        });
    });
});
