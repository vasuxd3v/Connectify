const {
  Client,
  Interaction,
  ChannelType,
  ApplicationCommandOptionType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const { db } = require("../../index.js");
const interests = require("../../tags.json");

const activeRequests = new Set();
const cooldowns = new Map();

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    // Implement cooldown
    const cooldownTime = 10 * 60 * 1000; // 5 minutes in milliseconds
    const now = Date.now();
    const cooldownEnd = cooldowns.get(interaction.user.id) || 0;

    if (now < cooldownEnd) {
      const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
      await interaction.reply({
        content: `Please wait ${remainingTime} seconds before using this command again.`,
        ephemeral: true,
      });
      return;
    }

    const discordUsersRef = db.ref("discord-users");
    const targetInterestId = interaction.options.getString("interest");
    const additionalDetails = interaction.options.getString("additional");
    const interest = interests.find((i) => i.id === targetInterestId);

    if (!interest) {
      await interaction.reply({
        content: "❌ Invalid interest provided.",
        ephemeral: true,
      });
      return;
    }

    const requestId = interaction.id;
    const requesterId = interaction.user.id;

    await interaction.reply({
      content: `🚀 Your request for interest: ${interest.name} has been sent. Waiting for responses...`,
      ephemeral: true,
    });

    const snapshot = await discordUsersRef.once("value");
    const users = snapshot.val() || {};

    const matchingUsers = Object.keys(users)
      .filter((userId) => {
        const user = users[userId];
        const conditions = {
          notRequester: userId !== requesterId,
          enabled: user.status === "enabled",
          hasTags: !!user.tags,
          hasInterestTag: user.tags && user.tags[interest.name],
        };
        return Object.values(conditions).every(Boolean);
      })
      .slice(0, 100);

    const activeUsersCount = matchingUsers.length;
    const sentRequestsCount = matchingUsers.length;

    if (matchingUsers.length === 0) {
      await interaction.editReply({
        content: "No users with matching tags found.",
        ephemeral: true,
      });
      return;
    }

    // Create and send the initial embed
    const requestEmbed = new EmbedBuilder()
      .setTitle("Interest Request Sent")
      .setDescription(
        `Your request for interest: ${interest.name} has been sent.`
      )
      .addFields(
        { name: "Interest", value: interest.name },
        { name: "Additional Details", value: additionalDetails },
        { name: "Active Users with Tag", value: activeUsersCount.toString() },
        { name: "Requests Sent", value: sentRequestsCount.toString() }
      )
      .setColor("#00AAFF")
      .setTimestamp();

    await interaction.editReply({
      embeds: [requestEmbed],
      ephemeral: true,
    });

    activeRequests.add(interaction.user.id);
    cooldowns.set(interaction.user.id, now + cooldownTime);

    activeRequests.add(interaction.user.id);

    const requestState = {
      accepted: false,
      acceptedUserId: null,
      chatStarted: false,
      revealUsernameClicks: new Set(),
      startChatClicks: new Set(),
    };

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
        const requesterBio = users[requesterId].bio || "No bio provided";

        const matchEmbed = new EmbedBuilder()
          .setTitle("Anonymous Match Request")
          .setDescription(`Interest: ${interest.name}`)
          .addFields(
            { name: "Requester's Bio", value: requesterBio },
            { name: "Additional Details", value: additionalDetails }
          );

        const message = await user.send({
          embeds: [matchEmbed],
          components: [buttons],
        });
        messages[userId] = message;
      } catch (error) {
        console.error(`Failed to send DM to user ${userId}: ${error.message}`);
      }
    }

    const handleRevealUsername = async (interaction) => {
      const userId = interaction.user.id;
      requestState.revealUsernameClicks.add(userId);

      if (requestState.revealUsernameClicks.size === 2) {
        const requester = await client.users.fetch(requesterId);
        const accepter = await client.users.fetch(requestState.acceptedUserId);

        await requester.send(`The other user's username is: ${accepter.tag}`);
        await accepter.send(`The other user's username is: ${requester.tag}`);

        await interaction.update({
          content: `Usernames revealed! The chat has ended.`,
          components: [],
        });

        // Save match information to each user's history
        const matchData = {
          matchedUsername: accepter.tag,
          interestName: interest.name,
          matchDate: new Date().toISOString(),
          additionalDetails: additionalDetails,
        };

        const requesterHistoryRef = discordUsersRef.child(
          `${requesterId}/history`
        );
        await requesterHistoryRef.push(matchData);

        const accepterMatchData = {
          ...matchData,
          matchedUsername: requester.tag,
        };
        const accepterHistoryRef = discordUsersRef.child(
          `${requestState.acceptedUserId}/history`
        );
        await accepterHistoryRef.push(accepterMatchData);

        // Stop forwarding messages
        client.removeListener("messageCreate", messageHandler);
        activeRequests.delete(interaction.user.id);
      } else {
        await interaction.update({
          content: "Waiting for the other user to reveal their username...",
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`reveal_${requestId}`)
                .setLabel("Reveal Username")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
            ),
          ],
        });
      }
    };

    // Add this function to create a typing indicator
    const simulateTyping = async (user) => {
      try {
        const channel = await user.createDM();
        await channel.sendTyping();
      } catch (error) {
        console.error(`❌ Failed to simulate typing: ${error.message}`);
      }
    };

    // Modify handleStartChat to include typing indicator
    const handleStartChat = async (interaction) => {
      const userId = interaction.user.id;
      requestState.startChatClicks.add(userId);

      if (requestState.startChatClicks.size === 2) {
        requestState.chatStarted = true;
        const requester = await client.users.fetch(requesterId);
        const accepter = await client.users.fetch(requestState.acceptedUserId);

        const revealButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`reveal_${requestId}`)
            .setLabel("👀 Reveal Username")
            .setStyle(ButtonStyle.Primary)
        );

        await simulateTyping(requester);
        await simulateTyping(accepter);

        setTimeout(async () => {
          await requester.send({
            content:
              "🎉 Chat started! You can now communicate through bot DMs. Use `.s` to send messages to accepter",
            components: [revealButton],
          });
          await accepter.send({
            content:
              "🎉 Chat started! You can now communicate through bot DMs. Use `.s` to send messages to requester",
            components: [revealButton],
          });
        }, 2000);

        await interaction.update({
          content: "🚀 Chat started! You can now communicate through bot DMs.",
          components: [],
        });
      } else {
        await interaction.update({
          content: "⏳ Waiting for the other user to start the chat...",
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`startchat_${requestId}`)
                .setLabel("Start Chat")
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
            ),
          ],
        });
      }
    };

    const forwardMessage = async (message) => {
      if (!requestState.chatStarted) {
        return;
      }

      const isRequester = message.author.id === requesterId;
      const recipientId = isRequester
        ? requestState.acceptedUserId
        : requesterId;

      try {
        const recipient = await client.users.fetch(recipientId);

        if (message.content.startsWith(".s")) {
          const content = message.content.slice(2).trim();
          const embed = new EmbedBuilder()
            .setDescription(content)
            .setColor(isRequester ? "#FF6B6B" : "#4ECDC4")
            .setAuthor({
              name: isRequester ? "✉️ From Requester" : "✉️ From Accepter",
            })
            .setFooter({ text: "connectify" })
            .setTimestamp();

          await recipient.send({ embeds: [embed] });
        } else {
          await recipient.send(`💬 Anonymous: ${message.content}`);
        }
      } catch (error) {
        console.error(`❌ Failed to forward message: ${error.message}`);
        message.author.send("❌ Failed to send message to your match.");
      }
    };

    const messageHandler = (message) => {
      if (message.author.bot) {
        return;
      }

      // Check if the message is from a DM channel
      if (message.channel.type !== ChannelType.DM) {
        return;
      }

      if (
        message.author.id !== requesterId &&
        message.author.id !== requestState.acceptedUserId
      ) {
        console.log("Ignoring message from unrelated user");
        return;
      }
      forwardMessage(message);
    };

    client.on("messageCreate", messageHandler);

    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      const [action, reqId] = interaction.customId.split("_");

      if (reqId !== requestId) return;

      if (action === "accept") {
        if (!requestState.accepted) {
          requestState.accepted = true;
          requestState.acceptedUserId = interaction.user.id;

          const requesterBio = users[requesterId].bio || "No bio provided";
          const accepterBio =
            users[interaction.user.id].bio || "No bio provided";

          const startChatButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`startchat_${requestId}`)
              .setLabel("Start Chat")
              .setStyle(ButtonStyle.Success)
          );

          // Send bio and start chat button to accepter
          await interaction.update({
            content: "You accepted the request. Here's the requester's bio:",
            embeds: [new EmbedBuilder().setDescription(requesterBio)],
            components: [startChatButton],
          });

          // Send bio and start chat button to requester
          const requester = await client.users.fetch(requesterId);
          await requester.send({
            content:
              "Your request has been accepted. Here's the accepter's bio:",
            embeds: [new EmbedBuilder().setDescription(accepterBio)],
            components: [startChatButton],
          });

          // Update messages for other users
          for (const userId of matchingUsers) {
            if (userId !== interaction.user.id) {
              try {
                const message = messages[userId];
                await message.edit({
                  content: "Request accepted by another user.",
                  components: [],
                });
              } catch (error) {
                console.error(
                  `Failed to update DM to user ${userId}: ${error.message}`
                );
              }
            }
          }
        } else {
          await interaction.reply({
            content: "Request already accepted.",
            ephemeral: true,
          });
        }
      } else if (action === "deny") {
        await interaction.update({
          content: "Request denied",
          components: [],
        });
      } else if (action === "reveal") {
        await handleRevealUsername(interaction);
      } else if (action === "startchat") {
        await handleStartChat(interaction);
      }
    });

    // Clean up event listeners after 24 hours
    const cleanup = () => {
      client.removeListener("messageCreate", messageHandler);
      activeRequests.delete(requesterId);
    };

    setTimeout(cleanup, 24 * 60 * 60 * 1000);
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
