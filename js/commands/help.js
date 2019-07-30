/**
The help command.

@module commands/help
*/
import Jinx from '../jinx';

const help = {
    description: 'Display this help message, or details on a specific command.',

    process: (jinx, message, payload) => new Promise((resolve, reject) => {
        const author = message.author.tag,
            channel = message.channel ?
                message.channel.name :
                null,
            command = 'help',
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
            };

        if (payload) {
            message.channel.send(payload.split(' ').filter(command => Jinx.commands[command]).reduce((helpReply, helpCommand) => {
                const selectedCommand = Jinx.commands[helpCommand],
                    description = selectedCommand.description instanceof Function ?
                        selectedCommand.description() :
                        selectedCommand.description,
                    usage = selectedCommand.usage;

                helpReply += `**${jinx._commandPrefix}${helpCommand}**`;

                if (usage) {
                    helpReply += ` ${usage}`;
                }

                if (description) {
                    helpReply += `\n\t ${description}`;
                }

                helpReply += '\n';
                return helpReply;
            }, '**Requested Command:**\n\n')).then(newMessage => {
                logReply({
                    message: 'Help reply sent',
                    payload
                });
                resolve(newMessage);
            }).catch(reject);
            return;
        }

        message.author.send(Object.keys(Jinx.commands).sort().reduce((helpReply, helpCommand) => {
            const selectedCommand = Jinx.commands[helpCommand],
                description = selectedCommand.description instanceof Function ?
                    selectedCommand.description() :
                    selectedCommand.description,
                usage = selectedCommand.usage;

            helpReply += `**${jinx._commandPrefix}${helpCommand}**`;

            if (usage) {
                helpReply += ` ${usage}`;
            }

            if (description) {
                helpReply += `\n\t ${description}`;
            }

            helpReply += '\n';
            return helpReply;
        }, '**Available Commands:**\n\n')).then(newMessage => {
            logReply({
                message: 'Help reply sent',
                payload
            });
            resolve(newMessage);
        }).catch(reject);
    })
};

export default help;
