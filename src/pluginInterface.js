class PluginInterface {
  constructor(pluginName, pluginPath, loadPluginsFromDirectory) {
    if (this.constructor === PluginInterface) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    console.log('PLUGIN LOADING:');
    console.log('  name: ' + pluginName);
    console.log('  path: ' + pluginPath);
    this.__name = pluginName;
    this.__path = pluginPath;
    this.__loadPluginsFromDirectory = loadPluginsFromDirectory.bind(this);
  }

  onMessage(channel, tags, message, plugins) {
    throw new Error('onMessage method must be implemented by the plugin');
  }
}

module.exports = PluginInterface;
