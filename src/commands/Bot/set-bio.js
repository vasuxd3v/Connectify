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

      modal.addComponents(firstActionRow, secondActionRow); // Add the action rows to the modal

      await interaction.showModal(modal);

      // Use a modal submit collector to handle modal submission
      const filter = (i) =>
        i.customId === "bioModal" && i.user.id === interaction.user.id;
      const modalInteraction = await interaction.awaitModalSubmit({
        filter,
        time: 1000 * 60 * 3,
      });

      await modalInteraction.deferReply({ ephemeral: true });

      const bioNameSubmission =
        modalInteraction.fields.getTextInputValue("bio-name-input");
      const bioDataSubmission =
        modalInteraction.fields.getTextInputValue("bio-data-input");

      await discordUsersRef.child(interaction.user.id).update({
        name: bioNameSubmission,
        bio: bioDataSubmission,
      });

      await modalInteraction.editReply("Bio submitted");
    } catch (error) {
      console.error(`Error showing modal: ${error}`);
      interaction.reply({
        content:
          "An error occurred while updating the status. Please try again later.",
        ephemeral: true,
      });
    }
  },

  name: "set-bio",
  description: "Set a public bio or check others' bios.",
};
