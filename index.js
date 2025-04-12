// index.js - Main bot file with Kazagumo + Shoukaku

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

// Load commands
client.commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  }
}

// Load Kazagumo instance
const createKazagumo = require('./kazagumo');
const kazagumo = createKazagumo(client);
client.kazagumo = kazagumo;

kazagumo.shoukaku.on('ready', name => console.log(`🎧 Lavalink node ${name} is ready`));
kazagumo.shoukaku.on('error', (name, error) => console.error(`❌ Node ${name} error: ${error}`));

// On track start
kazagumo.on('playerStart', async (player, track) => {
  const channel = client.channels.cache.get(player.textId);
  if (!channel) return;

  const progressBar = (current, total, size = 20) => {
    const percentage = Math.min(current / total, 1);
    const progress = Math.round(size * percentage);
    const empty = Math.max(size - progress, 0);
    return `${'▬'.repeat(progress)}🔘${'▬'.repeat(empty)}`;
  };

  const embed = new EmbedBuilder()
    .setAuthor({ name: '🎶 Now Playing', iconURL: client.user.displayAvatarURL() })
    .setTitle(track.title)
    .setURL(track.uri)
    .setThumbnail(track.thumbnail || 'https://i.imgur.com/OpkI8wU.png')
    .addFields(
      { name: 'Artist', value: track.author || 'Unknown', inline: true },
      { name: 'Duration', value: formatDuration(track.length), inline: true },
      { name: 'Requested By', value: track.requester?.tag || 'Unknown', inline: true },
      { name: 'Progress', value: `${progressBar(0, track.length)}\n0:00 / ${formatDuration(track.length)}` }
    )
    .setColor('#8A2BE2')
    .setFooter({ text: 'Use buttons or /commands to control playback.' });

  const msg = await channel.send({ embeds: [embed] });
  player.data.nowPlayingMessage = msg.id;
  player.data.nowPlayingTimestamp = Date.now();

  player.data.nowPlayingInterval = setInterval(async () => {
    const currentTime = Date.now() - player.data.nowPlayingTimestamp;
    if (!msg.editable) return;

    const updatedEmbed = EmbedBuilder.from(embed)
      .spliceFields(3, 1, {
        name: '📶 Progress',
        value: `${progressBar(currentTime, track.length)}\n${formatDuration(currentTime)} / ${formatDuration(track.length)}`
      });

    msg.edit({ embeds: [updatedEmbed] }).catch(() => {});
  }, 15000);
});


// Track end cleanup and autoplay
kazagumo.on('playerEnd', async (player, track) => {
  if (player.data?.nowPlayingInterval) clearInterval(player.data.nowPlayingInterval);
  player.data.nowPlayingInterval = null;

  // If the player was skipping, do not proceed further
  if (player.data?.skipping) {
    player.data.skipping = false;
    return;
  }

  // If there are tracks left in the queue, play the next one
  if (player.queue.size > 0) {
    const nextTrack = player.queue.shift();  // Shift the next track from the queue
    return player.play(nextTrack);
  }

  // If autoplay is enabled and the current track has an identifier
  if (player.options.autoplay && track?.identifier) {
    try {
      // Search for related tracks using YouTube URL
      const res = await kazagumo.search(
        `https://www.youtube.com/watch?v=${track.identifier}&list=RD${track.identifier}`,
        { requester: track.requester }
      );

      const nextTrack = res.tracks?.[1];  // Get the next recommended song

      if (nextTrack) {
        // Add the autoplay track to the queue
        player.queue.add(nextTrack);
        // Play the newly added autoplay track without clearing the queue
        return player.play(nextTrack);
      }
    } catch (err) {
      console.error('Autoplay error:', err);
    }
  }

  // If no more tracks are left in the queue and autoplay didn't find anything
  const channel = client.channels.cache.get(player.textId);
  if (channel) {
    channel.send({
      embeds: [
        new EmbedBuilder()
          .setDescription('Queue has ended. Use `/play` to add more songs!')
          .setColor('#FF0000')
      ]
    });
  }

  // If nothing is left to play, destroy the player
  player.destroy();
});



// Handle interactions
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '❌ There was an error executing this command!',
        flags: 64
      });
    }
  }

  if (interaction.isButton()) {
    const { customId } = interaction;
    const player = kazagumo.players.get(interaction.guildId);
    if (!player) {
      return interaction.reply({ content: 'No music is currently playing.', flags: 64 });
    }

    switch (customId) {
      case 'skip':
        if (player.queue.size === 0) {
          player.stop();
          interaction.reply({ content: '⏭️ Skipped the current song. Queue is empty.', flags: 64 });
        } else {
          player.data.skipping = true;
          player.stop();
          interaction.reply({ content: '⏭️ Skipped to the next song.', flags: 64 });
        }
        break;

      case 'stop':
        player.destroy();
        interaction.reply({ content: '🛑 Music stopped and queue cleared.', flags: 64 });
        break;

      case 'queue':
        const queue = player.queue;
        const current = queue.current;
        if (!queue.size && !current) {
          return interaction.reply({ content: 'Queue is empty.', flags: 64 });
        }

        let queueString = queue.size > 0
          ? queue.tracks.map((track, i) => `${i + 1}. [${track.title}](${track.uri}) - ${formatDuration(track.length)}`).slice(0, 10).join('\n')
          : 'No songs in queue';

        const queueEmbed = new EmbedBuilder()
          .setTitle('📜 Music Queue')
          .setDescription(`**Now Playing:**\n[${current.title}](${current.uri}) - ${formatDuration(current.length)}\n\n**Up Next:**\n${queueString}`)
          .setColor('#8A2BE2')
          .setFooter({ text: `${queue.size} songs in queue` });

        interaction.reply({ embeds: [queueEmbed], flags: 64 });
        break;
    }
  }
});

// Format duration helper
function formatDuration(duration) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor(duration / (1000 * 60 * 60));
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Register guild slash commands
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Set the bot's activity when it starts
  client.user.setActivity('Listening to tunes in Stellaris', { type: 'LISTENING' });

  const GUILD_ID = '1358804712018804916'; // Guild ID

  client.guilds.fetch(GUILD_ID)
    .then(guild => {
      guild.commands.set(Array.from(client.commands.values()).map(cmd => cmd.data));
      console.log('✅ Guild slash commands registered');
    })
    .catch(console.error);
});

// Login
client.login(process.env.DISCORD_TOKEN);
