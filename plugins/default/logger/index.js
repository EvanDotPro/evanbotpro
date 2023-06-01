const PluginInterface = require('../../../src/pluginInterface');

class LoggerPlugin extends PluginInterface {
  onMessage(channel, tags, message, plugins) {
    console.log(`Received message on channel ${channel} with tags ${JSON.stringify(tags)}: ${message}`);
  }
}

module.exports = LoggerPlugin;
