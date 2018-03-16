/**
The ping command.
A 'is it alive' command for Jinx. Responds 'pong' to the user that
invoked this command in the channel where it was invoked.

@module commands/ping
*/
const Ping = {
    /**
    @property {String} description
    */
    description: 'responds pong, useful for checking if bot is alive',

    /**
    @method process
    @arg {Jinx} jinx
    @arg {Discord.Message} message
    @returns {Promise<Discord.Message>}
    */
    process: (jinx, message) => {
        jinx._commandLog.command('reply', {
            author: message.author.tag,
            channel: message.channel ?
                message.channel.name :
                null,
            command: 'ping',
            message: message.content,
            server: message.guild ?
                message.guild.name :
                null
        });

        return message.channel.send(`<@${message.author.id}> pong!`);
    }
};

export default Ping;
