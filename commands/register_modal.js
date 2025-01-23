const e = require('express');
const { registerAccount, countAccount } = require('../utils/functions_sql');
const { MessageFlags } = require('discord.js');
module.exports = {
  data: { customId: 'register_modal' },
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;

    const username = interaction.fields.getTextInputValue('username');
    const password = interaction.fields.getTextInputValue('password');
    const discordId = interaction.user.id;

    // Save to database
    try {
      const user_count = await countAccount(discordId);
      if (user_count > 1) {
        interaction.reply({
          content:
            'You have already registered the maximum number of accounts.',

          flags: [MessageFlags.Ephemeral],
        });
      } else {
        const result = await registerAccount(username, password, discordId);
        if (result === 0) {
          interaction.reply({
            content: 'You have been successfully registered!',
            flags: [MessageFlags.Ephemeral],
          });
        } else if (result === 1) {
          interaction.reply({
            content: 'Account already exists.',
            flags: [MessageFlags.Ephemeral],
          });
        } else if (result === 3) {
          interaction.reply({
            content:
              "You are not authorized to change this account's password.",

            flags: [MessageFlags.Ephemeral],
          });
        } else {
          interaction.reply({
            content: 'Registration failed. Please try again later.',

            flags: [MessageFlags.Ephemeral],
          });
        }
      }
    } catch (error) {
      interaction.reply({
        content: 'Registration failed. You may already be registered.',

        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
