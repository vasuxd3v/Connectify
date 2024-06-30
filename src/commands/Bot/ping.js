const { Client, Interaction, EmbedBuilder } = require("discord.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */

  callback: async (client, interaction) => {
    await interaction.deferReply(); // Defer the reply to handle ping calculation

    const reply = await interaction.fetchReply(); // Get the reply object after deferring
    const ping = reply.createdTimestamp - interaction.createdTimestamp;

    // Create the Embed
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "Client Ping", value: `${ping}ms`, inline: true },
        {
          name: "API Latency",
          value: `${Math.round(client.ws.ping)}ms`,
          inline: true,
        }
      );

    interaction.editReply({ embeds: [embed] }); // Send the embed
  },

  name: "ping",
  description: `Bot's Ping`,
};
