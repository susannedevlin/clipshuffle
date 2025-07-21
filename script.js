// ── CONFIG ─────────────────────────────────────
const YT_API_KEY = "AIzaSyBKj7GOQvp06PlTrSkrUQwsaIU1DrZM9i8";

let PLAYLIST_ID = "PLfrFfCKLZiB6snt1ULYIiDQ0SjwnP_QAR"; // default playlist

const PLAYLISTS = {
  "Latin": "PLfrFfCKLZiB6snt1ULYIiDQ0SjwnP_QAR",
  "Music Mixes": "PLfrFfCKLZiB63G86e-6IS-e-vQTmnqg7A"
};

// ───────────────────────────────────────────────

let videoList = [];
let currentIndex = 0;
let player;
let timeoutId = null;
let isPlayerReady = false;

// Shuffle function
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
}

// Fetch all videos from playlist
async function fetchPlaylistItems(playlistId) {
  let results = [];
  let token = "";
  do {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.search = new URLSearchParams({
      part: "contentDetails",
      maxResults: "50",
      playlistId,
      key: YT_API_KEY,
      pageToken: token,
    }).toString();

    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      console.error(data.error);
      alert("Error fetching playlist:\n" + data.error.message);
      return [];
    }
    data.items.forEach(item => results.push(item.contentDetails.videoId));
    token = data.nextPageToken || "";
  } while (token);

  return results.map(id => ({ id }));
}

// Load the playlist, shuffle it, and start playing
async function loadPlaylist() {
  const fetchedVideos = await fetchPlaylistItems(PLAYLIST_ID);
  if (!fetchedVideos.length) return;

  videoList = shuffleArray(fetchedVideos);
  currentIndex = 0;

  if (player && isPlayerReady) {
    playRandomClip();
  } else {
    createPlayer();
  }
}

// Create YouTube player
function onYouTubeIframeAPIReady() {
  loadPlaylist(); // ✅ Autoload when API is ready
}

function createPlayer() {
  player = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: videoList[0].id,
    events: {
      onReady: () => {
        isPlayerReady = true;
        playRandomClip();
      },
    },
  });
}

// Get random clip start time (between 1 min and 25 min)
function getRandomStart() {
  return Math.floor(60 + Math.random() * (1500 - 60)); // 60s to 1500s
}

// Play 90-second random clip
function playRandomClip() {
  if (timeoutId) clearTimeout(timeoutId);

  const vid = videoList[currentIndex].id;
  const start = getRandomStart();
  player.loadVideoById({ videoId: vid, startSeconds: start });

  timeoutId = setTimeout(() => {
    currentIndex = (currentIndex + 1) % videoList.length;
    playRandomClip();
  }, 90000); // 90 seconds
}

// Manual skip button
function skipToNext() {
  if (timeoutId) clearTimeout(timeoutId);
  currentIndex = (currentIndex + 1) % videoList.length;
  playRandomClip();
}

// Playlist switcher
function switchPlaylist(name) {
  if (!PLAYLISTS[name]) return alert("Playlist not found");
  PLAYLIST_ID = PLAYLISTS[name];
  loadPlaylist();
}

