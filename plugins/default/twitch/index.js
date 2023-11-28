const tmiClient = require('tmi.js').client;
const PluginInterface = require('../../../src/pluginInterface');

class TwitchPlugin extends PluginInterface {
  init() {
    this.twitchClient = new tmiClient({
     options: { debug: true },
      identity: {
        username: process.env.TWITCH_USERNAME,
        password: 'oauth:' + process.env.TWITCH_TOKEN
      },
      channels: [process.env.TWITCH_USERNAME]
    });

    this.twitchClient.connect();

    this.twitchClient.on('connected', async () => {
      var chatsToJoin = await this.__redis.SMEMBERS('ebp:' + process.env.TWITCH_USERNAME + ':twitch-channels') || [];
      for (var i=0; i<chatsToJoin.length; i++) {
        this.twitchClient.join(chatsToJoin[i]);
      }
    });

    this.twitchClient.on('message', async (channel, tags, message, self) => {
      var botChan = '#' + process.env.TWITCH_USERNAME;
      var args    = message.slice(1).split(' ');
      var command = args.shift().toLowerCase();

      if (command === 'join' && channel === botChan) {
        var isJoined = await this.__redis.SADD('ebp:' + process.env.TWITCH_USERNAME + ':twitch-channels', tags.username);
        if (!isJoined) {
          this.twitchClient.say(botChan, `[v2] I'm already in your channel, @${tags.username}. Twitch has me shadowbanned though, so you might need to VIP or mod me.`);
          return;
        }
        this.twitchClient.join(tags.username);
        this.twitchClient.say(botChan, `[v2] Okay, I've joined your channel, @${tags.username}.`);
        return;
      }

      if (command === 'leave' && channel === botChan) {
        var isRemoved = await this.__redis.SREM('ebp:' + process.env.TWITCH_USERNAME + ':twitch-channels', tags.username);
        if (!isRemoved) {
          this.twitchClient.say(botChan, `[v2] I'm not in your channel, @${tags.username}.`);
          return;
        }
        this.twitchClient.join(tags.username);
        this.twitchClient.say(botChan, `[v2] Okay, I've left your channel, @${tags.username}.`);
        return;
      }

      if (command === 'v2test') {
        this.twitchClient.say(channel, 'This is evanbotpro v2 speaking.');
        return;
      }

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
