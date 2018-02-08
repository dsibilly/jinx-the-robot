import _Error from 'isotropic-error';
import Roll from 'roll';

const roll = new Roll(),
    rollDice = {
        description: 'rolls dice for games and amusement',
        process: (jinx, message, query) => {
            const author = message.author.tag,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'roll',
                server = message.guild ?
                    message.guild.name :
                    null,

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

            let dice = null;

            if (!query) {
                return message.channel.send('usage: !roll expression, e.g. _!roll 2d6_').then(() => {
                    logReply({
                        message: 'No query found, sending usage help message',
                        query: null
                    });
                }).catch(error => {
                    logError(_Error({
                        error,
                        message: 'roll-dice message send error'
                    }));
                });
            }

            if (!roll.validate(query)) {
                return message.channel.send(`_${query}_ is not a valid die roll, <@${message.author.id}>.`).then(() => {
                    logReply({
                        message: 'No valid die roll found',
                        query: null
                    });
                }).catch(error => {
                    logError(_Error({
                        error,
                        message: 'roll-dice message send error'
                    }));
                });
            }

            dice = roll.roll(query);

            return message.channel.send(`<@${message.author.id}>: You rolled ${dice.result}${dice.rolled.length === 1 ?
                '.' :
                ` (${dice.rolled.reduce(reduceToString, '')})`}`).then(() => {
                logReply({
                    query,
                    result: dice.result,
                    rolled: dice.rolled
                });
            }).catch(error => {
                logError(_Error({
                    error,
                    message: 'roll-dice message send error'
                }));
            });
        }
    };

export default rollDice;
