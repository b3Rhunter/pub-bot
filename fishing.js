// fishing.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

async function startFishingGame(interaction) {
    const fishEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Fishing Time!')
        .setDescription('Cast line and wait for a bite...');

    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('cast_line').setLabel('Cast Line').setStyle(ButtonStyle.Success),
        );

    await interaction.reply({ embeds: [fishEmbed], components: [buttons] });
}

async function handleFishingInteraction(interaction) {
    if (interaction.customId === 'cast_line') {
        await interaction.deferReply({ ephemeral: false });
        const items = {
            common: ['a small fish 🐟', 'a pair of old shoes 🥿', 'a rusty can 🥫'],
            uncommon: ['a big fish 🐠', 'a message in a bottle 🍾', 'an old watch ⌚'],
            rare: ['a treasure chest 🪙', 'a golden fish 🐠💰', 'an ancient vase 🏺'],
            epic: ['a pearl necklace 📿', 'a rare crystal 🔮', 'a sunken drone 🚁'],
            legendary: ['a legendary sea monster 🐉', 'an enchanted trident 🔱', 'a mythical mermaid’s tear 💧'],
        };

        const selectCatch = () => {
            const rand = Math.random() * 100;
            if (rand < 60) return items.common[Math.floor(Math.random() * items.common.length)];
            if (rand < 85) return items.uncommon[Math.floor(Math.random() * items.uncommon.length)];
            if (rand < 95) return items.rare[Math.floor(Math.random() * items.rare.length)];
            if (rand < 99.5) return items.epic[Math.floor(Math.random() * items.epic.length)];
            return items.legendary[Math.floor(Math.random() * items.legendary.length)];
        };

        const catchResult = selectCatch();

        const resultEmbed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('You caught...')
            .setDescription(`You caught ${catchResult}`);

            const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('cast_line').setLabel('Cast Line').setStyle(ButtonStyle.Success),
            );

        await interaction.editReply({ embeds: [resultEmbed], components: [buttons] });
    }
}


module.exports = { startFishingGame, handleFishingInteraction };