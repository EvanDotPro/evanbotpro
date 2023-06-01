const fs = require('fs');
const path = require('path');
const PluginInterface = require('./pluginInterface');

let plugins = {};

function loadPlugin(pluginName, pluginPath) {
  // Delete the cached module, if it exists
  delete require.cache[require.resolve(pluginPath)];

  // Load the plugin
  let pluginClass = require(pluginPath);

  // Ensure the plugin implements the required methods
  if (!(pluginClass.prototype instanceof PluginInterface)) {
    throw new Error(`The plugin '${pluginName}' does not implement the PluginInterface`);
  }

  let pluginInstance = new pluginClass(pluginName, pluginPath, loadPluginsFromDirectory);

  // Store the plugin in memory
  plugins[pluginName] = pluginInstance;
}

function reloadPlugin(pluginName) {
  let pluginPath = require.resolve(plugins[pluginName].__path);
  loadPlugin(pluginName, pluginPath);
}

function loadPluginsFromDirectory(dir) {
  // Read all files/directories in the given directory
  const pluginDirs = fs.readdirSync(dir);

  // Iterate over each file/directory
  for (const pluginName of pluginDirs) {
    const absolutePath = path.join(dir, pluginName);
    const stat = fs.statSync(absolutePath);

    // If this is a directory, assume it's a plugin and attempt to load it
    if (stat.isDirectory()) {
      // Assume the main file of the plugin is `index.js`
      // TODO: Only works with relative paths currently...
      console.log(absolutePath);
      const pluginPath = path.join('..', absolutePath, 'index.js');

      if (plugins[pluginName]) {
        console.log('Reloading plugin: ' + pluginName);
        reloadPlugin(pluginName);
      } else {
        console.log('Initially loading plugin: ' + pluginName);
        loadPlugin(pluginName, pluginPath);
      }
    }
  }
}

module.exports = {
  loadPlugin,
  reloadPlugin,
  plugins,
  loadPluginsFromDirectory
};
