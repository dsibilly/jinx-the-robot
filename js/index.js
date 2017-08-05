import Bunyan from 'bunyan';
import config from '../Configuration';
import Discord from 'discord.js';
import getLaunches from './get-launches';
import packageInfo from '../package.json';
import wikipedia from './wikipedia';

const _log = Bunyan.createLogger({
        name: 'jinx'
    }),
    _name = packageInfo.name,
    _version = packageInfo.version,
    aliases = {
        nl: 'nextLaunch'
    },
    bot = new Discord.Client(),
    commands = {
        avatar: {
            description: 'displays the URL of your full-size Discord avatar',
            process: (bot, message) => {
                _log.info({
                    user: message.author.tag
                }, 'Retrieving user avatar');
                return message.channel.send(message.author.avatarURL);
            }
        },
        nextLaunch: {
            description: 'lists the next upcoming rocket launches',
            process: (bot, message) => {
                _log.info('Retriving next rocket launch information');
                return getLaunches(bot, message);
            }
        },
        ping: {
            description: 'responds pong, useful for checking if bot is alive',
            process: (bot, message, suffix) => {
                _log.info({
                    user: message.author.tag
                }, 'Sending ping response');
                return message.channel.send(`<@${message.author.id}> pong!`).then(() => new Promise((resolve, reject) => {
                    if (suffix) {
                        message.channel.send(`${config.commandPrefix}ping takes no arguments...`).then(resolve).catch(reject);
                        return;
                    }

                    resolve();
                }));
            }
        },
        wiki: {
            description: 'looks up the query string on Wikipedia',
            process: (bot, message, suffix) => {
                _log.info({
                    query: suffix
                }, 'Starting Wikipedia search');
                return wikipedia(bot, message, suffix);
            }
        }
    },
    token = config.discord.token;

bot.log = _log;

bot.on('ready', () => {
    _log.info({
        version: `v${_version}`
    }, `${_name} Discord bot online!`);
});

bot.on('guildMemberAdd', member => {
    member.guild.defaultChannel.send(`Welcome to the server, ${member}!`);
});

bot.on('message', message => {
    if (message.author.id !== bot.user.id && message.content.startsWith(config.commandPrefix)) {
        _log.info({
            author: message.author.tag,
            content: message.content
        }, 'Processing command');

        let command,
            commandText = message.content.split(' ')[0].substring(config.commandPrefix.length),
            suffix = message.content.substring(commandText.length + config.commandPrefix.length + 1);

        if (message.isMentioned(bot.user)) {
            try {
                commandText = message.content.split(' ')[1];
                suffix = message.content.substring(bot.user.mention().length + commandText.length + config.commandPrefix.length + 1);
            } catch (exception) {
                message.channel.send(`How can I help you, ${message.author.tag}?`);
                return;
            }
        }

        const alias = aliases[commandText];

        if (alias) {
            _log.info({
                alias: commandText,
                command: alias,
                query: suffix
            }, 'Dealiasing command');
            commandText = alias;
        }

        command = commands[commandText];

        if (commandText === 'help') {
            if (suffix) {
                message.channel.send(suffix.split(' ').filter(cmd => commands[cmd]).reduce((info, helpCommand) => {
                    let description = commands[helpCommand].description;
                    const usage = commands[helpCommand].usage;

                    info += `**${config.commandPrefix}${helpCommand}**`;

                    if (usage) {
                        info += ` ${usage}`;
                    }

                    if (description instanceof Function) {
                        description = description();
                    }

                    if (description) {
                        info += `\n\t ${description}`;
                    }

                    info += '\n';
                    return info;
                }, ''));
            } else {
                message.author.send(Object.keys(commands).sort().reduce((info, helpCommand) => {
                    let description = commands[helpCommand].description;
                    const usage = commands[helpCommand].usage;

                    info += `**${config.commandPrefix}${helpCommand}**`;

                    if (usage) {
                        info += ` ${usage}`;
                    }

                    if (description instanceof Function) {
                        description = description();
                    }

                    if (description) {
                        info += `\n\t ${description}`;
                    }

                    info += '\n';
                    return info;
                }, '**Available Commands:**\n\n'));
            }
        } else if (command) {
            command.process(bot, message, suffix).then(() => {
                _log.info({
                    author: message.author.tag,
                    command: commandText
                }, 'Command processed');
            }).catch(error => {
                message.channel.send(`**Jinx Command Error**: ${commandText} failed!\nStack:\n${error.stack}`);
                _log.error(error, `${_name} Command Error`);
            });
        }
    }
});

bot.login(token);
