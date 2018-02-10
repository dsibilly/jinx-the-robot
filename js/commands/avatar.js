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
    description: 'displays the URL of your full-size Discord avatar',

    /**
    @method process
    @arg {Jinx} jinx A Jinx instance
    @arg {Discord.Message} message A Discord message Object
    @returns {Promise<Discord.Message>}
    */
    process: (jinx, message) => {
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
        return message.channel.send(message.author.avatarURL);
    }
};

export default Avatar;
