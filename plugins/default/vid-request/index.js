const PluginInterface = require('../../../src/pluginInterface');
const yts = require( 'yt-search' );
const ytext = require('youtube-ext');

class VidRequestPlugin extends PluginInterface {
  init() {
    this.__centralEventEmitter.on('messageReceived', this.onMessage.bind(this));
  }

  async onMessage(msg) {
    var args    = msg.message.slice(1).split(' ');
    var command = args.shift().toLowerCase();

    // Set the fallback playlist
    if (command === 'setfallbackplaylist' && args.length > 0) {
      var playlistData = await yts( { listId: args[0] } );
      if (('title' in playlistData)) {
        await this.__redis.SET(`video-request-fallback:${msg.channel}`, args[0]);
        msg.twitchClient.say(msg.channel, `Okay, I've set the ${playlistData.title} playlist as the fallback.`);
      } else {
        msg.twitchClient.say(msg.channel, `I couldn't find that playlist, sorry dude.`);
      }

      return;
    }

    // The currentsong command
    if (command === 'currentsong') {
      var currentSong = await this.__redis.LRANGE(`video-requests:${msg.channel}`, 0, 0);
      currentSong = JSON.parse(currentSong);
      msg.twitchClient.say(msg.channel, `The currently playing song is ${currentSong.title}, requested by ${currentSong.requestedBy}.`);
      return;
    }


    // The SR command
    if (command === 'sr') {
      console.log('Song request received: ' + args.join(' '));
      try {
        var vidQuery = args.join(' ').replace('https://youtu.be/', 'https://youtube.com/watch?v=');
        vidQuery = vidQuery.replace(/\?si=.+$/i, '');
        var songDetails = (await yts(vidQuery)).all[0];
        songDetails.requestedBy = msg.username;
      } catch(errorsToIgnore) {
        console.log('Yeah, there were some errors, but we don\'t care.');
      }
      this.__redis.RPUSH(`video-requests:${msg.channel}`, JSON.stringify(songDetails));
      var queueLength = await this.__redis.LLEN(`video-requests:${msg.channel}`);
      msg.twitchClient.say(msg.channel, `Okay, I've added "${songDetails.title}" (${songDetails.timestamp}) to the queue in position #${queueLength}!`);
      return;
    }



  }

  unload() {
    this.__centralEventEmitter.removeListener('messageReceived', this.onMessage);
  }
}

module.exports = VidRequestPlugin;
