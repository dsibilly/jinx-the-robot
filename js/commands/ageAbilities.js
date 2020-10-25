/**
The ageAbilities command.
Rolls a full set of nine ability scores for AGE RPGs.

@module commands/ageAbilities
*/
import _Error from 'isotropic-error';
import _DiceTower from '@dsibilly/dice-tower';
import {
    parallel
} from 'presage';

const abilityList = [
        'ACC',
        'COM',
        'CON',
        'DEX',
        'FGT',
        'INT',
        'PER',
        'STR',
        'WIS'
    ],
    abilityMap = {
        3: -2,
        4: -1,
        5: -1,
        6: 0,
        7: 0,
        8: 0,
        9: 1,
        10: 1,
        11: 1,
        12: 2,
        13: 2,
        14: 2,
        15: 3,
        16: 3,
        17: 3,
        18: 4
    },

    _diceTower = new _DiceTower(), // A Roll instance
    ageAbilities = {
        /**
        @property {String} description
        */
        description: 'Rolls a full set of nine ability scores for AGE RPGs.',

        /**
        @method process
        @arg {Jinx} jinx
        @arg {Discord.Message} message
        @arg {String} query
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message) => new Promise((resolve, reject) => {
            const abilityArray = Array(9).fill(() => new Promise(resolve => {
                    const threeDSix = _diceTower.roll('3d6');

                    resolve(abilityMap[threeDSix.result]);
                })),
                author = message.author.tag,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'ageAbilities',
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

            parallel(abilityArray).then(results => {
                message.reply(`here's your ability scores:\n${results.reduce((memo, result, index) => `${memo}${abilityList[index]}: ${result}\n`, '')}`)
                    .then(response => {
                        logReply({
                            results: results.reduce((output, result, index) => {
                                const stat = abilityList[index];

                                output[stat] = result;
                                return output;
                            }, {})
                        });
                        resolve(response);
                    }).catch(error => {
                        reject(_Error({
                            error,
                            message: 'ageAbilities message send error'
                        }));
                    });
            });
        })
    };

export default ageAbilities;
