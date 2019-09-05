/**
The ageTest command.
Rolls and AGE System test (3d6 + modifier) with a Stunt Die.

@module commands/roll
*/
import _Error from 'isotropic-error';
import _DiceTower from '@dsibilly/dice-tower';

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
        process: (jinx, message, payload) => new Promise((resolve, reject) => {
            const emojiDice = [
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
            ].reduce((emojiDice, name) => {
                emojiDice[name] = jinx._client.emojis.find(emoji => emoji.name === name);

                return emojiDice;
            }, {});

            /*
          jinx._log.info(message.guild.emojis.map(emoji => emoji.name).join(' '));
          jinx._log.info(jinx._client.emojis.find(emoji => emoji.name === 'd61'));
          */
            let dice = [0, 0, 0],
                hasStuntPoints = false,
                stuntPoints = 0;

            if (payload) {
                payload = parseInt(payload.replace(/\s/gu, ''), 10); // strip all spaces
            } else {
                payload = 0;
            }

            dice = dice.map(die => _diceTower.roll('1d6').result);

            if (dice[0] === dice[1] || dice[0] === dice[2] || dice[1] === dice[2]) {
                hasStuntPoints = true;
                stuntPoints = dice[2];
            }

            message.reply(`here's your test result:\n${dice.reduce((str, die, index) => {
                if (index === 0) {
                    return emojiDice[`d6${die}`];
                }

                if (index === 2) {
                    return `${str} ${emojiDice[`s6${die}`]}`;
                }

                return `${str} ${emojiDice[`d6${die}`]}`;
            }, '')}${
                payload === 0 ?
                    '' :
                    `\n**Modifier:**  ${
                        payload > 0 ?
                            '+' :
                            ''
                    }${payload}`
            }\n**Total:** ${dice.reduce((sum, die) => sum + die, payload)}${
                hasStuntPoints ?
                    `\n    **Stunt Points:** *${stuntPoints}*` :
                    ''
            }`).then(response => {
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
