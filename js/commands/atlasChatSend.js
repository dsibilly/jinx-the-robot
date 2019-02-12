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
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message) => new Promise((resolve, reject) => {
            /* Collect message metadata for reuse by command logging
               DUANE: THE BELOW IS ONLY USEFUL IF YOU'RE GOING TO MAKE COMMAND LOG ENTRIES */
            const author = message.author.tag,
                ID = message.author.id,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'atlasChatSend',
                server = message.guild ?
                    message.guild.name :
                    null;

            atlasServer.ports.forEach(currentPort => {
                // Create a new client for this host/port combination
                const client = new SRC(atlasServer.host, currentPort, atlasServer.password);

                // Connect to the host/port, run the desired command
                let rconCommand = `serverchat ${message.author.tag} :${message.content.slice(4)} \n`;

                client.connect()
                    .then(() => client.send(rconCommand))
                    .then(response => {
                        // Ignore "no response" responses; otherwise process...
                        if (response !== 'Server received, But no response!! \n ') {
                            console.log('message not sent');
                        }
                    }).catch(reject);
            });

            // Regardless of what happens, fulfill the Promise so Jinx keeps going.
            resolve();
        })
    };

export default atlasChatSend;
