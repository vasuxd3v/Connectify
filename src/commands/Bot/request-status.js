const {
     Client,
     Interaction,
     ApplicationCommandOptionType,
} = require("discord.js");
const { db } = require('../../index.js')

module.exports = {
     /**
      *
      * @param {Client} client
      * @param {Interaction} interaction
      */

     callback: async (client, interaction) => {
          const status = interaction.options.getString('status');
          const userId = interaction.user.id;

          const discordUsersRef = db.ref('discord-users');

          // Update the status in the database
          try {
               await discordUsersRef.child(userId).update({ status: status === '0' ? 'enabled' : 'disabled' });
               interaction.reply({
                    content: `Request status updated to ${status === '0' ? 'enabled' : 'disabled'}.`,
                    ephemeral: true // Only visible to the user
               });
          } catch (error) {
               console.error("Error updating request status:", error);
               interaction.reply({
                    content: "An error occurred while updating the status. Please try again later.",
                    ephemeral: true
               });
          }
     },

     name: "request-status",
     description: "enable/disable status for incoming requests.",
     options: [
          {
               name: "status",
               description: "set status for incoming requests",
               type: ApplicationCommandOptionType.String,
               choices: [
                    {
                         name: "enable",
                         value: '0'
                    },
                    {
                         name: "disable",
                         value: '1'
                    },
               ],
               required: true,
          },
     ],
};
