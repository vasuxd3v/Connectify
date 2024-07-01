const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { db } = require("../../index.js");

const ITEMS_PER_PAGE = 10;

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: false });

    const discordUsersRef = db.ref("discord-users");
    const userSnapshot = await discordUsersRef
      .child(interaction.user.id)
      .once("value");
    const userData = userSnapshot.val();

    if (!userData || !userData.history) {
      await interaction.editReply("You don't have any connection history yet.");
      return;
    }

    const history = Object.entries(userData.history);
    const totalConnections = history.length;

    const generateEmbed = (page) => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const currentPageHistory = history.slice(startIndex, endIndex);

      const embed = new EmbedBuilder()
        .setTitle("Your Connection History")
        .setDescription(`Total connections: ${totalConnections}`)
        .setColor("#00AAFF")
        .setFooter({
          text: `Page ${page}/${Math.ceil(totalConnections / ITEMS_PER_PAGE)}`,
        });

      currentPageHistory.forEach(([id, data], index) => {
        embed.addFields({
          name: `Connection ${startIndex + index + 1}`,
          value: `User: ${data.matchedUsername}\nInterest: ${
            data.interestName
          }\nDate: ${new Date(data.matchDate).toLocaleDateString()}`,
        });
      });

      return embed;
    };

    const generateButtons = (page) => {
      const row = new ActionRowBuilder();

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`prev_${page}`)
          .setLabel("Previous")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 1)
      );

      for (
        let i = 1;
        i <= Math.min(5, Math.ceil(totalConnections / ITEMS_PER_PAGE));
        i++
      ) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`page_${i}`)
            .setLabel(i.toString())
            .setStyle(i === page ? ButtonStyle.Success : ButtonStyle.Secondary)
        );
      }

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`next_${page}`)
          .setLabel("Next")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === Math.ceil(totalConnections / ITEMS_PER_PAGE))
      );

      return row;
    };

    const generateDetailsEmbed = (connectionData) => {
      return new EmbedBuilder()
        .setTitle("Connection Details")
        .setColor("#00AAFF")
        .addFields(
          { name: "Matched User", value: connectionData.matchedUsername },
          { name: "Interest", value: connectionData.interestName },
          {
            name: "Date",
            value: new Date(connectionData.matchDate).toLocaleString(),
          },
          {
            name: "Additional Details",
            value:
              connectionData.additionalDetails ||
              "No additional details provided",
          }
        );
    };

    let currentPage = 1;
    const message = await interaction.editReply({
      embeds: [generateEmbed(currentPage)],
      components: [generateButtons(currentPage)],
    });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        await i.reply({
          content: "You can't use these buttons.",
          ephemeral: true,
        });
        return;
      }

      const [action, value] = i.customId.split("_");

      if (action === "prev") {
        currentPage--;
      } else if (action === "next") {
        currentPage++;
      } else if (action === "page") {
        currentPage = parseInt(value);
      } else if (action === "view") {
        const connectionIndex = parseInt(value) - 1;
        const connectionData = history[connectionIndex][1];
        await i.update({
          embeds: [generateDetailsEmbed(connectionData)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("back")
                .setLabel("Back to List")
                .setStyle(ButtonStyle.Secondary)
            ),
          ],
        });
        return;
      } else if (action === "back") {
        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
        return;
      }

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });
    });

    collector.on("end", async () => {
      await interaction.editReply({ components: [] });
    });
  },

  name: "history",
  description: "View connected history",
};
