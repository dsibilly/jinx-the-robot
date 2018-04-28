/**
The dadJoke command.
Retrieves a random joke from icanhazdadjoke.com and displays it in the
channel where the command was invoked.

@module commands/dadJoke
*/
import _Error from 'isotropic-error';
import Discord from 'discord.js';
import icanhazdadjokes from '../api/icanhazdadjokes';
import promisifyClient from '../util/promisifyClient';

/**
Wrap the `joke` method of the icanhazdadjoke API in a Promise

@function getRandomJoke
@private
@arg {Client} client A node-restclient instance
@returns {Promise<Object>}
*/
const getRandomJoke = client => promisifyClient(client, 'joke'),
    /**
    Pass `getRandomJoke` an instantiated node-rest-client configured for
    use with icanhazdadjoke.com.

    @function getJoke
    @private
    @returns {Promise<Object>}
    */
    getJoke = () => getRandomJoke(icanhazdadjokes);

export default {
    /**
    @property {String} description
    */
    description: 'displays a random dad joke. Powered by icanhazdadjoke.com.',

    /**
    The core logic of the `joke` command.

    @method process
    @arg {Jinx} jinx
    @arg {Discord.Message} message
    @returns {Promise<Discord.Message>}
    */
    process: (jinx, message) => new Promise((resolve, reject) => {
        const author = message.author.tag,
            channel = message.channel ?
                message.channel.name :
                null,
            command = 'dadJoke',
            server = message.guild ?
                message.guild.name :
                null,

            /**
            Log an error to the command log.

            @function logError
            @protected
            @arg {Error|isotropic-error} error
            */
            logError = error => {
                jinx._commandLog.command('error', {
                    author,
                    channel,
                    command,
                    error,
                    server
                });
            },
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

        // Perform the remote API call and handle the result or error...
        getJoke().then(result => {
            if (!result.joke) { // The joke is missing!
                jinx._log.warn('No joke found in random joke response');
                message.channel.send('I\'m not feeling very funny right now. Sorry!').then(newMessage => {
                    logError(_Error({
                        details: {
                            result
                        },
                        message: newMessage.content
                    }));
                    resolve(newMessage);
                }).catch(error => {
                    reject(_Error({
                        error,
                        message: 'get-data-jokes message send error'
                    }));
                });
                return;
            }

            // Build a Discord RichEmbed response.
            const embed = new Discord.RichEmbed()
                .setDescription(result.joke)
                .setFooter('Jokes provided by icanhazdadjoke.com');

            message.channel.send({
                embed
            }).then(newMessage => {
                logReply({
                    joke: result.joke
                });
                resolve(newMessage);
            }).catch(error => {
                reject(_Error({
                    error,
                    message: 'get-data-jokes message send error'
                }));
            });
        });
    })
};
