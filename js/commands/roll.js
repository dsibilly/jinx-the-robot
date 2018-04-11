/**
The roll command.
Rolls the specified dice query via the `roll` npm module.

@module commands/roll
*/
import _Error from 'isotropic-error';
import Roll from 'roll';

const roll = new Roll(), // A Roll instance
    rollDice = {
        /**
        @property {String} description
        */
        description: 'rolls dice for games and amusement',

        /**
        @method process
        @arg {Jinx} jinx
        @arg {Discord.Message} message
        @arg {String} query
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message, query) => new Promise((resolve, reject) => {
            const author = message.author.tag,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'roll',
                server = message.guild ?
                    message.guild.name :
                    null,

                /**
                @function reduceToString
                @protected
                @arg {String} str
                @arg {Array|String} result
                @arg {Number} index
                @returns {String}
                */
                reduceToString = (str, result, index) => {
                    if (Array.isArray(result)) {
                        str += `${index === 0 ?
                            '' :
                            ' + '}(${result.reduce(reduceToString, '')})`;
                    } else {
                        str += `${index === 0 ?
                            '' :
                            ' + '}${result}`;
                    }

                    return str;
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

            let dice = null;

            if (!query) { // If the query is missing, print usage information
                message.channel.send('usage: !roll expression, e.g. _!roll 2d6_').then(newMessage => {
                    logReply({
                        message: 'No query found, sending usage help message',
                        query: null
                    });
                    resolve(newMessage);
                }).catch(error => {
                    reject(_Error({
                        error,
                        message: 'roll-dice message send error'
                    }));
                });
                return;
            }

            query = query.replace(/\s/g, ''); // Strip all spaces from the query

            if (!roll.validate(query)) { // Invalid roll query
                message.channel.send(`_${query}_ is not a valid die roll, <@${message.author.id}>.`).then(newMessage => {
                    logReply({
                        message: 'No valid die roll found',
                        query: null
                    });
                    resolve(newMessage);
                }).catch(error => {
                    reject(_Error({
                        error,
                        message: 'roll-dice message send error'
                    }));
                });
                return;
            }

            dice = roll.roll(query); // Perform the dice roll

            message.channel.send(`<@${message.author.id}>: You rolled ${dice.result}${dice.rolled.length === 1 ?
                '.' :
                ` (${dice.rolled.reduce(reduceToString, '')})`}`).then(newMessage => {
                logReply({
                    query,
                    result: dice.result,
                    rolled: dice.rolled
                });
                resolve(newMessage);
            }).catch(error => {
                reject(_Error({
                    error,
                    message: 'roll-dice message send error'
                }));
            });
        })
    };

export default rollDice;
