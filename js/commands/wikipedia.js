import Discord from 'discord.js';
import wiki from 'wikijs';

/**
 * An object for interacting with the Discord API.
 * @typedef Client
 * @extends {EventEmitter}
 */

/**
* Represents a message on Discord.
* @typedef Message
* @property {User} author The author of the message
* @property {TextChannel|DMChannel|GroupDMChannel} channel The channel that the message was sent in
*/

const wikipedia = {
    description: '',
    /**
     * Query Wikipedia with a search string.
     * @arg {Jinx} jinx The jinx object
     * @arg {Message} message The triggering Discord message
     * @arg {string} query The search query string for Wikipedia
     * @returns {Promise} A Promise object
     */
    process: (jinx, message, query) => {
        if (!query) {
            return message.channel.send('usage: !wiki query');
        }

        return wiki().search(query, 1).then(data => wiki().page(data.results[0]).then(page => {
            page.summary().then(summary => Promise.resolve(summary.toString().split('\n').reduce((text, paragraph) => {
                if (text !== '' || !paragraph) {
                    return text;
                }

                if (paragraph) {
                    return paragraph;
                }

                return text;
            }, ''))).then(summaryText => {
                const pageTitle = page.raw.title,
                    canonicalUrl = page.raw.canonicalurl,

                    embed = new Discord.RichEmbed()
                        .setTitle(pageTitle)
                        .setURL(canonicalUrl)
                        .setDescription(summaryText)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Wikipedia-logo-v2-wordmark.svg/200px-Wikipedia-logo-v2-wordmark.svg.png')
                        .setFooter('Data provided by Wikipedia: The Free Encyclopedia');

                return message.channel.send({
                    embed
                }).then(() => {
                    jinx._commandLog.command('reply', {
                        author: message.author.tag,
                        channel: message.channel ?
                            message.channel.name :
                            null,
                        command: 'wiki',
                        details: {
                            canonicalUrl,
                            pageTitle,
                            query,
                            summaryText
                        },
                        message: message.content,
                        server: message.guild ?
                            message.guild.name :
                            null
                    });
                });
            });
        }));
    }
};

export default wikipedia;
