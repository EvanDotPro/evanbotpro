# Evan's Bot (aka evanbotpro)

**Authors:** Evan Coury, GPT-4

So, this is just a bot I built for myself and some Twitch friends. A lot of people ask me for the code, so yeah, here it is.


----

### Installation

- Install node.js.
- Install and start redis.
- Clone this repository.
- Copy `.env-default` to `.env` and set the appropriate values.
- Run `node ./app.js`

### Environment Variables (.env)

- **PLUGIN_PATHS** - List of paths to load plugins from, separated by semi-colons, relative to the path you run `app.js` from. E.g. `PLUGIN_PATHS="./plugins/default;./plugins/custom"`.
- **TWITCH_CHANNELS** - List of Twitch channels for the bot to join, separated by semi-colons. This is temporary, the list is going to be stored in Redis and dynamic.

### Creating a Plugin

Create `./plugins/custom/helloworld/index.js`:

```
const PluginInterface = require('../../../src/pluginInterface');

class HelloWorld extends PluginInterface {
  onMessage(channel, tags, message, plugins) {
    console.log(`Hello world! This plugin has received a message on channel ${channel} with tags ${JSON.stringify(tags)}: ${message}`);
  }
}

module.exports = HelloWorld;
```

You can also check out `./plugins/default` for more examples.

### Reloading Plugins

If you're working on a plugin and want a change to take effect without restarting the bot, the bot MUST be in your Twitch channel, and you must be logged in as your Twitch user. If you've done that, you should just be able to type `!reloadplugins` in your own chat and you'll see the plugins reload in the console.

### Project Status

I'm currently in the process of porting over all of the existing evanbotpro functionality to this new plugin system. This is basically just a foundation currently.

### Warnings

-- **The plugin API is subject to change.**
-- **Currently values are reloaded from the `.env` file every time a message is received by the bot. This means if you save your `.env` file with bad values or syntax, you can crash the bot.**

### License

My bot is available under the MIT license. Basically, you can use this code for fun, profit, or whatever you want as long as you retain the original license + copyright notice in the [LICENSE](./LICENSE) file and don't try to pass it off as your own or hide that the code came from here.
