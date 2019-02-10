/**
@module commands/atlasChatStart
*/
import config from '../../Configuration';

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
            // Collect message metadata for reuse by command logging
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
                    atlasServer.ports.forEach(currentPort => {
                        // Create a new client for this host/port combination
                        const client = new SRC(atlasServer.host, currentPort, atlasServer.password);

                        // Connect to the host/port, run the desired command
                        client.connect().then(() => client.send(rconCommand)).then(response => {
                            // Ignore "no response" responses; otherwise process...
                            if (response !== 'Server received, But no response!! \n ') {
                                /*
                                For each line in the chat response, filter out any empty lines (e.g. '')
                                to avoid spamming the channel...
                                */
                                response.split('\n').filter(chatLine => chatLine.length).forEach(chatLine => {
                                    // ...then send the remaining chat lines to this channel in Discord...
                                    newMessage.channel.send(chatLine).then(() => {
                                        // ...and then log each line for posterity
                                        jinx._commandLog.command('atlasPollChatLine', {
                                            author,
                                            channel,
                                            command,
                                            details: {
                                                chatLine
                                            },
                                            server
                                        });
                                    });
                                });
                            }

                            // ...then disconnect from RCON
                            return client.disconnect();
                        }).then(() => {
                            // The disconnect was successful. Log it.
                            jinx._commandLog.command('atlasPollFinish', {
                                author,
                                channel,
                                command,
                                server
                            });
                        }).catch(error => {
                            // There has been an RCON error. Log it.
                            jinx._commandLog.command('atlasPollError', {
                                author,
                                channel,
                                command,
                                error,
                                server
                            });
                        });
                    });
                }, 5000);

                // Regardless of what happens, fulfill the Promise so Jinx keeps going.
                resolve(newMessage);
            }).catch(reject);
        })
    };

export default atlasChatStart;
