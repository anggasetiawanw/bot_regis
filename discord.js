require('dotenv').config();
const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
const sql = require('mssql');
const express = require('express'); // Add Express for HTTP server

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
const dbConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  port: parseInt(process.env.SQL_PORT, 10),
  options: {
    encrypt: true, // Aktifkan jika menggunakan koneksi SSL
    trustServerCertificate: true, // Bypass sertifikat SSL jika diperlukan
  },
};

// Fungsi untuk terhubung ke database
async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1); // Exit if database connection fails
  }
}

// Inisialisasi bot Discord
const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// Event: Bot siap digunakan
client.on(Events.ClientReady, (readyClient) => {
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
  
});

// Event: Ketika menerima pesan
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith('!register')) {
    const args = message.content.split(' ').slice(1);

    if (args.length < 2) {
      message.reply('Please provide a username and password.');
    } else {
      const username = args[0];
      const password = args[1];

      const pool = await sql.connect(dbConfig);
      const user_count = await pool
        .request()
        .input('discord_id', sql.VarChar, message.author.id)
        .query(
          'SELECT COUNT(*) AS user_count FROM Accounts WHERE discord_id = @discord_id'
        );
      if (user_count.recordset[0].user_count > 1) {
        message.reply(
          'You have already registered the maximum number of accounts.'
        );
      } else {
        const result = await registerAccount(
          username,
          password,
          message.author.id
        );
        if (result === 0) {
          message.reply('You have been successfully registered!');
        } else if (result === 1) {
          message.reply('Account already exists.');
        } else if (result === 3) {
          message.reply(
            "You are not authorized to change this account's password."
          );
        } else {
          message.reply('An error occurred while registering.');
        }
      }
    }
  }
});

// Fungsi untuk registrasi akun
async function registerAccount(username, password, discordId) {
  try {
    const pool = await sql.connect(dbConfig);
    const resultRegister = await pool
      .request()
      .input('AccountName', sql.VarChar, username)
      .input('NxLoginPwd', sql.VarChar, password)
      .input('DiscordID', sql.VarChar, discordId)
      .execute('_BOT_DISCORD_AKUN');

    return resultRegister.recordset[0][''];
  } catch (err) {
    console.error('Error during registration:', err);
    return -1;
  }
}

async function countPlayerOnline() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      DECLARE @selectPlayer int = (SELECT COUNT(*) FROM DNAuth where CertifyingStep = 2 ) ;
      DECLARE @totalPlayer int  = @selectPlayer;

      -- Return the result
      SELECT @TotalPlayer AS TotalPlayer;
    `);
    if (result.recordset && result.recordset.length > 0) {
      const { SelectPlayer, TotalPlayer } = result.recordset[0];
      if (SelectPlayer !== null) {
        return TotalPlayer;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  } catch (error) {
    console.error('Error executing query:', error);
    return -1;
  }
}

// Jalankan bot
connectToDatabase().then(() => {
  client.login(process.env.DISCORD_BOT_TOKEN);
});
