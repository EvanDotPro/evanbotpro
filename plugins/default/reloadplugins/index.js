const PluginInterface = require('../../../src/pluginInterface');

class ReloadPlugins extends PluginInterface {
  onMessage(channel, tags, message, plugins) {
    if(tags.username === channel.replace('#','') && message === '!reloadplugins') {
      console.log('Reloading all plugins!');
      let pluginPaths = process.env.PLUGIN_PATHS.replace(/; */g,';').split(';');
      for (let i=0; i<pluginPaths.length; i++) {
        this.__loadPluginsFromDirectory(pluginPaths[i]);
      }
    }
  }
}

module.exports = ReloadPlugins;
