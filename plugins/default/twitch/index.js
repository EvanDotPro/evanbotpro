const tmiClient = require('tmi.js').client;
const PluginInterface = require('../../../src/pluginInterface');

class TwitchPlugin extends PluginInterface {
  init() {
    this.twitchClient = new tmiClient({
      options: { debug: true },
      channels: process.env.TWITCH_CHANNELS.replace(/; */g, ';').split(';'),
    });

    this.twitchClient.connect();

    this.twitchClient.on('message', async (channel, tags, message, self) => {
      this.__centralEventEmitter.emit('messageReceived', {
        platform: 'twitch',
        username: tags['display-name'],
        message: message
      });
    });
  }

  async unload() {
    await this.twitchClient.disconnect();
    delete this.twitchClient;
  }
}

module.exports = TwitchPlugin;
