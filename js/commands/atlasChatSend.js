/**
@module commands/atlasChatSend
*/
import config from '../../Configuration';
import SRC from 'source-rcon-client';

const atlasServer = config.atlas,
    atlasChatSend = {
        /**
        @property {String} description
        */
        description: 'Allows Discord users to send messages to the HG Atlas grid servers',

        /**
        @method process
        @arg {Jinx} jinx
        @arg {Discord.Message} message
        @arg {String} payload
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message, payload) => new Promise((resolve, reject) => {
            // Collect message metadata for reuse by command logging
            const author = message.author.tag,
                authorId = message.author.id,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'atlasChatSend',
                server = message.guild ?
                    message.guild.name :
                    null;

            atlasServer.ports.forEach(currentPort => {
                // Create a new client for this host/port combination
                const client = new SRC(atlasServer.host, currentPort, atlasServer.password),
                    rconCommand = `serverchat ${message.author.tag}: ${message.content.slice(4)}} \n`;

                client.connect()
                    .then(() => client.send(rconCommand))
                    .then(response => {
                        if (response !== 'Server received, But no response!! \n ') {
                            jinx._commandLog.command('atlasChatSendError', {
                                author,
                                channel,
                                command,
                                details: {
                                    payload
                                },
                                message: message.content,
                                server
                            });
                            return;
                        }

                        // Send was successful
                        jinx._commandLog.command('atlasChatSendRelay', {
                            author,
                            channel,
                            command,
                            details: {
                                payload
                            },
                            message: message.content,
                            server
                        });
                    }).catch(reject);
            });

            // Regardless of what happens, fulfill the Promise so Jinx keeps going.
            resolve();
        })
    };

export default atlasChatSend;
