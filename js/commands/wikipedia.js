/**
The wiki command.
Queries the English-language Wikipedia with a search string.

@module commands/wikipedia
*/
import _Error from 'isotropic-error';
import Discord from 'discord.js';
import wiki from 'wikijs';

const wikipedia = {
    /**
    @property {String} description
    */
    description: '',

    /**
    Query Wikipedia with a search string.

    @method process
    @arg {Jinx} jinx The jinx object
    @arg {Discord.Message} message The triggering Discord message
    @arg {String} query The search query string for Wikipedia
    @returns {Promise<Discord.Message>} A Promise object
    */
    process: (jinx, message, query) => new Promise((resolve, reject) => {
        if (!query) { // No query; print usage info
            return message.channel.send('usage: !wiki query');
        }

        // Query Wikipedia and process the result into a human-readable response
        wiki().search(query, 1).then(data => wiki().page(data.results[0]).then(page => {
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
                    // Prepare a Discord RichEmbed
                    embed = new Discord.RichEmbed()
                        .setTitle(pageTitle)
                        .setURL(canonicalUrl)
                        .setDescription(summaryText)
                        .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Wikipedia-logo-v2-wordmark.svg/200px-Wikipedia-logo-v2-wordmark.svg.png')
                        .setFooter('Data provided by Wikipedia: The Free Encyclopedia');

                return message.channel.send({
                    embed
                }).then(newMessage => {
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
                    resolve(newMessage);
                });
            }).catch(error => {
                reject(_Error({
                    error,
                    message: 'Wiki command error'
                }));
            });
        }));
    })
};

export default wikipedia;
