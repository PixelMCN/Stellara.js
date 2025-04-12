// README.md - Documentation
# Discord Music Bot with Lavalink

A feature-rich Discord music bot using Discord.js and Lavalink for high-quality music playback.

## Features

- High-quality music playback using Lavalink
- Support for YouTube, Spotify, SoundCloud, and more
- Dynamic embeds with playback controls
- Queue management system
- Slash commands integration
- Volume controls

## Prerequisites

- Node.js 16.9.0 or newer
- Java 13 or newer (for Lavalink server)
- A Discord bot token
- Lavalink server instance

## Setup Instructions

1. Clone this repository
2. Install dependencies with `npm install`
3. Configure your `.env` file with your Discord token and Lavalink settings
4. Start your Lavalink server
5. Run the bot with `npm start`

## Lavalink Setup

1. Download the latest Lavalink.jar from the [Lavalink releases page](https://github.com/freyacodes/Lavalink/releases)
2. Create an `application.yml` file in the same directory with your Lavalink configuration
3. Run Lavalink using `java -jar Lavalink.jar`

## Commands

- `/play <query>` - Play a song or add it to the queue
- `/skip` - Skip the current song
- `/stop` - Stop playing and clear the queue
- `/pause` - Pause or resume the current song
- `/queue` - Display the current music queue
- `/volume <0-100>` - Set the music volume
- `/nowplaying` - Display information about the currently playing song

## License

MIT