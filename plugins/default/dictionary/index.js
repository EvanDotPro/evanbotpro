const PluginInterface = require('../../../src/pluginInterface');
const https = require('node:https');

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function(response) {
      var data = '';
      response.on('data', function (chunk) {
          data += chunk;
      });
      response.on('end', async function () {
        resolve(JSON.parse(data));
      });
      response.on('error', async function (error) {
        reject(error);
      });
    });
  });
}

class DictionaryPlugin extends PluginInterface {
  init() {
    this.__centralEventEmitter.on('messageReceived', this.onMessage.bind(this));
  }

  async onMessage(msg) {
    var args    = msg.message.slice(1).split(' ');
    var command = args.shift().toLowerCase();

    if (command === 'define' && args.length > 0) {
      var defResponse = await doRequest(`https://api.dictionaryapi.dev/api/v2/entries/en/${args[0]}`);
      if (defResponse.title === 'No Definitions Found') {
        var responseText = `The dictionary plugin source (dictionaryapi.com) does not have an entry for '${args[0]}'.`;
      } else {
        console.log(defResponse);
        var responseText = `${defResponse[0]['word']} (${defResponse[0]['meanings'][0]['partOfSpeech']}) ${defResponse[0]['phonetic'] || ''} - ${defResponse[0]['meanings'][0]['definitions'][0]['definition']}`;
      }
      msg.twitchClient.say(msg.channel, `${responseText}`);
      return;
    }
  }

  unload() {
    this.__centralEventEmitter.removeListener('messageReceived', this.onMessage);
  }
}

module.exports = DictionaryPlugin;
