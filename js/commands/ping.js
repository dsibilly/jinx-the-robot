const Ping = {
    description: 'responds pong, useful for checking if bot is alive',
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
