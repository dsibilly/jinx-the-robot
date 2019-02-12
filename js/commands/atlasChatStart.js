/**
@module commands/atlasChatStart
*/
import config from '../../Configuration';
import presage from 'presage';
import SRC from 'source-rcon-client';

const rconCommand = 'getchat', // The command to run
    atlasServer = config.atlas, // The ATLAS specific config data
    atlasChatStart = { // Command logic
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
                        return; // If the poll is actively running, don't do anything
                    }

                    jinx._atlasGetChatIsRunning = true; // Tell the both that the poll is active

                    presage.parallel(atlasServer.ports.reduce((portsMap, port) => {
                        /*
                        We want to transform the array of port numbers:
                            [ 12345, 12346, 12347, ... ]
                        ...into an object where the properties are the port numbers
                        and the values are Promise-returning functions for
                        presage.parallel to execute:
                            { '12345': () => new Promise(), ... }
                        This allows presage to map the results from each poll attempt
                        to each port number, giving us a nice and tidy results report
                        for logging.
                        */
                        if (!portsMap[port]) { // If a port already exists, ignore. This helps avoid dupes
                            // Create a new connect-command-disconnect function that returns a Promise
                            portsMap[port] = () => new Promise(resolve => {
                                // Create the client
                                const client = new SRC(atlasServer.host, port, atlasServer.password);

                                // Connect to the host:port and send the command
                                client.connect().then(() => client.send(rconCommand)).then(response => {
                                    // Ignore the default "received but no response" message
                                    if (response !== 'Server received, But no response!! \n ') {
                                        // Split the response by newlines, then filter out empty lines or server-deliverd chat messages
                                        response.split('\n').filter(chatLine => chatLine.trim().length && !chatLine.startsWith('SERVER:')).forEach(chatLine => {
                                            // Send each valid chat line encountered to Discord
                                            newMessage.channel.send(chatLine).then(() => {
                                                // Log that the chat line has been sent.
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
                                                // Log any error in sending the message to Discord
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

                                    // Disconnect from the host:port
                                    return client.disconnect();
                                }).then(() => {
                                    // Disconnect was successful
                                    resolve('success');
                                }).catch(error => {
                                    // Log any connection errors
                                    jinx._commandLog.command('atlasPollError', {
                                        author,
                                        channel,
                                        command,
                                        error,
                                        server
                                    });
                                    // Polling this host:port failed
                                    resolve('failure');
                                });
                            });
                        }

                        return portsMap;
                    }, {})).then(results => {
                        // When the poll completely finishes, log the results
                        jinx._commandLog.command('atlasPollFinish', {
                            author,
                            channel,
                            command,
                            results,
                            server
                        });
                        // The poll is done, so let's clear the lock
                        jinx._atlasGetChatIsRunning = false;
                    }).catch(error => {
                        // If the poll threw any errors, log them
                        jinx._commandLog.command('atlasPollError', {
                            author,
                            channel,
                            command,
                            error,
                            server
                        });
                        // The poll is done, so let's clear the lock
                        jinx._atlasGetChatIsRunning = false;
                    });
                }, atlasServer.poll);

                // Regardless of what happens, fulfill the Promise so Jinx keeps going.
                resolve(newMessage);
            }).catch(reject);
        })
    };

export default atlasChatStart;
