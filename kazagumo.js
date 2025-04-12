// kazagumo.js
const { Kazagumo, Plugins } = require('kazagumo');
const { Connectors } = require('shoukaku');
require('dotenv').config();

const nodes = [
  {
    name: 'main-node',
    url: process.env.LAVALINK_HOST, // e.g. lava-v3.ajieblogs.eu.org:443
    auth: process.env.LAVALINK_PASSWORD,
    secure: process.env.LAVALINK_HOST?.startsWith('https') || process.env.LAVALINK_HOST?.includes('443') // auto-detect
  }
];

module.exports = (client) => {
  return new Kazagumo(
    {
      defaultSearchEngine: 'youtube',
      plugins: [new Plugins.PlayerMoved(client)],
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      }
    },
    new Connectors.DiscordJS(client),
    nodes
  );
};
