const {
  ModalBuilder,
  Client,
  Interaction,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
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

    try {
      const modal = new ModalBuilder()
        .setCustomId("bioModal")
        .setTitle("Bio Modal");

      const yourNameInput = new TextInputBuilder()
        .setCustomId("bio-name-input")
        .setLabel("Enter your name")
        .setStyle(TextInputStyle.Short);

      const BioInput = new TextInputBuilder()
        .setCustomId("bio-data-input")
        .setLabel("Enter your bio")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(800);

      const firstActionRow = new ActionRowBuilder().addComponents(
        yourNameInput
      );
      const secondActionRow = new ActionRowBuilder().addComponents(BioInput);

      modal.addComponents(firstActionRow, secondActionRow);

      await interaction.showModal(modal);

      const filter = (i) =>
        i.customId === "bioModal" && i.user.id === interaction.user.id;
      try {
        const modalInteraction = await interaction.awaitModalSubmit({
          filter,
          time: 1000 * 60 * 3,
        });

        const bioNameSubmission =
          modalInteraction.fields.getTextInputValue("bio-name-input");
        const bioDataSubmission =
          modalInteraction.fields.getTextInputValue("bio-data-input");

        await discordUsersRef.child(interaction.user.id).update({
          name: bioNameSubmission,
          bio: bioDataSubmission,
        });

        await modalInteraction.reply({
          content: "Bio submitted",
          ephemeral: true,
        });
      } catch (error) {
        if (error.code === "InteractionCollectorError") {
          console.log("Modal timed out");
          // No need to reply here as the interaction has already timed out
        } else {
          console.error(`Error processing modal submission: ${error}`);
          // Try to send a follow-up message instead of replying
          await interaction
            .followUp({
              content:
                "An error occurred while updating the bio. Please try again later.",
              ephemeral: true,
            })
            .catch(console.error);
        }
      }
    } catch (error) {
      console.error(`Error showing modal: ${error}`);
      // Only reply if we haven't interacted with the original interaction yet
      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content:
              "An error occurred while showing the bio modal. Please try again later.",
            ephemeral: true,
          })
          .catch(console.error);
      }
    }
  },

  name: "set-bio",
  description: "Set a public bio or check others' bios.",
};
