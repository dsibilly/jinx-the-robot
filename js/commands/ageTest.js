/**
The ageTest command.
Rolls and AGE System test (3d6 + modifier) with a Stunt Die.

@module commands/roll
*/
import _Error from 'isotropic-error';
import _DiceTower from '@dsibilly/dice-tower';

let emojiDice = [
    'd61',
    'd62',
    'd63',
    'd64',
    'd65',
    'd66',
    's61',
    's62',
    's63',
    's64',
    's65',
    's66'
];

const _diceTower = new _DiceTower(), // A Roll instance
    ageTest = {
        /**
        @property {String} description
        */
        description: 'Rolls an AGE System test.',

        /**
        @method process
        @arg {Jinx} jinx
        @arg {Discord.Message} message
        @arg {String} query
        @returns {Promise<Discord.Message>}
        */
        process: (jinx, message, modifier) => new Promise((resolve, reject) => {
            const author = message.author.tag,
                channel = message.channel ?
                    message.channel.name :
                    null,
                command = 'ageTest',
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

            let dice = [0, 0, 0], // dice roll results
                hasStuntPoints = false,
                stuntPoints = 0,
                total = 0;

            if (modifier) {
                // strip all spaces and attempt to parse into a Number
                modifier = parseInt(modifier.replace(/\s/gu, ''), 10);
            } else {
                // No modifier found, thus no modifier!
                modifier = 0;
            }

            if (isNaN(modifier)) {
                // If the modifier can't be parsed into a number, it's invalid.
                message.channel.send(`usage: ${jinx._commandPrefix}ageTest {MODIFIER}, e.g. _${jinx._commandPrefix}ageTest +2_. MODIFIER must be an integer.`).then(newMessage => {
                    logReply({
                        message: 'No valid modifier found, sending usage help message',
                        modifier: null
                    });
                    resolve(newMessage);
                }).catch(error => {
                    reject(new _Error({
                        error,
                        message: 'ageTest message send error'
                    }));
                });
                return;
            }

            // If the die face emoji have been cached, don't cache them again...
            if (Array.isArray(emojiDice)) {
                jinx._log.warn('Caching ageTest dice emoji...');
                emojiDice = emojiDice.reduce((emojiDice, name) => {
                    emojiDice[name] = jinx._client.emojis.cache.find(emoji => emoji.name === name);

                    return emojiDice;
                }, {});
            }

            // Roll 3d6, one at a time...
            dice = dice.map(() => _diceTower.roll('1d6').result);

            // Detect double results for SP generation
            if (dice[0] === dice[1] || dice[0] === dice[2] || dice[1] === dice[2]) {
                hasStuntPoints = true;
                stuntPoints = dice[2];
            }

            total = dice.reduce((sum, die) => sum + die, modifier);

            // Build Discord reply message
            message.reply(`here's your test result:\n${dice.reduce((str, die, index) => {
                if (index === 0) {
                    // First die
                    return emojiDice[`d6${die}`];
                }

                if (index === 2) {
                    // Last die (Stunt Die!)
                    return `${str} ${emojiDice[`s6${die}`]}`;
                }

                // Middle die
                return `${str} ${emojiDice[`d6${die}`]}`;
            }, '')}${
                modifier === 0 ? // Only show non-zero modifiers
                    '' :
                    `\n**Modifier:**  ${
                        modifier > 0 ? // Prepend positive modifiers with '+' for clarity
                            '+' :
                            ''
                    }${modifier}`
            }\n**Total:** ${total}${
                hasStuntPoints ? // Only show SP if any were generated
                    `\n    **Stunt Points:** *${stuntPoints}*` :
                    ''
            }`).then(response => {
                logReply({
                    dice,
                    modifier,
                    stuntPoints,
                    total
                });
                resolve(response);
            }).catch(error => {
                reject(_Error({
                    error,
                    message: 'agetest message send error'
                }));
            });
        }),

        usage: '{MODIFIER}'
    };

export default ageTest;
