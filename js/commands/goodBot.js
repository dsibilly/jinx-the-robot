/**
The goodBot command.
Praises Jinx for a job well done.

@module commands/goodBot
*/
export default {
    /**
    @property {String} description
    */
    description: 'lavishes praise upon me; I *may* respond in kind...',

    /**
    @method process
    @arg {Jinx} jinx
    @arg {Discord.Message} message
    @returns {Promise<Discord.Message>}
    */
    process: (jinx, message) => new Promise((resolve, reject) => {
        message.channel.send(`Thanks, <@${message.author.id}>! I have observed you to be an adequate human!`).then(newMessage => {
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
            resolve(newMessage);
        }).catch(reject);
    })
};
