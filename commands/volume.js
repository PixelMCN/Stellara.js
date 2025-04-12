const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set the music volume')
    .addIntegerOption(option => 
      option.setName('volume')
        .setDescription('Volume level (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)
    ),

  async execute(interaction, client) {
    const player = client.kazagumo.players.get(interaction.guildId);

    if (!player || !player.queue.current) {
      return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
    }

    const memberChannel = interaction.member.voice?.channel;
    if (!memberChannel) {
      return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
    }

    if (memberChannel.id !== player.voiceId) {
      return interaction.reply({ content: 'You need to be in the same voice channel as the bot to use this command!', ephemeral: true });
    }

    const volume = interaction.options.getInteger('volume');
    player.setVolume(volume);

    interaction.reply(`🔊 Set volume to **${volume}%**`);
  },
};
