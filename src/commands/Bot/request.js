const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const { db } = require("../../index.js");
const interests = require("../../tags.json");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const discordUsersRef = db.ref("discord-users");

    const targetInterestId = interaction.options.getString("interest");
    const additionalDetails = interaction.options.getString("additional");
    const interest = interests.find((i) => i.id === targetInterestId);

    if (!interest) {
      await interaction.reply({
        content: "Invalid interest provided.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Interest: ${interest.name}`,
      ephemeral: true,
    });

    // Fetch all users from the database
    const snapshot = await discordUsersRef.once("value");
    const users = snapshot.val() || {};

    // Filter users based on interest and status
    const matchingUsers = Object.keys(users).filter((userId) => {
      const user = users[userId];
      console.log(`Processing user ${userId}:`, user);

      if (user.status !== "enabled" || !user.tags) {
        console.log(
          `User ${userId} skipped: status=${user.status}, tags=${user.tags}`
        );
        return false;
      }

      // Ensure user.tags is an array and check if the user has the target interest in their tags
      const userTags = Object.keys(user.tags);
      console.log(`User ${userId} tags:`, userTags);
      return userTags.includes(targetInterestId);
    });

    // Log matching users
    console.log(`Matching users for interest ${interest.name}:`, matchingUsers);

    // Send DM to each matching user
    for (const userId of matchingUsers) {
      try {
        const user = await client.users.fetch(userId);
        await user.send(
          `You have a new request matching your interest (${interest.name}): ${additionalDetails}`
        );
        console.log(`Sent DM to user ${userId}`);
      } catch (error) {
        console.error(`Failed to send DM to user ${userId}: ${error.message}`);
      }
    }
  },

  name: "request",
  description: "Make a request to strangers matching your tags",
  options: [
    {
      name: "interest",
      description: "Choose interest you want to make request.",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: true,
    },
    {
      name: "additional",
      description: "Fill additional details you want to send strangers",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
};
