const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const registerButton = new ButtonBuilder()
  .setCustomId('register')
  .setLabel('Register Account')
  .setStyle(ButtonStyle.Primary);

const buttonsRow = new ActionRowBuilder().addComponents(
  registerButton,
  // historyButton
);

module.exports = { buttonsRow };
