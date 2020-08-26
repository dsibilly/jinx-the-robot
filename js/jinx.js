/**
The core Jinx bot logic.

This app uses the isotropic utilities library, specifically
isotropic-make and isotropic-error.

isotropic-make is a replacement for
ES6 classes that provides a factory for creating object factories. This
permits me to rigorously define both instance methods and static
class properties in an easy-to-read and maintainable way.

isotropic-error is a wrapper around the native JavaScript Error that
allows for sanely nesting errors and getting readable stack traces that
lead all the way down to where the innermost Error occurred. To the rest
of the JavaScript runtime it looks, smells and tastes like an Error, but
it has some added sugar that makes debugging and audit logging less
frustrating.

@module jinx
*/

/**
 * Represents a member of a guild on Discord.
 * @typedef {Object} GuildMember
 * @property {Guild} guild The guild/server that this member is a part of
 * @property {User} user The user that this GuildMember instance represents
 */

/**
 * Represents a message on Discord.
 * @typedef {Object} Message
 * @property {User} author The author of the message
 * @property {TextChannel|DMChannel|GroupDMChannel} channel The channel that the message was sent in
 */

import _CommandLogger from './util/CommandLog';
import _Error from 'isotropic-error';
import Bunyan from 'bunyan';
import commandsAndAliases from './commands';
import Discord from 'discord.js';
import make from 'isotropic-make';
import os from 'os';
import packageInfo from '../package.json';
import uuid from 'uuid/v4';

/**
@class Jinx
@constructor
@param {Object} config The configuration object
@param {Object} [config.api = {}] Config settings for HTTP User Agent
@param {String} config.commandPrefix The command prefix for Jinx commands
@param {Object} [config.discord = {}] Discord API config settings
@param {Object} [config.radio = {}] Icecast2 API config settings
@param {Object} [config.rethinkdb = {}] RethinkDB config settings
*/
const Jinx = make({
    /**
    Announce a new user to the guild/server

    @method announce
    @chainable
    @arg {GuildMember} member A Discord Member object representing a new server/guild member
    @returns {Jinx} This Jinx instance
    */
    announce (member) {
        /* TODO: Refactor this to update the command log only if the welcome message is successful
           TODO: Handle message send errors
           Record this welcome to the command log... */
        this._commandLog.command('welcome', {
            member: member.user.tag
        });
        // ...and greet the new member
        member.guild.defaultChannel.send(`**<@${member.user.id}> has joined the server...**`);

        return this;
    },

    /**
    Destroy this Jinx instance

    @method destroy
    @chainable
    @returns {Jinx} This instance
    @protected
    */
    destroy () {
        const me = this;

        // Defer destruction until initialization is complete...
        if (me._initializing) {
            /**
            @property {Boolean} _destroy
            @protected
            */
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

        return me;
    },

    /**
    Detect commands and dispatch them to the appropriate handler logic.

    @method dispatch
    @chainable
    @arg {Message} message A Discord message
    @returns {Jinx} This Jinx instance
    */
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

        /* Only respond to messages from users other than Jinx itself,
           and only if the command prefix is used. */
        if (message.author.id !== jinxUser.id && message.content.startsWith(me._commandPrefix)) {
            commandText = messageContent.split(' ')[0].substring(me._commandPrefix.length);
            payload = messageContent.substring(commandText.length + me._commandPrefix.length + 1);

            // TODO: Refactor this logic so Jinx actually detects when it's being tagged
            if (message.mentions.has('123456789012345678')) {
                try {
                    commandText = messageContent.split(' ')[1];
                    payload = messageContent.substring(jinxUser.mention().length + commandText.length + me._commandPrefix.length + 1);
                } catch (error) {
                    message.channel.send(`How can I help you, <@${author.id}>?`);
                    return;
                }
            }

            // If the command detected is an alias, dealias it.
            alias = Jinx.aliases[commandText];

            if (alias) {
                commandText = alias;
            }

            // Load command definition from static command list
            command = Jinx.commands[commandText];

            if (command) {
                // Save the command to the command log.
                me._commandLog.command(commandText, {
                    author: author.tag,
                    channel,
                    message: message.content,
                    payload,
                    server
                });

                // Process the command's unique logic.
                command.process(me, message, payload).catch(error => {
                    // Print any error to the channel...
                    message.channel.send(`**Jinx Command Error**: ${commandText} failed!\nStack:\n${error.stack}`).then(() => {
                        // If the send is successful, log this error to the command log...
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
                        // ...and log it to the console.
                        me._log.error(error, 'Jinx command error');
                    }).catch(error => {
                        // If we can't send the error message to the channel we have bigger problems and should log them.
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

    /**
    Constructor method.

    @method _init
    @chainable
    @arg {Object} config A configuration Object
    @protected
    @returns {Jinx} A new Jinx instance
    */
    _init (config) {
        const me = this;

        me._initializing = true; // Set a flag while we're setting up.

        // Store useful data and functions as protected properties
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
            // Create the command logger
            me._commandLog = _CommandLogger({
                beginTime: new Date(),
                hostname: me._hostname,
                name: 'Jinx',
                pid: me._pid,
                rethinkDbConfiguration: config.rethinkdb
            });

            // If we reach this event callback, we're done setting up.
            me._initializing = false;

            // Tell the console we're ready
            me._log.info({
                version: `v${me._version}`
            }, 'Jinx Discord bot online!');

            // If destroy() got called while we were setting up, perform the deferred destruction now.
            if (me._destroy) {
                me.destroy();
            }
        });

        // Every message Jinx hears gets handled by the dispatch() method
        me._client.on('message', message => {
            me.dispatch(message);
        });

        // Every new server/guild member gets a welcome message.
        me._client.on('guildMemberAdd', member => {
            me.announce(member);
        });

        // Attempt to login to the Discord API with our token
        me._client.login(me._token).catch(error => {
            me._log.error(_Error({
                error,
                message: 'Discord API login error'
            }), 'Discord API login error');
        });

        return me;
    }

},
/**
Jinx static properties and methods.
@static

@property {Object} aliases Jinx command aliases
@property {Object} commands The formal definitions of Jinx commands
*/
commandsAndAliases);

export default Jinx;
