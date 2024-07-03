const {
  Client,
  Interaction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
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
    const userId = interaction.user.id;

    const categories = {
      gaming: [
        { label: "League of Legends", value: "League of Legends" },
        { label: "Minecraft", value: "Minecraft" },
        { label: "Valorant", value: "Valorant" },
        { label: "Fortnite", value: "Fortnite" },
        { label: "Call of Duty: Warzone", value: "Call of Duty: Warzone" },
        { label: "Among Us", value: "Among Us" },
        { label: "Grand Theft Auto V", value: "Grand Theft Auto V" },
        { label: "Apex Legends", value: "Apex Legends" },
        {
          label: "Counter-Strike: Global Offensive",
          value: "Counter-Strike: Global Offensive",
        },
        { label: "PUBG Mobile", value: "PUBG Mobile" },
        { label: "Candy Crush Saga", value: "Candy Crush Saga" },
        { label: "Subway Surfers", value: "Subway Surfers" },
        { label: "Clash of Clans", value: "Clash of Clans" },
        { label: "Brawl Stars", value: "Brawl Stars" },
        { label: "Genshin Impact", value: "Genshin Impact" },
        { label: "Pokémon GO", value: "Pokémon GO" },
        { label: "Roblox", value: "Roblox" },
        { label: "Garena Free Fire", value: "Garena Free Fire" },
        { label: "The Sims 4", value: "The Sims 4" },
        { label: "Red Dead Redemption 2", value: "Red Dead Redemption 2" },
        { label: "Cyberpunk 2077", value: "Cyberpunk 2077" },
        { label: "Elden Ring", value: "Elden Ring" },
        { label: "Hades", value: "Hades" },
      ],
      coding: [
        { label: "Python", value: "Python" },
        { label: "Javascript", value: "Javascript" },
        { label: "C++", value: "C++" },
        { label: "Rust", value: "Rust" },
        { label: "Java", value: "Java" },
        { label: "Go", value: "Go" },
        { label: "C#", value: "C#" },
        { label: "Swift", value: "Swift" },
        { label: "Kotlin", value: "Kotlin" },
        { label: "PHP", value: "PHP" },
        { label: "Ruby", value: "Ruby" },
        { label: "Scala", value: "Scala" },
        { label: "TypeScript", value: "TypeScript" },
        { label: "Lua", value: "Lua" },
        { label: "Assembly", value: "Assembly" },
        { label: "HTML", value: "HTML" },
        { label: "CSS", value: "CSS" },
        { label: "SQL", value: "SQL" },
        { label: "Bash", value: "Bash" },
        { label: "PowerShell", value: "PowerShell" },
        { label: "R", value: "R" },
        { label: "MATLAB", value: "MATLAB" },
        { label: "Dart", value: "Dart" },
        { label: "Groovy", value: "Groovy" },
        { label: "Clojure", value: "Clojure" },
      ],
      entertainment: [
        { label: "Movies", value: "Movies" },
        { label: "Music", value: "Music" },
        { label: "TV Shows", value: "TV Shows" },
        { label: "Podcasts", value: "Podcasts" },
        { label: "Books", value: "Books" },
        { label: "Video Games", value: "Video Games" },
        { label: "Board Games", value: "Board Games" },
        { label: "Live Music", value: "Live Music" },
        { label: "Comedy", value: "Comedy" },
        { label: "Concerts", value: "Concerts" },
        { label: "Sporting Events", value: "Sporting Events" },
        { label: "Stand-up Comedy", value: "Stand-up Comedy" },
        { label: "Stargazing", value: "Stargazing" },
      ],
      activities: [
        { label: "Reading", value: "Reading" },
        { label: "Gaming", value: "Gaming" },
        { label: "Traveling", value: "Traveling" },
        { label: "Cooking", value: "Cooking" },
        { label: "Gardening", value: "Gardening" },
        { label: "Painting", value: "Painting" },
        { label: "Drawing", value: "Drawing" },
        { label: "Photography", value: "Photography" },
        { label: "Dancing", value: "Dancing" },
        { label: "Yoga", value: "Yoga" },
        { label: "Meditation", value: "Meditation" },
        { label: "Volunteering", value: "Volunteering" },
        { label: "Learning a new language", value: "Learning a new language" },
        { label: "Learning a new skill", value: "Learning a new skill" },
        {
          label: "Spending time with friends",
          value: "Spending time with friends",
        },
      ],
      study: [
        { label: "Math", value: "Math" },
        { label: "Science", value: "Science" },
        { label: "History", value: "History" },
        { label: "Literature", value: "Literature" },
        { label: "Biology", value: "Biology" },
        { label: "Chemistry", value: "Chemistry" },
        { label: "Physics", value: "Physics" },
        { label: "Psychology", value: "Psychology" },
        { label: "Philosophy", value: "Philosophy" },
        { label: "Computer Science", value: "Computer Science" },
        { label: "Engineering", value: "Engineering" },
        { label: "Business", value: "Business" },
        { label: "Design", value: "Design" },
      ],
    };

    const createSelectMenu = (category, options) => {
      return new StringSelectMenuBuilder()
        .setCustomId(`select_${category}`)
        .setPlaceholder(category.charAt(0).toUpperCase() + category.slice(1))
        .setMinValues(0)
        .setMaxValues(options.length)
        .addOptions(
          options.map((option) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(option.label)
              .setValue(option.value)
          )
        );
    };

    const actionRows = Object.keys(categories).map((category) => {
      const selectMenu = createSelectMenu(category, categories[category]);
      return new ActionRowBuilder().addComponents(selectMenu);
    });

    const config = interaction.options.getString("config");

    if (config === "clear-tags") {
      // Clear all tags for the user
      await discordUsersRef.child(userId).child("interest").remove();
      await interaction.reply({
        content: "All your tags have been cleared.",
        ephemeral: true,
      });
    } else if (config === "set-tags") {
      // Display set-tags menu and allow user to update interests
      interaction.reply({
        components: actionRows,
        ephemeral: true,
      });

      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: ComponentType.StringSelect,
        time: 60000 * 2,
      });

      collector.on("collect", async (i) => {
        const category = i.customId.split("_")[1];
        const selectedValues = i.values;

        const updates = selectedValues.reduce((acc, value) => {
          acc[`interest/${category}/${value}`] = true;
          acc[`tags/${value}`] = true;
          return acc;
        }, {});

        await discordUsersRef.child(userId).update(updates);

        await i.update({
          content: `Your ${category} interests have been updated.`,
          components: actionRows,
        });
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          interaction.editReply({
            content: "No selections were made.",
            components: [],
          });
        }
      });
    } else if (config === "info") {
      // Create buttons for each category
      const categoryButtons = Object.keys(categories).map((category) =>
        new ButtonBuilder()
          .setCustomId(`info_${category}`)
          .setLabel(category.charAt(0).toUpperCase() + category.slice(1))
          .setStyle(ButtonStyle.Primary)
      );

      const buttonRow = new ActionRowBuilder().addComponents(categoryButtons);

      await interaction.reply({
        content: "Select a category to view tag information:",
        components: [buttonRow],
        ephemeral: true,
      });

      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        const selectedCategory = i.customId.split("_")[1];

        // Fetch tag information
        const snapshot = await discordUsersRef.once("value");
        const users = snapshot.val();

        const tagCounts = {};
        const activeTagCounts = {};

        Object.entries(users).forEach(([userId, user]) => {
          if (user.tags) {
            Object.keys(user.tags).forEach((tag) => {
              if (
                categories[selectedCategory].some((item) => item.value === tag)
              ) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                const member = interaction.guild.members.cache.get(userId);
                if (
                  member &&
                  member.presence &&
                  member.presence.status !== "offline"
                ) {
                  activeTagCounts[tag] = (activeTagCounts[tag] || 0) + 1;
                }
              }
            });
          }
        });

        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(
            `${
              selectedCategory.charAt(0).toUpperCase() +
              selectedCategory.slice(1)
            } Tag Information`
          )
          .setDescription(
            `Here's the current status of ${selectedCategory} tags:`
          );

        categories[selectedCategory].forEach(({ value }) => {
          const count = tagCounts[value] || 0;
          const activeCount = activeTagCounts[value] || 0;
          embed.addFields({
            name: value,
            value: `Total: ${count} users | Active: ${activeCount} users`,
            inline: true,
          });
        });

        await i.update({ embeds: [embed], components: [buttonRow] });
      });

      collector.on("end", () => {
        interaction.editReply({
          content: "Tag information session ended.",
          components: [],
        });
      });
    }
  },

  name: "tags",
  description: "Tags Configuration and Information",
  options: [
    {
      name: "config",
      description: "Set, Clear, or Get Info about tags.",
      type: ApplicationCommandOptionType.String,
      choices: [
        {
          name: "set-tags",
          description: "Set tags for incoming requests",
          value: "set-tags",
        },
        {
          name: "clear-tags",
          description: "Clear all tags.",
          value: "clear-tags",
        },
        {
          name: "info",
          description: "Get information about tag usage.",
          value: "info",
        },
      ],
      required: true,
    },
  ],
};
