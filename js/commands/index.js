import avatar from './avatar';
import dadJoke from './dadJoke';
import goodBot from './goodBot';
import help from './help';
import nextLaunch from './nextLaunch';
import ping from './ping';
import remindMe from './remindMe';
import roll from './roll';
import wiki from './wikipedia';

export default {
    aliases: {
        dadjoke: 'dadJoke',
        goodbot: 'goodBot',
        jk: 'dadJoke',
        joke: 'dadJoke',
        nl: 'nextLaunch',
        remind: 'remindMe',
        remindme: 'remindMe'
    },
    commands: {
        avatar,
        dadJoke,
        goodBot,
        help,
        nextLaunch,
        ping,
        remindMe,
        roll,
        wiki
    }
};
