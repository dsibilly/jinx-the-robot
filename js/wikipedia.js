import Discord from 'discord.js';
import wiki from 'wikijs';

const wikipedia = (bot, message, query) => {
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
                canonicalUrl = page.raw.canonicalurl;

            return message.channel.send({
                embed: new Discord.RichEmbed()
                    .setTitle(pageTitle)
                    .setURL(canonicalUrl)
                    .setDescription(summaryText)
                    .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Wikipedia-logo-v2-wordmark.svg/200px-Wikipedia-logo-v2-wordmark.svg.png')
                    .setFooter('Data provided by Wikipedia: The Free Encyclopedia')
            });
        });
    }));
};

export default wikipedia;
