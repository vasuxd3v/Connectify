const {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  version,
} = require("discord.js");
const os = require("os");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */

  callback: async (client, interaction) => {
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Bot Information")
      .setDescription(
        "Click a button below to view specific information about the bot."
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("uptime")
        .setLabel("Uptime")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("servers")
        .setLabel("Server Count")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("members")
        .setLabel("Member Count")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("stats")
        .setLabel("Bot Stats")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("system")
        .setLabel("System Info")
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("all")
        .setLabel("All Information")
        .setStyle(ButtonStyle.Success)
    );

    const response = await interaction.reply({
      embeds: [embed],
      components: [row, row2],
    });

    const collector = response.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (i) => {
      if (i.user.id === interaction.user.id) {
        const newEmbed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle("Bot Information")
          .setTimestamp();

        const uptime = () => {
          let totalSeconds = client.uptime / 1000;
          let days = Math.floor(totalSeconds / 86400);
          totalSeconds %= 86400;
          let hours = Math.floor(totalSeconds / 3600);
          totalSeconds %= 3600;
          let minutes = Math.floor(totalSeconds / 60);
          let seconds = Math.floor(totalSeconds % 60);
          return `${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
        };

        const serverCount = client.guilds.cache.size;
        const memberCount = client.guilds.cache.reduce(
          (acc, guild) => acc + guild.memberCount,
          0
        );

        switch (i.customId) {
          case "uptime":
            newEmbed.addFields({ name: "Uptime", value: uptime() });
            break;
          case "servers":
            newEmbed.addFields({
              name: "Server Count",
              value: serverCount.toString(),
            });
            break;
          case "members":
            newEmbed.addFields({
              name: "Total Member Count",
              value: memberCount.toString(),
            });
            break;
          case "stats":
            newEmbed.addFields(
              { name: "Servers", value: serverCount.toString(), inline: true },
              { name: "Members", value: memberCount.toString(), inline: true },
              {
                name: "Channels",
                value: client.channels.cache.size.toString(),
                inline: true,
              },
              {
                name: "Discord.js Version",
                value: `v${version}`,
                inline: true,
              },
              { name: "Node.js Version", value: process.version, inline: true }
            );
            break;
          case "system":
            newEmbed.addFields(
              { name: "Platform", value: process.platform, inline: true },
              {
                name: "CPU Cores",
                value: os.cpus().length.toString(),
                inline: true,
              },
              {
                name: "Total Memory",
                value: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
                inline: true,
              },
              {
                name: "Free Memory",
                value: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
                inline: true,
              },
              {
                name: "CPU Usage",
                value: `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)}%`,
                inline: true,
              }
            );
            break;
          case "all":
            newEmbed.addFields(
              { name: "Uptime", value: uptime() },
              { name: "Server Count", value: serverCount.toString() },
              { name: "Total Member Count", value: memberCount.toString() },
              {
                name: "Channels",
                value: client.channels.cache.size.toString(),
              },
              { name: "Discord.js Version", value: `v${version}` },
              { name: "Node.js Version", value: process.version },
              { name: "Platform", value: process.platform },
              { name: "CPU Cores", value: os.cpus().length.toString() },
              {
                name: "Total Memory",
                value: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
              },
              {
                name: "Free Memory",
                value: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
              },
              {
                name: "CPU Usage",
                value: `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)}%`,
              }
            );
            break;
        }

        await i.update({ embeds: [newEmbed], components: [row, row2] });
      }
    });

    collector.on("end", () => {
      interaction.editReply({ components: [] }).catch(console.error);
    });
  },

  name: "info",
  description: "Additional information regarding bot.",
};
