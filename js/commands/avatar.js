/**
The Avatar command.
Displays the URL for the full-size Discord avatar of the user who
invokes it.

@module commands/avatar
*/
const Avatar = {
    /**
    @property {String} description
    */
    description: 'displays the URL of your full-size Discord avatar.',

    /**
    @method process
    @arg {Jinx} jinx A Jinx instance
    @arg {Discord.Message} message A Discord message Object
    @returns {Promise<Discord.Message>}
    */
    process: (jinx, message) => new Promise((resolve, reject) => {
        jinx._commandLog.command('reply', {
            author: message.author.tag,
            channel: message.channel ?
                message.channel.name :
                null,
            command: 'avatar',
            message: message.content,
            reply: message.author.avatarURL,
            server: message.guild ?
                message.guild.name :
                null
        });

        message.channel.send(message.author.avatarURL).then(newMessage => {
            jinx._commandLog.command('reply', {
                author: message.author.tag,
                channel: message.channel ?
                    message.channel.name :
                    null,
                command: 'avatar',
                details: {
                    avatarURL: message.author.avatarURL
                },
                message: newMessage.content,
                server: message.guild ?
                    message.guild.name :
                    null
            });
            resolve(newMessage);
        }).catch(reject);
    })
};

export default Avatar;
