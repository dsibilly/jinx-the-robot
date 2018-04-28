/**
The nextLaunch command.
Retrieves a the next scheduled rocket launch from launchlibrary.net
and displays its information in the channel where the command was
invoked.

@module commands/nextLaunch
*/

import _Error from 'isotropic-error';
import arrayExistsAndHasLength from '../util/arrayExistsAndHasLength';
import countdown from 'countdown';
import Discord from 'discord.js';
import launchLib from '../api/launchlibrary';
import padStart from 'pad-start';
import presage from 'presage';
import promisifyClient from '../util/promisifyClient';

/**
Transforms a JavaScript Date object in the future into a human-readable
countdown to that date and time from the present.

@function timeToLaunch
@private
@arg {Date} date
@returns {String}
*/
const timeToLaunch = date => {
        const timespan = countdown(date);

        return `L-${timespan.days === 1 ?
            '1 day' :
            `${timespan.days} days`}, ${padStart(timespan.hours, 2, 0)}:${padStart(timespan.minutes, 2, 0)}:${padStart(timespan.seconds, 2, 0)}`;
    },
    /**
    Wrap the `launch` method of the launchlibrary API in a Promise that
    resolves with the next `next` launches (where `next` >= 1.)

    @function nextLaunches
    @private
    @arg {Client} client A node-rest-client instance
    @arg {Number} next The number of upcoming launches to retrieve
    @returns {Promise<Object>}
    */
    nextLaunches = (client, next) => promisifyClient(client, 'launch', {
        next
    }),
    /**
    Wrap the `launch` method of the launchlibrary API in a Promise that
    resolves with data for the launch specified by `launchId`.

    @function nextLaunch
    @private
    @arg {Client} client A node-rest-client instance
    @arg {Number} launchId The ID number of a specific launch
    @returns {Promise<Object>}
    */
    nextLaunch = (client, launchId) => promisifyClient(client, 'launch', {
        id: launchId,
        mode: 'verbose'
    }),
    /**
    Get the next specified number of scheduled launches and retrieve
    full data on each.

    @function getLaunches
    @private
    @arg {Number} numberOfLaunches
    @returns {Promise<Array>}
    */
    getLaunches = numberOfLaunches => nextLaunches(launchLib, numberOfLaunches)
        .then(response => presage.filter(response.launches, launch => Promise.resolve(!launch.tbddate && !launch.tbdtime)))
        .then(launches => presage.map(launches, launch => nextLaunch(launchLib, launch.id)))
        .then(launches => presage.map(launches, launchData => new Promise(resolve => {
            const launchObject = launchData.launches[0];

            resolve(launchObject);
        })));

export default {
    /**
    @property {String} description
    */
    description: 'displays information about the next upcoming rocket launch. Powered by launchlibrary.net.',

    /**
    @method process
    @arg {Jinx} jinx
    @arg {Discord.Message} message
    @returns {Promise<Discord.Message>}
    */
    process: (jinx, message) => new Promise((resolve, reject) => {
        const author = message.author.tag,
            channel = message.channel ?
                message.channel.name :
                null,
            command = 'nextLaunch',
            server = message.guild ?
                message.guild.name :
                null,

            /**
            Log an error to the command log.

            @function logError
            @protected
            @arg {Error|isotropic-error} error
            */
            logError = error => {
                jinx._commandLog.command('error', {
                    author,
                    channel,
                    command,
                    error,
                    server
                });
            },

            /**
            Log a reply to the command log.

            @function logReply
            @protected
            @arg {Object} details
            */
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

        // Retrieve data on the next launch...
        getLaunches(1).then(launches => {
            const embed = new Discord.RichEmbed(),
                nextLaunch = launches[0];

            let windowOpens;

            if (!launches.length) { // No launches found
                message.channel.send('There are no upcoming launches with firm launch dates. Check back later!').then(newMessage => {
                    logReply({
                        message: newMessage.content,
                        noMissionFound: true
                    });
                    resolve(newMessage);
                });
            } else if (!nextLaunch || !nextLaunch.windowstart) { // Launch data is missing or malformed
                message.channel.send('I\'m having trouble finding the next rocket launch right now. Please try again later!').then(newMessage => {
                    logError(_Error({
                        details: {
                            nextLaunch
                        },
                        message: newMessage.content
                    }));
                    resolve(newMessage);
                });
            } else {
                // Calculate when the launch window opens
                windowOpens = new Date(nextLaunch.windowstart);

                // Build the RichEmbed response
                embed.setTitle(nextLaunch.name)
                    .setAuthor('Next Scheduled Rocket Launch', jinx._client.user.avatarURL)
                    .setColor(0x00AE86).setThumbnail(nextLaunch.rocket.imageURL)
                    .setFooter('Data provided by launchlibrary.net')
                    .addField('Launch Vehicle', nextLaunch.rocket.name)
                    .addField('When?', `${timeToLaunch(windowOpens)}\n${windowOpens}`)
                    .setFooter('Data provided by launchlibrary.net');

                /*
                Some of the API response properties are optional or of
                variable length. These conditionals safeguard against
                the flawed assumption that these properties will always
                be present and prevent unnecessary error conditions.
                */
                if (arrayExistsAndHasLength(nextLaunch.missions)) {
                    embed.addField('Mission', `${nextLaunch.missions[0].name}`);
                    embed.setDescription(nextLaunch.missions[0].description ?
                        nextLaunch.missions[0].description :
                        '');
                }

                if (arrayExistsAndHasLength(nextLaunch.vidURLs)) {
                    embed.setURL(nextLaunch.vidURLs[0]);
                }

                if (nextLaunch.location && arrayExistsAndHasLength(nextLaunch.location.pads)) {
                    embed.addField('Where?', nextLaunch.location.pads[0].name);
                } else {
                    embed.addField('Where?', 'Launch site unknown');
                }

                // Send the reply
                message.channel.send({
                    embed
                }).then(newMessage => {
                    logReply({
                        nextLaunch
                    });
                    resolve(newMessage);
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
