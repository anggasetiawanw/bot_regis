module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  // DB_CONFIG: {
  //   host: process.env.DB_HOST,
  //   username: process.env.DB_USER,
  //   password: process.env.DB_PASS,
  //   database: process.env.DB_NAME,
  // },
  CHANNEL_ID: process.env.CHANNEL_ID,
  DB_CONFIG : {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    port: parseInt(process.env.SQL_PORT, 10),
    options: {
      encrypt: true, // Aktifkan jika menggunakan koneksi SSL
      trustServerCertificate: true, // Bypass sertifikat SSL jika diperlukan
    },
  }
};