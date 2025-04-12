const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display the current music queue'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply('There is no music player active in this server.');
    }

    if (!player.queue.current) {
      return interaction.reply('There is nothing currently playing.');
    }

    const current = player.queue.current;
    
    function formatDuration(duration) {
      const seconds = Math.floor((duration / 1000) % 60);
      const minutes = Math.floor((duration / (1000 * 60)) % 60);
      const hours = Math.floor(duration / (1000 * 60 * 60));

      return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Access the queue's tracks, handling different possible structures
    let tracks = [];
    let queueSize = 0;
    
    // Try to access tracks in different ways based on Kazagumo implementation
    if (player.queue.tracks && Array.isArray(player.queue.tracks)) {
      tracks = player.queue.tracks;
      queueSize = tracks.length;
    } else if (player.queue.length !== undefined) {
      queueSize = player.queue.length;
      // Some implementations might have a different way to access tracks
      if (Array.isArray(player.queue)) {
        tracks = player.queue;
      }
    } else if (player.queue.size !== undefined) {
      queueSize = player.queue.size;
      // Check if queue is a Map or has a values() method
      if (player.queue.values && typeof player.queue.values === 'function') {
        tracks = Array.from(player.queue.values());
      }
    }

    // Format the queue string
    let queueString = 'No songs in queue';
    
    if (tracks.length > 0) {
      queueString = tracks
        .slice(0, 10) // Only show first 10 tracks
        .map((track, i) => `${i + 1}. [${track.title}](${track.uri}) - ${formatDuration(track.length)}`)
        .join('\n');
      
      if (tracks.length > 10) {
        queueString += `\n\n...and ${tracks.length - 10} more`;
      }
    }

    const queueEmbed = new EmbedBuilder()
      .setTitle('🎶 Music Queue')
      .setDescription(
        `**Now Playing:**\n[${current.title}](${current.uri}) - ${formatDuration(current.length)}\n\n**Up Next:**\n${queueString}`
      )
      .setColor('#8A2BE2')
      .setFooter({ text: `${queueSize} song(s) in queue` });

    interaction.reply({ embeds: [queueEmbed] });
  },
};

