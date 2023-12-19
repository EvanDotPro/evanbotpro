const PluginInterface = require('../../../src/pluginInterface');

class LoggerPlugin extends PluginInterface {
  init() {
    this.__centralEventEmitter.on('messageReceived', this.onMessage);
  }

  onMessage(msg) {
    //console.log(`Received ${msg.platform} message: ${JSON.stringify(msg)}`);
  }

  unload() {
    this.__centralEventEmitter.removeListener('messageReceived', this.onMessage);
  }
}

module.exports = LoggerPlugin;
