/**
The dndChar command.
Rolls a full set of six ability scores for D&D.

@module commands/dndChar
*/
import _Error from 'isotropic-error';
import _DiceTower from '@dsibilly/dice-tower';
import {
    parallel
} from 'presage';

const _diceTower = new _DiceTower(), // A Roll instance
    dndChar = {
        /**
        @property {String} description
        */
        description: 'Rolls a full set of six ability scores for D&D.',

        /**
        @method process
        @arg {Jinx} jinx
        @arg {Discord.Message} message
        @arg {String} query
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message) => new Promise((resolve, reject) => {
            const abilityArray = Array(6).fill(() => new Promise(resolve => {
                    const fourDSixDropLowest = _diceTower.roll('4d6b3');

                    resolve(fourDSixDropLowest.result);
                })),
                author = message.author.tag,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'dndChar',
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
                arrayMax = arr => arr.reduce((a, b) => Math.max(a, b)),
                arrayMin = arr => arr.reduce((a, b) => Math.min(a, b));

            parallel(abilityArray).then(results => {
                const arraySum = results.reduce((sum, score) => sum + score, 0),
                    arrayRange = arrayMax(results) - arrayMin(results);

                message.reply(`here's your ability scores:\n${results.reduce((memo, result) => `${memo}${result}\n`, '')}\nSum: ${arraySum}\nRange: ${arrayRange}`)
                    .then(response => {
                        logReply({
                            range: arrayRange,
                            results,
                            sum: arraySum
                        });
                        resolve(response);
                    }).catch(error => {
                        reject(_Error({
                            error,
                            message: 'dndChar message send error'
                        }));
                    });
            });
        })
    };

export default dndChar;
