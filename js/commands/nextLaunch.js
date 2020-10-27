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
import launchLibrary from '../api/launchlibrary';
import padStart from 'pad-start';

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
};

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
        launchLibrary.upcomingLaunches().then(launches => {
            const embed = new Discord.MessageEmbed(),
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
            } else if (!nextLaunch || !nextLaunch.window_start) { // Launch data is missing or malformed
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
                windowOpens = new Date(nextLaunch.window_start);

                // Build the RichEmbed response
                embed.setTitle(nextLaunch.name)
                    .setAuthor('Next Scheduled Rocket Launch', jinx._client.user.avatarURL)
                    .setColor(0x00AE86).setThumbnail(nextLaunch.rocket.configuration.image_url)
                    .setFooter('Data provided by Launch Library 2 <https://thespacedevs.com/llapi>')
                    .addField('Launch Vehicle', nextLaunch.rocket.configuration.name);

                /*
                Some of the API response properties are optional or of
                variable length. These conditionals safeguard against
                the flawed assumption that these properties will always
                be present and prevent unnecessary error conditions.
                */
                if (nextLaunch.mission) {
                    embed.addField('Mission', `${nextLaunch.mission.name}`);
                    embed.setDescription(nextLaunch.mission.description ?
                        nextLaunch.mission.description :
                        '');
                }

                embed.addField('When?', `${timeToLaunch(windowOpens)}\n${windowOpens}`);

                if (arrayExistsAndHasLength(nextLaunch.vidURLs)) {
                    embed.setURL(nextLaunch.vidURLs[0].url);
                }

                if (nextLaunch.pad) {
                    embed.addField('Where?', `${nextLaunch.pad.name}\n${nextLaunch.pad.location.name}`);
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
