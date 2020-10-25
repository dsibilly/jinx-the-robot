/**
The stats command.

@module commands/stats
*/
import Discord from 'discord.js';
import Jinx from '../jinx';
import msToTime from '../util/msToTime';
import {
    arch,
    cpus,
    hostname
} from 'os';
import {
    stripIndents
} from 'common-tags';
import {
    author as botAuthor,
    version
} from '../../package.json';

const stats = {
    description: 'Displays statistics about the bot.',

    process: (jinx, message, payload) => new Promise((resolve, reject) => {
        const author = message.author.tag,
            channel = message.channel ?
                message.channel.name :
                null,
            command = 'help',
            embed = new Discord.MessageEmbed(),
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

        embed.setColor(3447003)
            .setDescription('**Jinx Statistics**')
            .addField('❯ Uptime', msToTime(jinx._client.uptime), true)
            .addField('❯ Memory Usage', `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, true)
            .addField('❯ General Stats', stripIndents`
                • Servers: ${jinx._client.guilds.cache.size}
                • Channels: ${jinx._client.channels.cache.size}
            `, true)
            .addField('❯ Commands Processed', jinx._commands, true)
            .addField('❯ Host', hostname())
            .addField('❯ Architecture', arch())
            .addField('❯ CPU', cpus()[0].model)
            .addField('❯ Cores', cpus().length)
            .setThumbnail(`${jinx._client.user.displayAvatarURL()}`)
            .setFooter(`jinx-the-robot v${version} © 2017-${new Date().getFullYear()} ${botAuthor}`);

        message.channel.send({
            embed
        }).then(newMessage => {
            logReply({
                message: 'Stats reply sent'
            });
            resolve(newMessage);
        }).catch(reject);
    })
};

export default stats;
