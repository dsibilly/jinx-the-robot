/* import atlasChatSend from './atlasChatSend';
   import atlasChatStart from './atlasChatStart';
   import atlasChatStop from './atlasChatStop';
   import atlasListPlayers from './atlasListPlayers'; */
import ageAbilities from './ageAbilities';
import ageTest from './ageTest';
import avatar from './avatar';
import dadJoke from './dadJoke';
import dndChar from './dndChar';
import goodBot from './goodBot';
import help from './help';
import nextLaunch from './nextLaunch';
import ping from './ping';
import radio from './radio';
import remindMe from './remindMe';
import roll from './roll';
import stats from './stats';
import wiki from './wikipedia';

export default {
    aliases: {
        // ac: 'atlasChatSend',
        ageabil: 'ageAbilities',
        ageabilities: 'ageAbilities',
        agetest: 'ageTest',
        atest: 'ageTest',
        dadjoke: 'dadJoke',
        goodbot: 'goodBot',
        hpr: 'radio',
        jk: 'dadJoke',
        joke: 'dadJoke',
        nl: 'nextLaunch',
        randChar: 'dndChar',
        remind: 'remindMe',
        remindme: 'remindMe',
        rollChar: 'ageAbilities',
        rollCharacter: 'ageAbilities'
    },
    commands: {
        /* atlasChatSend,
           atlasChatStart,
           atlasChatStop,
           atlasListPlayers, */
        ageAbilities,
        ageTest,
        avatar,
        dadJoke,
        dndChar,
        goodBot,
        help,
        nextLaunch,
        ping,
        radio,
        remindMe,
        roll,
        stats,
        wiki
    }
};
