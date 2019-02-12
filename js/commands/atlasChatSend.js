/**
@module commands/atlasChatSend
*/
import config from '../../Configuration';
import presage from 'presage';
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
                // authorId = message.author.id, // This isn't being used. What is it for?
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'atlasChatSend',
                rconCommand = `serverchat ${author}: ${payload}`,
                server = message.guild ?
                    message.guild.name :
                    null;

            presage.parallel(atlasServer.ports.reduce((portsMap, port) => {
                if (!portsMap[port]) {
                    portsMap[port] = () => new Promise(resolve => {
                        const client = new SRC(atlasServer.host, port, atlasServer.password);

                        client.connect().then(() => client.send(rconCommand)).then(response => {
                            if (response === 'Server received, But no response!! \n ') {
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
                            } else {
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
                            }

                            /*
                            We always have to disconnect when we're done
                            with a connection, success or failure.
                            */
                            return client.disconnect();
                        }).then(() => {
                            resolve('success');
                        }).catch(error => {
                            jinx._commandLog.command('atlasChatSendError', {
                                author,
                                channel,
                                command,
                                details: {
                                    payload
                                },
                                error,
                                message: message.content,
                                server
                            });

                            resolve('failure');
                        });
                    });
                }

                return portsMap;
            }, {})).then(results => {
                jinx._commandLog.command('atlasChatSendFinish', {
                    author,
                    channel,
                    command,
                    details: {
                        payload
                    },
                    results,
                    server
                });
                resolve();
            }).catch(error => {
                jinx._commandLog.command('atlasPollError', {
                    author,
                    channel,
                    command,
                    details: {
                        payload
                    },
                    error,
                    server
                });
                reject(error);
            });
        })
    };

export default atlasChatSend;
