const { DB_CONFIG } = require('../config/config');

const sql = require('mssql');
// Fungsi untuk registrasi akun
async function registerAccount(username, password, discordId) {
  try {
    const pool = await sql.connect(DB_CONFIG);
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
    const pool = await sql.connect(DB_CONFIG);
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

const countAccount = async (discordId) => {
  try {
    const pool = await sql.connect(DB_CONFIG);
    const result = await pool
      .request()
      .input('discord_id', sql.VarChar, discordId)
      .query(
        'SELECT COUNT(*) AS user_count FROM Accounts WHERE discord_id = @discord_id'
      );

    return result.recordset[0].user_count;
  } catch (error) {
    console.error('Error executing query:', error);
    return -1;
  }
}

module.exports = { registerAccount, countPlayerOnline, countAccount };
