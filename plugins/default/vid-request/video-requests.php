<!DOCTYPE html>
<html>
<head>
<title>Video Requests</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body, html {
  font-family: sans-serif;
  margin: 0;
  height: 100%;
  overflow-y: hidden;
}
</style>
<script type="text/javascript" src="https://evan.pro/tmi.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js" integrity="sha512-894YE6QWD5I59HgZOGReFYm4dnWc1Qt5NtvYSaNcOP+u1T9qYdvdihz0PPSiiqn/+/3e7Jo4EaG7TubfWGUrMQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</head>
<body>
<div id="player"></div>
<script>
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player = false;
var isUsingFallbackPlaylist = false;

function dequeueVideo() {
  console.log('Dequeing the video...');
  console.log(isUsingFallbackPlaylist);
  if (!isUsingFallbackPlaylist) {
    $.getJSON('./video-request-queue.php?channel=evandotpro&remove', function(data) {
      getQueue();
    });
  } else {
    getQueue();
  }
}

function onPlayerStateChange(event) {
  console.log('PLAYER STATE CHANGED: ' + event.data);
  if (event.data == YT.PlayerState.ENDED) {
    dequeueVideo();
  }
  if (event.data === YT.PlayerState.CUED) {
    console.log('PLAYLIST CUED');
    player.setShuffle(true);
    //player.playVideoAt(0);
    player.nextVideo();
  }
}

function onPlayerReady() {
  if (isUsingFallbackPlaylist) {
    player.setShuffle(true);
    player.playVideoAt(0);
  } else {
    getQueue();
  }
}

function createPlayer(youtubeID) {
  var playerParams = {
    width: '100%',
    height: '100%',
    videoId: youtubeID,
    playerVars: {
      'playsinline': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  };
  if (isUsingFallbackPlaylist) {
    console.log('Loading playlist: ' + youtubeID);
    delete playerParams.videoId;
    playerParams.playerVars.listType = 'playlist';
    playerParams.playerVars.list = youtubeID;
  }
  player = new YT.Player('player', playerParams);
}


function switchVideo(youtubeID) {
  if (isUsingFallbackPlaylist) {
    console.log('Loading fallback playlist: ' + youtubeID);
    player.loadPlaylist(youtubeID);
  } else {
    console.log('Loading video by ID: ' + youtubeID);
    player.loadVideoById(youtubeID);
  }
}


const client = new tmi.Client({
  channels: ['<?= strtolower($_GET['channel']) ?>', 'evanbotpro']
});

client.connect();

function isMod(tags) {
  return !(tags.badges === null || !('moderator' in tags.badges));
}

function isStreamer(tags) {
  return (tags.username === '<?= strtolower($_GET['channel']) ?>');
}

function getQueue() {
  $.getJSON('./video-request-queue.php?channel=evandotpro&count=1', function(list) {
    if (list.length > 0) {
      isUsingFallbackPlaylist = false;
      switchVideo(list[0].videoId);
    } else {
      if (isUsingFallbackPlaylist) {
        console.log('Using fallback playlist, play next video');
        player.nextVideo();
        return;
      }
      $.getJSON('./video-request-queue.php?channel=evandotpro&fallback', function(fallback) {
        console.log('Queing fallback playlist: ' + fallback);
        isUsingFallbackPlaylist = true;
        player.cuePlaylist(fallback);
        setTimeout(function() {
          console.log('Playing next video after 2 seconds.');
          player.nextVideo();
        }, 2000);
      });
      //player.destroy();
      //player = false;
    }
  });
}


function onYouTubeIframeAPIReady() {
  createPlayer();
}

client.on('message', (channel, tags, message, self) => {

  if(!message.startsWith('!') || tags['display-name'] === 'buttsbot'){
    return;
  }

  var args    = message.slice(1).split(' ');
  var command = args.shift().toLowerCase();

  if (command === 'skipsong' && (isMod(tags) || isStreamer(tags))) {
    dequeueVideo();
  }


});
</script>
</body>
</html>
