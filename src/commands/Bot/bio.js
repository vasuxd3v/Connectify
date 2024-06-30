const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const { db } = require("../../index.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */

  callback: async (client, interaction) => {
    const discordUsersRef = db.ref("discord-users");

    let userId;
    let username;

    if (interaction.options && interaction.options.getUser("user")) {
      const user = interaction.options.getUser("user");
      userId = user.id;
      username = user.username;
    } else {
      userId = interaction.user.id;
      username = interaction.user.username;
    }

    const snapshot = await discordUsersRef.child(userId).once("value");
    const userData = snapshot.val();

    if (userData) {
      let statusEmoji = "Not set";
      if (userData.status === "enabled") {
        statusEmoji = "🟢 Enabled";
      } else if (userData.status === "disabled") {
        statusEmoji = "🔴 Disabled";
      } else {
        statusEmoji = userData.status || "Not set";
      }

      const interests = userData.interest || {};
      const categories = [
        "gaming",
        "coding",
        "activities",
        "entertainment",
        "study",
      ];
      const interestFields = categories
        .filter((category) => interests[category]) // Only include categories with selected interests
        .map((category) => ({
          name: `**${category.charAt(0).toUpperCase() + category.slice(1)}**`,
          value: Object.keys(interests[category]).join(", "),
        }));

      const bioEmbed = new EmbedBuilder()
        .setAuthor({
          name: `Viewed by - ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ size: 256 }),
        })
        .setThumbnail("https://i.imgur.com/n5l3SJv.png")
        .addFields(
          { name: "**Name**", value: userData.name || "Not set" },
          { name: "**Bio**", value: userData.bio || "Not set" },
          { name: "**Request Status**", value: statusEmoji },
          ...interestFields
        )
        .setColor("Blurple")
        .setFooter({
          text: "Connectify ✨ ",
        });

      await interaction.reply({ embeds: [bioEmbed] });
    } else {
      await interaction.reply({
        content: "No bio found for this user.",
        ephemeral: true,
      });
    }
  },

  name: "bio",
  description: "View user's bio",
  options: [
    {
      name: "user",
      description: "Check bio of any user with userId",
      type: ApplicationCommandOptionType.User,
      required: false,
    },
  ],
};
