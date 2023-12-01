const Discord = require('discord.js');
//import { Client as discordClient, Intents as discordIntents, MessageAttachment as discordAttachment} from 'discord.js';
const PluginInterface = require('../../../src/pluginInterface');

class DiscordPlugin extends PluginInterface {
  init() {
    var discordClient = new Discord.Client({ intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages] });

    discordClient.login(process.env.DISCORD_TOKEN);

    discordClient.on('ready', () => {
      console.log('Discord ready!');
      discordClient.on('messageCreate', message => {
        this.__centralEventEmitter.emit('messageReceived', {
          platform: 'discord',
          username: message.author.username,
          message: message.content
        });
      });
    });
  }

  async unload() {
    delete this.discordClient;
  }
}

module.exports = DiscordPlugin;
