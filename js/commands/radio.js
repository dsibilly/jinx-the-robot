/**
The Radio command.
Inspects the Icecast relay for Hammer Public Radio and replies with a
list of all active stations.

@module commands/radio
*/
import _Error from 'isotropic-error';
import config from '../../Configuration';
import convertNumber from 'number-to-words';
import Discord from 'discord.js';
import request from 'request-promise-native';

/**
Retrieves Icecast2 server status from the configured server.

@function getRadioServerStatus
@private
@returns {Promise<Object>}
*/
const getRadioServerStatus = () => request({
    headers: {
        'User-Agent': config.api.userAgent
    },
    json: true,
    uri: `http://${config.radio.host}:${config.radio.port}/status-json.xsl`
});

export default {
    /**
    @property {String} description
    */
    description: 'Inspects the Icecast relay for Hammer Public Radio and replies with a list of all active stations.',

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
            command = 'radio',
            server = message.guild ?
                message.guild.name :
                null,

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

        getRadioServerStatus().then(response => {
            const embed = new Discord.RichEmbed(),
                serverStatus = response.icestats,
                stations = [];

            if (!serverStatus.source) {
                // No stations broadcasting.
                message.channel.send(`There are no stations currently on the air, <@${message.author.id}>`).then(newMessage => {
                    logReply({
                        message: newMessage.content,
                        noBroadcasts: true
                    });
                    resolve(newMessage);
                }).catch(error => {
                    reject(_Error({
                        error,
                        message: 'radio message send error'
                    }));
                });
                return;
            }

            /*
            Icecast's JSON API is kinda dumb: if there is only one
            station broadcasting, the `source` property on the icestats
            object is a data object, but if there are multiple stations
            then the `source` property is an array of objects.

            I'm simplifying the logic required to assemble the reply by
            putting all station data into an array in a
            context-sensitive way.
            */
            if (Array.isArray(serverStatus.source)) {
                // I love the new array spread syntax... :-)
                stations.push(...serverStatus.source);
            } else {
                stations.push(serverStatus.source);
            }

            embed.setTitle('Hammer Public Radio Network Status')
                .setColor(0xA80000)
                .setFooter('Powered by Icecast2 streaming media server');

            // Use the description to show how many stations are live.
            switch (stations.length) {
                case 0:
                    embed.setDescription('There are no HPR stations on-the-air at this time.');
                    break;

                case 1:
                    embed.setDescription('There is one HPR station on-the-air:');
                    break;

                default:
                    embed.setDescription(`There are ${convertNumber.toWords(stations.length)} HPR stations on-the-air:`);
            }

            // Iterate over the station data. If there are no stations this does nothing.
            stations.forEach(source => {
                embed.addField(`${source.server_name}`, `${source.server_description === 'Unspecified description' ?
                    '' :
                    `${source.server_description}\n`}${source.listenurl}.m3u`);
            });

            message.channel.send({
                embed
            }).then(newMessage => {
                logReply({
                    serverStatus
                });
                resolve(newMessage);
            }).catch(error => {
                reject(_Error({
                    error,
                    message: 'radio message send error'
                }));
            });
        }).catch(error => {
            reject(_Error({
                error,
                message: 'Icecast JSON API error'
            }));
        });
    })
};
