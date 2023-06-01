const fs = require('fs');
const tmiClient = require('tmi.js').client;
const { plugins, loadPluginsFromDirectory } = require('./src/pluginLoader');
const dotenv = require('dotenv');

dotenv.config({ override: true });

// Catch any other errors as a last effort to prevent crashes
process.on('uncaughtException', function (error) {
  console.log('Top level uncaught exception...');
  console.error(error);
});

const twitchClient = new tmiClient({
  options: { debug: true },
  channels: process.env.TWITCH_CHANNELS.replace(/; */g, ';').split(';'),
});

twitchClient.connect();

let pluginPaths = process.env.PLUGIN_PATHS.replace(/; */g,';').split(';');
console.log('Plugin paths:');
console.log(pluginPaths);
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

twitchClient.on('message', async (channel, tags, message, self) => {
  reloadEnv();
  for (let pluginName in plugins) {
    try {
      plugins[pluginName].onMessage(channel, tags, message, plugins);
    } catch(error) {
      console.error('UNHANDLED PLUGIN EXCEPTION: ' + pluginName);
      console.error(error);
    }
  }
});
