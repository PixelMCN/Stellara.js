const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { KazagumoTrack } = require('kazagumo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The song URL or search term')
        .setRequired(true)),

  async execute(interaction, client) {
    const { channel } = interaction.member.voice;
    if (!channel) {
      return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
    }

    const botPermissions = interaction.guild.members.me.permissionsIn(channel);
    if (!botPermissions.has(['Connect', 'Speak'])) {
      return interaction.reply({ content: 'I need permission to join and speak in your voice channel.', ephemeral: true });
    }

    await interaction.deferReply();

    let player = client.kazagumo.players.get(interaction.guildId);
    
    if (!player) {
      player = await client.kazagumo.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: channel.id,
        deaf: true,
      });
    }

    const query = interaction.options.getString('query');
    const result = await client.kazagumo.search(query, { requester: interaction.user });

    if (!result || ['LOAD_FAILED', 'NO_MATCHES'].includes(result.type)) {
      return interaction.editReply({ content: 'No results found or load failed.' });
    }

    let responseEmbed;

    if (result.type === 'PLAYLIST') {
      player.queue.add(result.tracks);
      responseEmbed = new EmbedBuilder()
        .setDescription(`Added ${result.tracks.length} tracks from [${result.playlistName}](${query}) to the queue.`)
        .setColor('#00FF00');
    } else {
      const track = result.tracks[0];
      player.queue.add(track instanceof KazagumoTrack ? track : new KazagumoTrack(track, interaction.user));
      responseEmbed = new EmbedBuilder()
        .setDescription(`Added [${track.title}](${track.uri}) to the queue.`)
        .setColor('#00FF00');
    }

    if (!player.playing && !player.paused) {
      player.play();
    }

    await interaction.editReply({ embeds: [responseEmbed] });
  },
};





