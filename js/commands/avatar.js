const Avatar = {
    description: 'displays the URL of your full-size Discord avatar',
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
