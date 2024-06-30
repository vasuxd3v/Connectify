const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
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

    const requestId = interaction.id; // Unique ID for the request
    const requesterId = interaction.user.id; // ID of the user who made the request

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

      if (user.status !== "enabled" || !user.tags) {
        return false;
      }

      const userTags = Object.keys(user.tags);
      return userTags.includes(interest.name);
    });

    // Store request state
    const requestState = {
      accepted: false,
    };

    // Send DM to each matching user
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept_${requestId}`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`deny_${requestId}`)
        .setLabel("Deny")
        .setStyle(ButtonStyle.Danger)
    );

    const messages = {};

    for (const userId of matchingUsers) {
      try {
        const user = await client.users.fetch(userId);
        const message = await user.send({
          content: `You have a new request matching your interest (${interest.name}): ${additionalDetails}`,
          components: [buttons],
        });
        messages[userId] = message;
      } catch (error) {
        console.error(`Failed to send DM to user ${userId}: ${error.message}`);
      }
    }

    // Event listener for button interactions
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      const [action, reqId] = interaction.customId.split("_");

      if (reqId !== requestId) return;

      if (action === "accept") {
        if (!requestState.accepted) {
          requestState.accepted = true;

          // Disable buttons for the user who accepted
          try {
            const message = messages[interaction.user.id];
            await message.edit({
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`accept_${reqId}`)
                    .setLabel("Accept")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                  new ButtonBuilder()
                    .setCustomId(`deny_${reqId}`)
                    .setLabel("Deny")
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
                ),
              ],
            });
          } catch (error) {
            console.error(
              `Failed to update DM to user ${interaction.user.id}: ${error.message}`
            );
          }

          // Disable buttons for all other users
          for (const userId of matchingUsers) {
            if (userId !== interaction.user.id) {
              try {
                const message = messages[userId];
                await message.edit({
                  content: "Request accepted by other user.",
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setCustomId(`accept_${reqId}`)
                        .setLabel("Accept")
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                      new ButtonBuilder()
                        .setCustomId(`deny_${reqId}`)
                        .setLabel("Deny")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                    ),
                  ],
                });
              } catch (error) {
                console.error(
                  `Failed to update DM to user ${userId}: ${error.message}`
                );
              }
            }
          }

          // Notify the original requester
          try {
            const requester = await client.users.fetch(requesterId);
            await requester.send("Your request has been accepted.");
          } catch (error) {
            console.error(
              `Failed to notify requester ${requesterId}: ${error.message}`
            );
          }

          // Respond to the user who accepted
          await interaction.reply({
            content:
              "You are now connected to requesters and can communicate further through bot dm's.",
          });
        } else {
          await interaction.reply({
            content: "Request already accepted.",
            ephemeral: true,
          });
        }
      } else if (action === "deny") {
        try {
          const message = messages[interaction.user.id];
          await message.edit({
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(`accept_${reqId}`)
                  .setLabel("Accept")
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId(`deny_${reqId}`)
                  .setLabel("Deny")
                  .setStyle(ButtonStyle.Danger)
                  .setDisabled(true)
              ),
            ],
          });
        } catch (error) {
          console.error(
            `Failed to update DM to user ${interaction.user.id}: ${error.message}`
          );
        }

        await interaction.reply({ content: "Request denied", ephemeral: true });
      }
    });
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
