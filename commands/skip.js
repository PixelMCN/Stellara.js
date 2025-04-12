const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.playing) {
      return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
    }

    const memberChannel = interaction.member.voice.channel;
    if (!memberChannel) {
      return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
    }

    if (memberChannel.id !== player.voiceId) {
      return interaction.reply({ content: 'You need to be in the same voice channel as the bot to use this command!', ephemeral: true });
    }

    // Store information about the current track and queue state
    const currentTrack = player.queue.current;
    const hasNextTrack = player.queue.size > 0;

    // Set a flag to indicate this is a skip operation to prevent player destruction
    player.data.skipping = true;
    
    // Use stop() to trigger the next song
    await player.skip();

    const embed = new EmbedBuilder()
      .setTitle('⏭️ Skipped Track')
      .setDescription(`Skipped [${currentTrack.title}](${currentTrack.uri})`)
      .setColor('#8A2BE2');
      
    if (!hasNextTrack) {
      embed.setFooter({ text: 'Queue is now empty' });
    }

    await interaction.reply({ embeds: [embed] });
  },
};


