const {
  ModalBuilder,
  Client,
  Interaction,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ApplicationCommandOptionType,
} = require("discord.js");
const { db } = require("../../index.js");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    const modal = new ModalBuilder()
      .setCustomId("reportModal")
      .setTitle("Report a User");

    const userIdInput = new TextInputBuilder()
      .setCustomId("reportedUserId")
      .setLabel("User ID")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId("reportReason")
      .setLabel("Reason for report")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const screenshotInput = new TextInputBuilder()
      .setCustomId("screenshotLink")
      .setLabel("screenshot(imagurLink)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
    const secondActionRow = new ActionRowBuilder().addComponents(reasonInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(
      screenshotInput
    );

    modal.addComponents(firstActionRow, secondActionRow, fourthActionRow);

    await interaction.showModal(modal);

    // Handle modal submit interaction
    const handleModalSubmit = async (modalInteraction) => {
      if (modalInteraction.customId !== "reportModal") return;

      await modalInteraction.deferReply({ ephemeral: true });

      try {
        const reportedUserId =
          modalInteraction.fields.getTextInputValue("reportedUserId");
        const reportReason =
          modalInteraction.fields.getTextInputValue("reportReason");
        const screenshotLink =
          modalInteraction.fields.getTextInputValue("screenshotLink");

        // Validate User ID
        if (!/^\d+$/.test(reportedUserId)) {
          throw new Error(
            "Invalid User ID. Please enter a valid Discord User ID."
          );
        }

        // Validate screenshot URL if provided
        if (screenshotLink && !isValidUrl(screenshotLink)) {
          throw new Error(
            "Invalid screenshot URL. Please provide a valid URL."
          );
        }

        const reportId = Date.now().toString();
        const reportData = {
          id: reportId,
          reportedUserId: reportedUserId,
          reporterId: modalInteraction.user.id,
          reporterTag: modalInteraction.user.tag,
          reason: reportReason,
          screenshot: screenshotLink,
          timestamp: Date.now(),
        };

        // Save report to database
        await db.ref("reports").child(reportId).set(reportData);

        // Send report to designated channel
        const reportChannel = client.channels.cache.get("1257353752822939681");
        if (reportChannel) {
          const reportEmbed = new EmbedBuilder()
            .setTitle(`New User Report (ID: ${reportId})`)
            .setColor("#FF0000")
            .addFields(
              { name: "Reported User ID", value: reportedUserId },
              { name: "Reason", value: reportReason },
              {
                name: "Reporter",
                value: `${modalInteraction.user.tag} (${modalInteraction.user.id})`,
              },
              { name: "Time", value: new Date().toLocaleTimeString() },
              { name: "Date", value: new Date().toLocaleDateString() }
            )
            .setTimestamp();

          if (screenshotLink) {
            reportEmbed.setImage(screenshotLink);
          }

          await reportChannel.send({ embeds: [reportEmbed] });
        }

        await modalInteraction.editReply({
          content:
            "Your report has been submitted successfully. Thank you for helping keep our community safe.",
          ephemeral: true,
        });
      } catch (error) {
        await modalInteraction.editReply({
          content: `An error occurred: ${error.message}`,
          ephemeral: true,
        });
      }
    };

    client.on("interactionCreate", async (modalInteraction) => {
      if (modalInteraction.isModalSubmit()) {
        await handleModalSubmit(modalInteraction);
      }
    });
  },

  name: "report",
  description: "Report a user",
};

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
