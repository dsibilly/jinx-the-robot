/**
@module commands/atlasChatStop
*/

const atlasChatStop = {
    /**
        @property {String} description
        */
    description: 'stops chat relay from the HG ATLAS server to Discord',

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

        if (!jinx._atlasGetChat) {
            // If the chat poll is already stopped, do nothing.
            resolve();
            return;
        }

        clearInterval(jinx._atlasGetChat);
        jinx._atlasGetChat = null;

        // Otherwise start polling...
        message.channel.send(`OK, <@${message.author.id}>. Chat relay is stopped`).then(newMessage => {
            // Log that polling has started
            jinx._commandLog.command('reply', {
                author,
                channel,
                command,
                message: message.content,
                server
            });

            // Regardless of what happens, fulfill the Promise so Jinx keeps going.
            resolve(newMessage);
        }).catch(reject);
    })
};

export default atlasChatStop;
