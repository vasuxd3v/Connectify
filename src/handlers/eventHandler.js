const path = require("path");
const getAllFiles = require("../utils/getAllFiles");
const tags = require("./../tags.json");

module.exports = (client) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    eventFiles.sort((a, b) => a > b);

    const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    client.on("interactionCreate", (interaction) => {
      if (!interaction.isAutocomplete()) return;
      if (interaction.commandName !== "request") return;

      const focusedValue = interaction.options.getFocused();
      const filteredChoices = tags.filter((interest) =>
        interest.name.toLowerCase().startsWith(focusedValue.toLowerCase())
      );

      const results = filteredChoices.map((choice) => {
        return {
          name: `${choice.name}`,
          value: choice.id,
        };
      });
      interaction.respond(results.slice(0, 25)).catch(() => {});
    });

    client.on(eventName, async (arg) => {
      for (const eventFile of eventFiles) {
        const eventFuction = require(eventFile);
        await eventFuction(client, arg);
      }
    });
  }
};
