/**
@module commands/atlasChatStart
*/
import config from '../../Configuration';
import presage from 'presage';

const SRC = require('source-rcon-client').default, // SRC
    rconCommand = 'getchat', // The command to run
    atlasServer = config.atlas,
    atlasChatStart = {
        /**
        @property {String} description
        */
        description: 'starts listening to the HG ATLAS server for chat relay to Discord',

        /**
        @method process
        @arg {Jinx} jinx
        @arg {Discord.Message} message
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message) => new Promise((resolve, reject) => {
            // Check to see if the user is authorized
            if (atlasServer.admins[Number(message.author.id)]) {
                message.channel.send(`Sorry, <@${message.author.id}>. Access Denied`);
                resolve();
                return;
            }
            // Collect message metadata for reuse by command logging;

            const author = message.author.tag,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'atlas',
                server = message.guild ?
                    message.guild.name :
                    null;

            if (jinx._atlasGetChat) {
                // If the chat poll is already running, do nothing.
                resolve();
                return;
            }

            // Otherwise start polling...
            message.channel.send(`OK, <@${message.author.id}>. Connecting to the ATLAS servers...`).then(newMessage => {
                // Log that polling has started
                jinx._commandLog.command('atlasPollStart', {
                    author,
                    channel,
                    command,
                    message: message.content,
                    server
                });

                // Keep doing this while the _atlasGetChat flag is set
                jinx._atlasGetChat = setInterval(() => {
                    if (jinx._atlasGetChatIsRunning) {
                        return;
                    }

                    jinx._atlasGetChatIsRunning = true; // flag that we're polling

                    presage.parallel(atlasServer.ports.reduce((portsMap, port) => {
                        if (!portsMap[port]) {
                            portsMap[port] = () => new Promise((resolve, reject) => {
                                const client = new SRC(atlasServer.host, port, atlasServer.password);

                                client.connect().then(() => client.send(rconCommand)).then(response => {
                                    if (response !== 'Server received, But no response!! \n ') {
                                        response.split('\n').filter(chatLine => chatLine.trim().length && !chatLine.startsWith('SERVER:')).forEach(chatLine => {
                                            newMessage.channel.send(chatLine).then(() => {
                                                jinx._commandLog.command('atlasPollChatLine', {
                                                    author,
                                                    channel,
                                                    command,
                                                    details: {
                                                        chatLine
                                                    },
                                                    server
                                                });
                                            }).catch(error => {
                                                jinx._commandLog.command('messageSendError', {
                                                    author,
                                                    channel,
                                                    command,
                                                    details: {
                                                        chatLine
                                                    },
                                                    error,
                                                    server
                                                });
                                            });
                                        });
                                    }

                                    return client.disconnect();
                                }).then(() => {
                                    resolve('success');
                                }).catch(error => {
                                    jinx._commandLog.command('atlasPollError', {
                                        author,
                                        channel,
                                        command,
                                        error,
                                        server
                                    });
                                    resolve('failure');
                                });
                            });
                        }

                        return portsMap;
                    }, {})).then(results => {
                        jinx._commandLog.command('atlasPollFinish', {
                            author,
                            channel,
                            command,
                            results,
                            server
                        });
                        jinx._atlasGetChatIsRunning = false;
                    }).catch(error => {
                        jinx._commandLog.command('atlasPollError', {
                            author,
                            channel,
                            command,
                            error,
                            server
                        });
                        jinx._atlasGetChatIsRunning = false;
                    });
                }, atlasServer.poll);

                // Regardless of what happens, fulfill the Promise so Jinx keeps going.
                resolve(newMessage);
            }).catch(reject);
        })
    };

export default atlasChatStart;
