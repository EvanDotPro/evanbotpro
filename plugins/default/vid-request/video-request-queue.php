<?php
header('Content-Type: application/json');
$redis = new Redis();
$redis->connect('127.0.0.1');

if (isset($_GET['fallback'])) {
  $fallbackPlaylist = $redis->GET('video-request-fallback:#' . $_GET['channel']);
  if (!$fallbackPlaylist) {
     die('false');
  }
  die("\"$fallbackPlaylist\"");
}
if (isset($_GET['remove'])) {
  $redis->LPOP('video-requests:#' . $_GET['channel']);
  echo 'true';
  die();
}

$list = $redis->LRANGE('video-requests:#' . $_GET['channel'], 0, (int) $_GET['count']);
$jsonList = [];
foreach ($list as $item) {
  $jsonList[] = json_decode($item);
}
echo json_encode($jsonList);
