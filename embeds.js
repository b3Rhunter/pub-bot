// embeds.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a custom embed.')
    .addStringOption(option => option.setName('title').setDescription('Title of the embed').setRequired(true))
    .addStringOption(option => option.setName('description').setDescription('Description of the embed').setRequired(true))
    .addStringOption(option => option.setName('image').setDescription('URL of the image to add to the embed').setRequired(false))
    .addStringOption(option => option.setName('fields').setDescription('Fields to add to the embed. Format: title|value, title|value').setRequired(false)),
  async execute(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const imageUrl = interaction.options.getString('image');
    const fieldsInput = interaction.options.getString('fields');

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor('#FFD700');

    if (imageUrl) embed.setImage(imageUrl);

    if (fieldsInput) {
      const fields = fieldsInput.split(',').map(field => {
        const [title, value] = field.split('|').map(part => part.trim());
        return { name: title, value: value, inline: false };
      });
      embed.addFields(fields);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
