/* This code snippet is setting up a Discord bot using the Discord.js library and integrating it with
Firebase Realtime Database. Here's a breakdown of what each part of the code is doing: */
const { Client, IntentsBitField } = require("discord.js");
const eventHandler = require("./handlers/eventHandler");
require("dotenv").config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const admin = require("firebase-admin");
const serviceAccount = require("../creds.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://discord-bots-425705-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

module.exports = {
  db,
};

eventHandler(client);

client.login(process.env.BOT_TOKEN);
