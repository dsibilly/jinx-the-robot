/**
@module commands/atlasListPlayers
*/
import config from '../../Configuration';

const SRC = require('source-rcon-client').default, // SRC
    rconCommand = 'listplayers', // The command to run
    atlasServer = config.atlas,
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
            const players = [];

            atlasServer.ports.forEach(currentPort => {
                // Create a new client for this host/port combination
                const client = new SRC(atlasServer.host, currentPort, atlasServer.password);

                // Connect to the host/port, run the desired command
                let rconCommand = `serverchat ${message.author.tag} :${message.content.slice(15)} \n`;

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

export default atlasListPlayers;
