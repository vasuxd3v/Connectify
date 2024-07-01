const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} = require("discord.js");
const { db } = require("../../index.js");

let suggestionCounter = 0;

module.exports = {
  callback: async (client, interaction) => {
    async function initializeSuggestionCounter() {
      const counterSnapshot = await db.ref("suggestionCounter").once("value");
      suggestionCounter = counterSnapshot.val() || 0;
    }

    initializeSuggestionCounter();
    if (interaction.options.getSubcommand() === "submit") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("make_suggestion")
          .setLabel("Make Suggestion")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("my_suggestions")
          .setLabel("My Suggestions")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content: "Choose an action:",
        components: [row],
        ephemeral: true,
      });
    } else if (interaction.options.getSubcommand() === "approve") {
      if (
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        await interaction.reply({
          content: "You do not have permission to approve suggestions.",
          ephemeral: true,
        });
        return;
      }

      const suggestionId = interaction.options.getString("id");
      const suggestionRef = db.ref("suggestions").child(suggestionId);
      const snapshot = await suggestionRef.once("value");
      const suggestion = snapshot.val();

      if (!suggestion) {
        await interaction.reply({
          content: "Suggestion not found.",
          ephemeral: true,
        });
        return;
      }

      await suggestionRef.update({ approved: true });

      const user = await client.users.fetch(suggestion.userId);
      await user.send(
        `Your suggestion (ID: ${suggestionId}) has been approved!`
      );

      await interaction.reply({
        content: `Suggestion ${suggestionId} has been approved and the user has been notified.`,
        ephemeral: true,
      });
    }
    // Handle button interactions
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === "make_suggestion") {
        const modal = new ModalBuilder()
          .setCustomId("suggestionModal")
          .setTitle("Submit a Suggestion");

        const suggestionInput = new TextInputBuilder()
          .setCustomId("suggestionInput")
          .setLabel("What is your suggestion?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(
          suggestionInput
        );
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
      } else if (interaction.customId === "my_suggestions") {
        const userSuggestions = await db
          .ref("suggestions")
          .orderByChild("userId")
          .equalTo(interaction.user.id)
          .once("value");

        const suggestions = userSuggestions.val();

        if (!suggestions) {
          await interaction.reply({
            content: "You haven't made any suggestions yet.",
            ephemeral: true,
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle("Your Suggestions")
          .setColor("#00AAFF");

        Object.entries(suggestions).forEach(([id, suggestion]) => {
          embed.addFields({
            name: `ID: ${id}`,
            value: `${suggestion.content}\nStatus: ${
              suggestion.approved ? "Approved" : "Pending"
            }`,
          });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    });

    // Handle modal submit interaction
    client.on("interactionCreate", async (interaction) => {
      if (!interaction.isModalSubmit()) return;
      if (interaction.customId === "suggestionModal") {
        try {
          // Defer the reply immediately
          await interaction.deferReply({ ephemeral: true });

          suggestionCounter++;
          const suggestionId = `SUG${String(suggestionCounter).padStart(
            4,
            "0"
          )}`;

          const suggestion =
            interaction.fields.getTextInputValue("suggestionInput");

          const suggestionData = {
            id: suggestionId,
            userId: interaction.user.id,
            username: interaction.user.tag,
            content: suggestion,
            timestamp: Date.now(),
            approved: false,
          };

          await db.ref("suggestions").child(suggestionId).set(suggestionData);
          await db.ref("suggestionCounter").set(suggestionCounter);

          const suggestionChannel = client.channels.cache.get(
            "1257353800776417402"
          );
          if (suggestionChannel) {
            const embed = new EmbedBuilder()
              .setTitle(`New Suggestion (ID: ${suggestionId})`)
              .setDescription(suggestion)
              .addFields(
                { name: "User ID", value: interaction.user.id },
                { name: "Username", value: interaction.user.tag },
                { name: "Time", value: new Date().toLocaleTimeString() },
                { name: "Date", value: new Date().toLocaleDateString() }
              )
              .setColor("#00AAFF")
              .setTimestamp();

            await suggestionChannel.send({ embeds: [embed] });
          }

          // Edit the deferred reply
          await interaction.editReply({
            content: "Your suggestion has been submitted successfully!",
            ephemeral: true,
          });
        } catch (error) {
          console.error("Error handling suggestion submission:", error);
          // Attempt to send an error message, but don't throw if it fails
          try {
            await interaction.editReply({
              content:
                "An error occurred while submitting your suggestion. Please try again later.",
              ephemeral: true,
            });
          } catch (replyError) {
            console.error("Error sending error message:", replyError);
          }
        }
      }
    });
  },

  name: "suggest",
  description: "Submit or approve a suggestion",
  type: ApplicationCommandOptionType.SubcommandGroup,
  options: [
    {
      name: "submit",
      type: ApplicationCommandOptionType.Subcommand,
      description: "Submit a new suggestion or view your suggestions",
    },
    {
      name: "approve",
      type: ApplicationCommandOptionType.Subcommand,
      devOnly: true,
      description: "Approve a suggestion (Developers only)",
      options: [
        {
          name: "id",
          type: ApplicationCommandOptionType.String,
          description: "Approve a suggestion (Developers only)",
          required: true,
        },
      ],
    },
  ],
};
