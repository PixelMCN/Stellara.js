const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Display information about the currently playing song'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
    }

    const track = player.queue.current;

    function formatDuration(ms) {
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / (1000 * 60)) % 60);
      const hours = Math.floor(ms / (1000 * 60 * 60));

      return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function createProgressBar(position, duration, size = 15) {
      const progress = Math.round((size * position) / duration);
      return '▬'.repeat(progress) + '🔘' + '▬'.repeat(size - progress);
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Now Playing')
      .setDescription(`[${track.title}](${track.uri})`)
      .addFields(
        { name: 'Artist', value: track.author || 'Unknown', inline: true },
        { name: 'Duration', value: `${formatDuration(player.position)} / ${formatDuration(track.length)}`, inline: true },
        { name: 'Progress', value: createProgressBar(player.position, track.length), inline: false }
      )
      .setThumbnail(track.thumbnail || 'https://i.imgur.com/OpkI8wU.png')
      .setColor('#8A2BE2');

    interaction.reply({ embeds: [embed] });
  },
};
