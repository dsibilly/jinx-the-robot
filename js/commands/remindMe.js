/**
The remindMe command.

@module commands/remindMe
*/
import parseDuration from 'parse-duration';

const remindMe = {
    description: 'Tell Jinx about a thing to remind you about after a certain amount of time.',

    process: (jinx, message, payload) => new Promise((resolve, reject) => {
        const author = message.author.tag,
            channel = message.channel ?
                message.channel.name :
                null,
            command = 'remindMe',
            server = message.guild ?
                message.guild.name :
                null,

            /**
            Log a reply to the command log.

            @function logReply
            @protected
            @arg {Object} details
            */
            logReply = details => {
                jinx._commandLog.command('reply', {
                    author,
                    channel,
                    command,
                    details,
                    message: message.content,
                    server
                });
            },

            delayString = payload.split(' ')[0],
            reminder = payload.split(' ').slice(1).join(' '),
            delayMillis = parseDuration(delayString);

        if (!reminder || reminder.length === 0) {
            message.channel.send(`...but <@${message.author.id}>, what am I supposed to remind you about?!`).then(newMessage => {
                logReply({
                    delayMillis,
                    delayString,
                    message: 'No reminder found'
                });
                resolve(newMessage);
            }).catch(reject);
            return;
        }

        if (delayMillis === 0 || delayMillis < 60000) {
            message.channel.send(`I need a valid amount of time to wait to remind you, <@${message.author.id}>; at least 60 seconds!`).then(newMessage => {
                logReply({
                    delayString,
                    message: 'Invalid time ',
                    reminder
                });
                resolve(newMessage);
            }).catch(reject);
            return;
        }

        if (delayMillis > 2147483647) {
            // Too long!
            message.channel.send(`Sorry, <@${message.author.id}>, but I can't set a reminder for that far in the future.`).then(newMessage => {
                logReply({
                    delayMillis,
                    delayString,
                    message: 'Maximum delay time exceeded',
                    reminder
                });
                resolve(newMessage);
            }).catch(reject);
            return;
        }

        message.channel.send(`OK, <@${message.author.id}>. I'll remind you when the time comes...`).then(newMessage => {
            logReply({
                delayMillis,
                delayString,
                message: 'Reminder set',
                reminder
            });
            setTimeout(() => {
                message.author.send(`This is a reminder: ${reminder}`).then(newMessage => {
                    jinx._commandLog.command('reminderSent', {
                        author,
                        details: {
                            delayMillis,
                            delayString,
                            reminder
                        },
                        message: newMessage.content,
                        server
                    });
                });
            }, delayMillis);
            resolve(newMessage);
        }).catch(reject);
    })
};

export default remindMe;
