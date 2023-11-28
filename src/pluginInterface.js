class PluginInterface {
  constructor(pluginName, pluginPath, loadPluginsFromDirectory, centralEventEmitter, redis) {
    if (this.constructor === PluginInterface) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    console.log('PLUGIN LOADING:');
    console.log('  name: ' + pluginName);
    console.log('  path: ' + pluginPath);
    this.__name = pluginName;
    this.__path = pluginPath;
    this.__loadPluginsFromDirectory = loadPluginsFromDirectory.bind(this);
    this.__centralEventEmitter = centralEventEmitter;
    this.__redis = redis;
    this.init();
  }

  init() {
    throw new Error('init method must be implemented by the plugin');
  }

  unload() {
    console.log('Plugin unloaded but has no unload() method.');
  }
}

module.exports = PluginInterface;
