import icanhazdadjokes, {
    args
} from '../api/icanhazdadjokes';

import _Error from 'isotropic-error';
import clone from '../util/clone';
import Discord from 'discord.js';
import presage from 'presage';

const promisify = (client, method, parameters = {}) => {
        const {
            callbackFunction,
            promise
        } = presage.promiseWithCallback();

        client.methods[method](clone(args, {
            parameters
        }), response => {
            callbackFunction(null, response);
        });

        return promise;
    },
    getRandomJoke = client => promisify(client, 'joke'),
    getJoke = () => getRandomJoke(icanhazdadjokes);

export default {
    description: 'displays a random dad joke from icanhazdadjoke.com',
    process: (jinx, message) => new Promise((resolve, reject) => {
        const author = message.author.tag,
            channel = message.channel ?
                message.channel.name :
                null,
            command = 'dadJoke',
            server = message.guild ?
                message.guild.name :
                null,

            logError = error => {
                jinx._commandLog.command('error', {
                    author,
                    channel,
                    command,
                    error,
                    server
                });
            },
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

        getJoke().then(result => {
            if (!result.joke) {
                jinx._log.warn('No joke found in random joke response');
                message.channel.send('I\'m not feeling very funny right now. Sorry!').then(() => {
                    logError(_Error({
                        details: {
                            result
                        },
                        message: 'No joke found in API response'
                    }));
                    resolve();
                }).catch(error => {
                    reject(_Error({
                        error,
                        message: 'get-data-jokes message send error'
                    }));
                });
                return;
            }

            const embed = new Discord.RichEmbed()
                .setDescription(result.joke)
                .setFooter('Jokes provided by icanhazdadjoke.com');

            message.channel.send({
                embed
            }).then(() => {
                logReply({
                    joke: result.joke
                });
                resolve();
            }).catch(error => {
                reject(_Error({
                    error,
                    message: 'get-data-jokes message send error'
                }));
            });
        });
    })
};

// https://icanhazdadjoke.com/static/smile.svg
