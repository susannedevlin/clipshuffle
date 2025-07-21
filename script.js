let videoList = [];
let currentIndex = 0;
let player;
let timeoutId = null;

function extractVideoId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

function loadPlaylist() {
  const raw = document.getElementById("playlistInput").value;
  const urls = raw.split("\n").map(line => line.trim()).filter(Boolean);
  videoList = urls.map(extractVideoId).filter(Boolean).map(id => ({ id }));
  currentIndex = 0;
  if (videoList.length === 0) {
    alert("No valid YouTube links found!");
    return;
  }

  // Load first video
  if (player && player.loadVideoById) {
    playRandomClip();
  } else {
    createPlayer();
  }
}

function createPlayer() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: videoList[currentIndex].id,
    events: {
      onReady: () => {
        playRandomClip();
      },
    },
  });
}

function getRandomStart() {
  return Math.floor(30 + Math.random() * 120);
}

function playRandomClip() {
  if (timeoutId) clearTimeout(timeoutId);

  const start = getRandomStart();
  player.loadVideoById({
    videoId: videoList[currentIndex].id,
    startSeconds: start,
  });

  timeoutId = setTimeout(() => {
    currentIndex = (currentIndex + 1) % videoList.length;
    playRandomClip();
  }, 60000);
}

function skipToNext() {
  if (timeoutId) clearTimeout(timeoutId);
  currentIndex = (currentIndex + 1) % videoList.length;
  playRandomClip();
}
