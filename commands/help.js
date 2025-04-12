const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all Stellara commands and what they do'),

  async execute(interaction, client) {
    const commands = [...client.commands.values()];

    const embed = new EmbedBuilder()
      .setTitle('✨ Stellara Help Menu')
      .setDescription('Here are all the available commands:')
      .setColor('#8A2BE2')
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: 'Made with ❤️ by Pixel#9421' });

    for (const command of commands) {
      embed.addFields({
        name: `/${command.data.name}`,
        value: command.data.description || 'No description available.',
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed]});
  }
};
