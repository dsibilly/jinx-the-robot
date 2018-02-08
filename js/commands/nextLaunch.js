import launchLib, {
    args
} from '../api/launchlibrary';

import _Error from 'isotropic-error';
import clone from '../util/clone';
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

export default {
    description: 'displays information about the next upcoming rocket launch from launchlibrary.net',
    process: (jinx, message) => new Promise((resolve, reject) => {
        const author = message.author.tag,
            channel = message.channel ?
                message.channel.name :
                null,
            command = 'nextLaunch',
            server = message.guild ?
                message.guild.name :
                null,

            logError = error => {
                jinx._commandLog.command('error', {
                    author,
                    channel,
                    command,
                    error,
                    server
                });
            },
            logReply = details => {
                jinx._commandLog.command('reply', {
                    author,
                    channel,
                    command,
                    details,
                    message: message.content,
                    server
                });
            };

        getLaunches(1).then(launches => {
            const embed = new Discord.RichEmbed(),
                nextLaunch = launches[0];
            let windowOpens;

            if (!launches.length) {
                message.channel.send('There are no upcoming launches with firm launch dates. Check back later!').then(() => {
                    logReply({
                        noMissionFound: true
                    });
                    resolve();
                });
            } else if (!nextLaunch || !nextLaunch.windowstart) {
                message.channel.send('I\'m having trouble finding the next rocket launch right now. Please try again later!').then(() => {
                    logError(_Error({
                        details: {
                            nextLaunch
                        },
                        message: 'Unable to process rocket launch info'
                    }));
                    resolve();
                });
            } else {
                windowOpens = new Date(nextLaunch.windowstart);

                embed.setTitle(nextLaunch.name)
                    .setAuthor('Next Scheduled Rocket Launch', jinx._client.user.avatarURL)
                    .setColor(0x00AE86).setThumbnail(nextLaunch.rocket.imageURL)
                    .setURL(nextLaunch.vidURLs[0])
                    .addField('Mission', `${nextLaunch.missions[0].name}`)
                    .addField('Launch Vehicle', nextLaunch.rocket.name)
                    .addField('When?', `${timeToLaunch(windowOpens)}\n${windowOpens}`)
                    .addField('Where?', nextLaunch.location.pads[0].name)
                    .setFooter('Data provided by launchlibrary.net')
                    .setDescription(nextLaunch.missions[0].description ?
                        nextLaunch.missions[0].description :
                        '');

                message.channel.send({
                    embed
                }).then(() => {
                    logReply({
                        nextLaunch
                    });
                    resolve();
                }).catch(error => {
                    reject(_Error({
                        error,
                        message: 'nextLaunch message send error'
                    }));
                });
            }
        }).catch(error => {
            reject(_Error({
                error,
                message: 'launchlibrary.net API error'
            }));
        });
    })
};
