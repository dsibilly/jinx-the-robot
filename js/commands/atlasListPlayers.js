/**
@module commands/atlasListPlayers
*/
import _Error from 'isotropic-error';
import config from '../../Configuration';
import Discord from 'discord.js';
import presage from 'presage';
import SRC from 'source-rcon-client';

const atlasServer = config.atlas,
    atlasListPlayers = {
        /**
        @property {String} description
        */
        description: 'Allows Discord users to see who is online on the HG Atlas Server',

        /**
        @method process
        @arg {Jinx} jinx
        @arg {Discord.Message} message
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message) => new Promise((resolve, reject) => {
            // Collect message metadata for reuse by command logging;
            const author = message.author.tag,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'atlas',
                rconCommand = 'listplayers',
                server = message.guild ?
                    message.guild.name :
                    null;

            presage.parallel(atlasServer.ports.reduce((portsMap, port) => {
                if (!portsMap[port]) {
                    portsMap[port] = () => new Promise(resolve => {
                        const client = new SRC(atlasServer.host, port, atlasServer.password),

                            playerList = [];

                        client.connect().then(() => client.send(rconCommand))
                            .then(response => Promise.resolve(response.split('\n').map(line => line.trim()).filter(line => line.length && (line !== 'No Players Connected'))))
                            .then(players => Promise.resolve(players.map(player => player.split(',')[0].split('.').slice(1).join('.').trim())))
                            .then(players => {
                                playerList.push(...players);

                                return client.disconnect();
                            }).then(() => {
                                resolve(playerList);
                            }).catch(error => {
                                jinx._commandLog.command('atlasListPlayersError', {
                                    author,
                                    channel,
                                    command,
                                    error,
                                    message: message.content,
                                    server
                                });
                                resolve([]);
                            });
                    });
                }

                return portsMap;
            }, {})).then(results => {
                const embed = new Discord.RichEmbed(),
                    fullPlayerList = Object.keys(results).reduce((fullPlayerList, port) => {
                        const playerList = results[port];

                        fullPlayerList.push(...playerList);

                        return fullPlayerList;
                    }, []);

                embed.setTitle('Current Player List')
                    .setAuthor('Hammer Gaming Atlas Server')
                    .setColor(0x9AF0FF)
                    .setThumbnail('http://cdn.sibilly.com/hammergaming/atlas-logo.png')
                    .setFooter('Powered by source-rcon-client');

                if (fullPlayerList.length) {
                    embed.addField('# of Players Online', fullPlayerList.length);
                    embed.setDescription(fullPlayerList.sort().join('\n'));
                } else {
                    embed.setDescription('There are no players online');
                }

                message.channel.send({
                    embed
                }).then(newMessage => {
                    jinx._commandLog.command('reply', {
                        author,
                        channel,
                        command,
                        details: {
                            fullPlayerList
                        },
                        message: message.content,
                        server
                    });
                    resolve(newMessage);
                }).catch(error => {
                    reject(_Error({
                        error,
                        message: 'atlasListPlayers message send error'
                    }));
                });
            }).catch(error => {
                reject(_Error({
                    error,
                    message: 'atlasListPlayers RCON error'
                }));
            });
        })
    };

export default atlasListPlayers;
