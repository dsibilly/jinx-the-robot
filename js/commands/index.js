import atlasChatStart from './atlasChatStart';
import atlasChatStop from './atlasChatStop';
import avatar from './avatar';
import dadJoke from './dadJoke';
import goodBot from './goodBot';
import help from './help';
import nextLaunch from './nextLaunch';
import ping from './ping';
import radio from './radio';
import remindMe from './remindMe';
import roll from './roll';
import wiki from './wikipedia';

export default {
    aliases: {
        dadjoke: 'dadJoke',
        goodbot: 'goodBot',
        hpr: 'radio',
        jk: 'dadJoke',
        joke: 'dadJoke',
        nl: 'nextLaunch',
        remind: 'remindMe',
        remindme: 'remindMe'
    },
    commands: {
        atlasChatStart,
        atlasChatStop,
        avatar,
        dadJoke,
        goodBot,
        help,
        nextLaunch,
        ping,
        radio,
        remindMe,
        roll,
        wiki
    }
};
