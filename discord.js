require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  ActivityType,
  Collection,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');

const sql = require('mssql');
const express = require('express'); // Add Express for HTTP server
const { DB_CONFIG, CHANNEL_ID } = require('./config/config');
const { countPlayerOnline } = require('./utils/functions_sql');
const { buttonsRow } = require('./components/button');
const fs = require('fs');
const path = require('path');
// Initialize Express
const app = express();
const PORT = process.env.PORT || 8000; // Default to 8000 or use an environment variable

// Simple health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('Bot is running.');
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Konfigurasi koneksi database

// Fungsi untuk terhubung ke database
async function connectToDatabase() {
  try {
    const pool = await sql.connect(DB_CONFIG);
    console.log('Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit if database connection fails
  }
}

// Inisialisasi bot Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
client.commands = new Collection();
const commandFiles = fs
  .readdirSync(path.join(__dirname, 'commands'))
  .filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.customId, command);
}

// Event: Bot siap digunakan
client.on(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);

  let odd = true;
  setInterval(async () => {
    if (odd) {
      client.user.setActivity({
        name: 'Legend Dragon Nest',
        type: ActivityType.Playing,
      });
    } else {
      try {
        const totalPlayer = await countPlayerOnline();
        if (totalPlayer > 0) {
          client.user.setActivity({
            name: `${totalPlayer} player online`,
            type: ActivityType.Watching,
          });
        } else {
          client.user.setActivity('No player online', { type: 'WATCHING' });
        }
      } catch (error) {
        console.error('Error executing query:', error);
      }
    }
    odd = !odd;
  }, 30000);

  const channelId = CHANNEL_ID;
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error(`Channel with ID ${channelId} not found.`);
    return;
  }

  // Send buttons to the channel
  const embed = new EmbedBuilder()
    .setColor('#FFD700') // Gold color
    .setTitle('🐦 LEGEND DRAGON NEST ACCOUNT PORTAL 🐦')
    .setDescription(
      '**Welcome to Legend Account portal!**\n' +
        'Manage your Legend Dragon Nest account\n\n' +
        '**REGISTER YOUR ACCOUNT**\n' +
        '→ Create your Legend Dragon Nest profile now!\n' +
        '→ Each Discord account can register up to **2 Legend Dragon Nest accounts**.\n' +
        '→ Account names must be between **5 and 10 characters**.\n' +
        '→ Passwords must be between **6 and 10 characters**.\n\n'
    )
    .setImage(
      'https://cdn.discordapp.com/attachments/1329091833204310031/1330146337982779403/LOADING_SCREEN_BDN.png?ex=6792d98f&is=6791880f&hm=951463ec0a812ecbb6a5c470f0d006920d13f92e3bb5643dd9803a71c64266d6&'
    ) // Replace with your image URL
    .setFooter({
      text: 'Powered by CAT',
      iconURL:
        'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWl6d3lwaHR0MXBob3Nic21hbzU4NDg0NWRzdnhvYnl2Nzk5NHpkYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/S1SnLg08CxnUGqyqha/giphy.gif',
    }); // Replace with your icon URL
  await channel.send({ embeds: [embed], components: [buttonsRow] });
});
// Interaction handler
client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    const command = client.commands.get(interaction.customId);
    if (command) {
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error while executing this action!',
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  } else if (interaction.isModalSubmit()) {
    const command = client.commands.get(interaction.customId);
    if (command) {
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error while executing this action!',
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  }
});
// Jalankan bot
connectToDatabase().then(() => {
  client.login(process.env.DISCORD_BOT_TOKEN);
});
