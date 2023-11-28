const fs = require('fs');
const { plugins, loadPluginsFromDirectory } = require('./src/pluginLoader');
const dotenv = require('dotenv');

dotenv.config({ override: true });

// Catch any other errors as a last effort to prevent crashes
process.on('uncaughtException', function (error) {
  console.log('Top level uncaught exception...');
  console.error(error);
});

let pluginPaths = process.env.PLUGIN_PATHS.replace(/; */g,';').split(';');
for (let i=0; i<pluginPaths.length; i++) {
  console.log('Loading plugins from path: ' + pluginPaths[i]);
  loadPluginsFromDirectory(pluginPaths[i]);
}

const reloadEnv = () => {
  const envConfig = dotenv.parse(fs.readFileSync('.env'))

  for (const key in envConfig) {
    process.env[key] = envConfig[key]
  }
}
