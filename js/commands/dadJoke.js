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
    async process (jinx, message) {
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
            },

            result = await getJoke();

        if (!result.joke) {
            jinx._log.warn('No joke found in random joke response');
            let newMessage;

            try {
                newMessage = await message.channel.send('I\'m not feeling very funny right now. Sorry!');
            } catch (error) {
                throw new _Error({
                    error,
                    message: 'get-data-jokes message send error'
                });
            }

            logError(_Error({
                details: {
                    result
                },
                message: newMessage.content
            }));
            return newMessage;
        }

        // Build a Discord RichEmbed response.
        try {
            const embed = new Discord.MessageEmbed()
                    .setDescription(result.joke)
                    .setFooter('Jokes provided by icanhazdadjoke.com'),
                newMessage = await message.channel.send({
                    embed
                });

            logReply({
                joke: newMessage.content
            });
        } catch (error) {
            throw new _Error({
                error,
                message: 'get-data-jokes message send error'
            });
        }
    }
};
