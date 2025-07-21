// ── CONFIG ─────────────────────────────────────
const YT_API_KEY = "YOUR_API_KEY_HERE"; // Replace with your actual key

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

// Shuffle array in place
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

// Parse ISO 8601 (e.g. "PT25M30S") to seconds
function parseISODurationToSeconds(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}

// Fetch video IDs from playlist, then fetch their durations
async function fetchPlaylistItems(playlistId) {
  let videoIds = [];
  let token = "";

  // Step 1: Get all video IDs from the playlist
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

    data.items.forEach(item => videoIds.push(item.contentDetails.videoId));
    token = data.nextPageToken || "";
  } while (token);

  // Step 2: Get durations using Videos endpoint
  const results = [];
  const chunkSize = 50;

  for (let i = 0; i < videoIds.length; i += chunkSize) {
    const chunk = videoIds.slice(i, i + chunkSize);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.search = new URLSearchParams({
      part: "contentDetails",
      id: chunk.join(","),
      key: YT_API_KEY,
    }).toString();

    const res = await fetch(url);
    const data = await res.json();

    data.items.forEach(item => {
      const id = item.id;
      const isoDuration = item.contentDetails.duration;
      const duration = parseISODurationToSeconds(isoDuration);
      results.push({ id, duration });
    });
  }

  return results;
}

// Load playlist and start playback
async function loadPlaylist() {
  const fetchedVideos = await fetchPlaylistItems(PLAYLIST_ID);
  if (!fetchedVideos.length) return;

  videoList = shuffleArray(fetchedVideos);
  currentIndex = 0;

  if (player && isPlayerReady) {
    player.stopVideo(); // force reload
    playRandomClip();
  } else {
    createPlayer();
  }
}

// YouTube API callback
function onYouTubeIframeAPIReady() {
  loadPlaylist(); // autoplay on load
}

// Create player
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

// Get a random safe start time
function getRandomStart(videoDuration) {
  const clipLength = 90;
  const maxStart = Math.max(videoDuration - clipLength, 5); // Avoid negatives
  return Math.floor(Math.random() * maxStart);
}

// Play a 90-second clip
function playRandomClip() {
  if (timeoutId) clearTimeout(timeoutId);

  const video = videoList[currentIndex];
  const start = getRandomStart(video.duration);

  player.loadVideoById({
    videoId: video.id,
    startSeconds: start
  });

  timeoutId = setTimeout(() => {
    currentIndex = (currentIndex + 1) % videoList.length;
    playRandomClip();
  }, 90000); // 90 seconds
}

// Skip to next video manually
function skipToNext() {
  if (timeoutId) clearTimeout(timeoutId);
  currentIndex = (currentIndex + 1) % videoList.length;
  playRandomClip();
}

// Switch between playlist buttons
function switchPlaylist(name) {
  if (!PLAYLISTS[name]) return alert("Playlist not found");
  PLAYLIST_ID = PLAYLISTS[name];
  loadPlaylist();
}
