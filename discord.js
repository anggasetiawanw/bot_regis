require('dotenv').config();
const { Client, GatewayIntentBits, Events, Partials } = require('discord.js');
const sql = require('mssql');

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
    process.exit(1); // Keluar jika koneksi gagal
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
});

// Event: Ketika menerima pesan
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Perintah "!register"
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
      if (user_count.recordset[0].user_count > 2) {
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

  // Perintah "!change-password"
  // if (message.content.startsWith('!change-password')) {
  //   const args = message.content.split(' ').slice(1);

  //   if (args.length < 2) {
  //     message.reply('Please provide your username and new password.');
  //   } else {
  //     const username = args[0];
  //     const newPassword = args[1];

  //     const result = await changePassword(
  //       username,
  //       newPassword,
  //       message.author.id
  //     );
  //     if (result === 0) {
  //       message.reply('Your password has been successfully changed!');
  //     } else if (result === 1) {
  //       message.reply('Account not found.');
  //     } else {
  //       message.reply('An error occurred while changing your password.');
  //     }
  //   }
  // }
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
      .execute('_BOT_DISCORD_AKUN'); // Ganti dengan prosedur SQL Anda

    console.log('resultRegister', resultRegister.recordset[0]['']);

    return resultRegister.recordset[0]['']; // Mengembalikan nilai output dari prosedur
  } catch (err) {
    console.error('Error during registration:', err);
    return -1; // Menunjukkan kesalahan
  }
}

// Fungsi untuk mengganti password
async function changePassword(username, newPassword, discordId) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input('AccountName', sql.VarChar, username)
      .input('NxLoginPwd', sql.VarChar, newPassword)
      .input('DiscordID', sql.VarChar, discordId)
      .execute('_BOT_DISCORD_CPASS'); // Ganti dengan prosedur SQL Anda

    return result.returnValue; // Mengembalikan nilai output dari prosedur
  } catch (err) {
    console.error('Error during password change:', err);
    return -1; // Menunjukkan kesalahan
  }
}

// Jalankan bot
connectToDatabase().then(() => {
  client.login(process.env.DISCORD_BOT_TOKEN);
});
