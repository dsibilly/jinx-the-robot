export default {
    description: 'lavishes praise upon me; I *may* respond in kind...',
    process: (jinx, message) => new Promise((resolve, reject) => {
        message.channel.send(`Thanks, <@${message.author.id}>! I have observed you to be an adequate human!`).then(() => {
            jinx._commandLog.command('reply', {
                author: message.author.tag,
                channel: message.channel ?
                    message.channel.name :
                    null,
                command: 'goodBot',
                message: message.content,
                server: message.guild ?
                    message.guild.name :
                    null
            });
            resolve();
        }).catch(reject);
    })
};
