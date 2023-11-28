const PluginInterface = require('../../../src/pluginInterface');

class ReloadPlugins extends PluginInterface {

  init() {
    this.boundOnMessage = this.onMessage.bind(this);
    this.__centralEventEmitter.on('messageReceived', this.boundOnMessage);
  }

  onMessage(msg) {
    if (msg.username === 'EvanDotPro' && msg.message === '!reloadplugins') {
      console.log('Reloading all plugins!');
      let pluginPaths = process.env.PLUGIN_PATHS.replace(/; */g,';').split(';');
      for (let i=0; i<pluginPaths.length; i++) {
        this.__loadPluginsFromDirectory(pluginPaths[i]);
      }
    }
  }

  unload() {
    this.__centralEventEmitter.removeListener('messageReceived', this.boundOnMessage);
  }
}

module.exports = ReloadPlugins;
