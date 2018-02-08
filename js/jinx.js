import _CommandLogger from './util/CommandLog';
import _Error from 'isotropic-error';
import avatar from './commands/avatar';
import Bunyan from 'bunyan';
import dadJoke from './commands/dadJoke';
import Discord from 'discord.js';
import goodBot from './commands/goodBot';
import make from 'isotropic-make';
import nextLaunch from './commands/nextLaunch';
import os from 'os';
import packageInfo from '../package.json';
import ping from './commands/ping';
import roll from './commands/roll';
import uuid from 'uuid/v4';
import wiki from './commands/wikipedia';

const Jinx = make({
    destroy () {
        const me = this;

        if (me._initializing) {
            me._destroy = true;
            return;
        }

        me._client.destroy().then(() => {
            delete me._client;
        });

        delete me._commandLog;
        delete me._commandPrefix;
        delete me._destroy;
        delete me._hostname;
        delete me._log;
        delete me._pid;
        delete me._sessionId;
        delete me._token;
        delete me._version;
    },

    dispatch (message) {
        const author = message.author,
            channel = message.channel ?
                message.channel.name :
                null,
            jinxUser = this._client.user,
            me = this,
            messageContent = message.content,
            server = message.guild ?
                message.guild.name :
                null;

        let alias = null,
            command = null,
            commandText = null,
            payload = null;

        if (message.author.id !== jinxUser.id && message.content.startsWith(me._commandPrefix)) {
            me._log.info({
                author: author.tag,
                messageContent
            }, 'Processing command');

            commandText = messageContent.split(' ')[0].substring(me._commandPrefix.length);
            payload = messageContent.substring(commandText.length + me._commandPrefix.length + 1);

            if (message.isMentioned(jinxUser)) {
                try {
                    commandText = messageContent.split(' ')[1];
                    payload = messageContent.substring(jinxUser.mention().length + commandText.length + me._commandPrefix.length + 1);
                } catch (error) {
                    message.channel.send(`How can I help you, <@${author.id}>?`);
                    return;
                }
            }

            alias = Jinx.aliases[commandText];

            if (alias) {
                commandText = alias;
            }

            command = Jinx.commands[commandText];

            if (commandText === 'help') {
                if (payload) {
                    message.channel.send(payload.split(' ').filter(cmd => Jinx.commands[cmd]).reduce((info, helpCommand) => {
                        const selectedCommand = Jinx.commands[helpCommand],
                            description = selectedCommand.description instanceof Function ?
                                selectedCommand.description() :
                                selectedCommand.description,
                            usage = selectedCommand.usage;

                        info += `**${this._commandPrefix}${helpCommand}**`;

                        if (usage) {
                            info += ` ${usage}`;
                        }

                        if (description) {
                            info += `\n\t ${description}`;
                        }

                        info += '\n';
                        return info;
                    }, ''));
                } else {
                    message.author.send(Object.keys(Jinx.commands).sort().reduce((info, helpCommand) => {
                        const selectedCommand = Jinx.commands[helpCommand],
                            description = selectedCommand.description instanceof Function ?
                                selectedCommand.description() :
                                selectedCommand.description,
                            usage = selectedCommand.usage;

                        info += `**${this._commandPrefix}${helpCommand}**`;

                        if (usage) {
                            info += ` ${usage}`;
                        }

                        if (description) {
                            info += `\n\t ${description}`;
                        }

                        info += '\n';
                        return info;
                    }, '**Available Commands:**\n\n'));
                }
            } else if (command) {
                me._commandLog.command(commandText, {
                    author: author.tag,
                    channel,
                    message: message.content,
                    payload,
                    server
                });

                command.process(me, message, payload).catch(error => {
                    message.channel.send(`**Jinx Command Error**: ${commandText} failed!\nStack:\n${error.stack}`).then(() => {
                        me._commandLog.command('error', {
                            author: author.tag,
                            channel,
                            error: _Error({
                                error,
                                message: 'Jinx command error'
                            }),
                            message: message.content,
                            payload,
                            server
                        });
                        me._log.error(error, 'Jinx command error');
                    }).catch(error => {
                        me._commandLog.command('error', {
                            author: author.tag,
                            channel,
                            error: _Error({
                                error,
                                message: 'Command error message send error'
                            }),
                            message: message.content,
                            payload,
                            server
                        });
                    });
                });
            }
        }

        return me;
    },

    welcome (member) {
        this._commandLog('welcome', {
            member: member.user.tag
        });
        member.guild.defaultChannel.send(`**<@${member.user.id}> has joined the server...**`);

        return this;
    },

    _init (config) {
        const me = this;

        me._initializing = true;

        me._commandPrefix = config.commandPrefix;
        me._hostname = os.hostname;
        me._pid = process.pid;
        me._sessionId = uuid();
        me._token = config.discord.token;
        me._version = packageInfo.version;
        me._client = new Discord.Client();
        me._log = Bunyan.createLogger({
            name: 'jinx'
        });

        me._log.info('Starting Jinx Discord Bot...');

        me._client.on('ready', () => {
            me._commandLog = _CommandLogger({
                beginTime: new Date(),
                hostname: me._hostname,
                name: 'Jinx',
                pid: me._pid,
                rethinkDbConfiguration: config.rethinkdb
            });

            me._initializing = false;

            me._log.info({
                version: `v${me._version}`
            }, 'Jinx Discord bot online!');

            if (me._destroy) {
                me.destroy();
            }
        });

        me._client.on('message', message => {
            me.dispatch(message);
        });

        me._client.on('guildMemberAdd', member => {
            me.welcome(member);
        });

        me._client.login(me._token).catch(error => {
            me._log.error(_Error({
                error,
                message: 'Discord API login error'
            }), 'Discord API login error');
        });

        return me;
    }

}, {
    aliases: {
        dadjoke: 'dadJoke',
        goodbot: 'goodBot',
        jk: 'dadJoke',
        joke: 'dadJoke',
        nl: 'nextLaunch'
    },
    commands: {
        avatar,
        dadJoke,
        goodBot,
        nextLaunch,
        ping,
        roll,
        wiki
    }
});

export default Jinx;
