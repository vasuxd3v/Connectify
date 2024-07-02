const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */

  callback: async (client, interaction) => {
    const mainEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🌟 Bot Help 🌟")
      .setDescription(
        "Welcome to the bot help center! Please select one of the options below to learn more about using the bot."
      )
      .setThumbnail("https://i.imgur.com/n5l3SJv.png") // Add an appropriate thumbnail image
      .setTimestamp();

    const mainRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("basic_help")
        .setLabel("📚 Basic Bot Help")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("request_help")
        .setLabel("🔧 Request/Connection Help")
        .setStyle(ButtonStyle.Success)
    );

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [mainRow],
      ephemeral: true,
    });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "basic_help") {
        const basicHelpEmbed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🛠 Basic Bot Commands")
          .setDescription("Here's a list of basic commands you can use:")
          .addFields(
            { name: "🔹 set-bio", value: "Set your bio" },
            { name: "🔹 bio", value: "View your bio" },
            {
              name: "🔹 tags",
              value:
                "Set your tags (you can view your selected tags by using `/bio` command)",
            },
            { name: "🔹 suggestions", value: "Give suggestions" },
            { name: "🔹 report", value: "Report a user" },
            { name: "🔹 history", value: "Check previous connection history" },
            { name: "🔹 ping", value: "Check bot's ping" },
            { name: "🔹 request", value: "Make a connection request" },
            {
              name: "🔹 request-status",
              value: "Change your request status",
            }
          )
          .setFooter({
            text: "Bot Commands",
            iconURL: "https://i.imgur.com/yfv7hvi.png",
          });

        const commandRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("usage_steps")
            .setLabel("📝 How to Use")
            .setStyle(ButtonStyle.Success)
        );

        await i.update({ embeds: [basicHelpEmbed], components: [commandRow] });
      } else if (i.customId === "request_help") {
        const requestHelpEmbed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("📞 Request and Connection Help")
          .setDescription("Here's how to use the /request command:")
          .addFields(
            { name: "Step 1", value: "Use the `/request` command" },
            { name: "Step 2", value: "Select an interest category" },
            { name: "Step 3", value: "Provide additional details" },
            {
              name: "Example",
              value: "`/request`  `<Movies>`  `<Want to watch Harry Potter>`",
            },
            {
              name: "What happens next?",
              value:
                "The bot will send a request to users with matching interests. When someone `accepts`, you'll be notified in DMs with their bio.",
            },
            {
              name: "Chatting",
              value:
                "You can chat with the accepter through bot DMs. Use `s.` as a prefix for your messages.",
            },
            {
              name: "Revealing usernames",
              value:
                "When both parties agree, you can click the `**Reveal Username**` button to continue communication outside the bot.",
            }
          )
          .setFooter({
            text: "Connection Help",
            iconURL: "https://i.imgur.com/rRlqvBV.png",
          });

        await i.update({ embeds: [requestHelpEmbed], components: [] });
      } else if (i.customId === "usage_steps") {
        const usageStepsEmbed = new EmbedBuilder()
          .setColor("#ff00ff")
          .setTitle("📑 How to Use the Bot")
          .setDescription("Follow these steps to get started:")
          .addFields(
            {
              name: "Step 1",
              value:
                "Use `/set-bio` command and enter your name and about /n **caution**: (don't enter your `Discord username`). You can see your bio by using `/bio` command.",
            },
            {
              name: "Step 2",
              value:
                "Use `/tags` command and select `set-tags`, then select tags related to your interests.",
            },
            {
              name: "Step 3",
              value:
                "Use `/request-status` and change it to **enable** so that you can get requests from strangers according to your interests.",
            }
          )
          .setFooter({
            text: "Usage Steps",
            iconURL: "https://i.imgur.com/yfv7hvi.png",
          });

        await i.update({ embeds: [usageStepsEmbed], components: [] });
      }
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(console.error);
    });
  },

  name: "help",
  description: "Get help on how to use the bot",
};
