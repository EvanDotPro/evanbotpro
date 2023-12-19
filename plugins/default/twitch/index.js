const tmiClient = require('tmi.js').client;
const PluginInterface = require('../../../src/pluginInterface');

class TwitchPlugin extends PluginInterface {
  init() {
    this.twitchClient = new tmiClient({
     options: { debug: false },
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
        var chanToJoin = tags.username;
        if (tags.username === process.env.TWITCH_ADMIN.toLowerCase() && args.length === 1) {
          chanToJoin = args[0].replace('#','').replace('@','').toLowerCase();
        }

        var isJoined = await this.__redis.SADD('ebp:' + process.env.TWITCH_USERNAME + ':twitch-channels', chanToJoin);
        if (!isJoined) {
          this.twitchClient.say(botChan, `[v2] I'm already in @${chanToJoin}'s channel. Twitch has me shadowbanned though, so I might need to be VIP or mod.`);
          return;
        }
        this.twitchClient.join(tags.username);
        this.twitchClient.say(botChan, `[v2] Okay, I've joined @${chanToJoin}'s channel.`);
        return;
      }

      if (command === 'leave' && channel === botChan) {
        var chanToLeave = tags.username;
        if (tags.username === process.env.TWITCH_ADMIN.toLowerCase() && args.length === 1) {
          chanToLeave = args[0].replace('#','').replace('@','').toLowerCase();
        }

        var isRemoved = await this.__redis.SREM('ebp:' + process.env.TWITCH_USERNAME + ':twitch-channels', chanToLeave);
        if (!isRemoved) {
          this.twitchClient.say(botChan, `[v2] I'm not in @${chanToLeave}'s channel.`);
          return;
        }
        this.twitchClient.part(chanToLeave);
        this.twitchClient.say(botChan, `[v2] Okay, I've left @${chanToLeave}'s channel.`);
        return;
      }

      if (command === 'v2test') {
        this.twitchClient.say(channel, 'This is EBP v2 speaking.');
        return;
      }

      this.__centralEventEmitter.emit('messageReceived', {
        platform: 'twitch',
        channel: channel,
        username: tags['display-name'],
        message: message,
        twitchClient: this.twitchClient
      });
    });
  }

  async unload() {
    await this.twitchClient.disconnect();
    delete this.twitchClient;
  }
}

module.exports = TwitchPlugin;
