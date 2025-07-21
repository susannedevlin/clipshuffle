// ── CONFIG ─────────────────────────────────────
const YT_API_KEY = "AIzaSyBKj7GOQvp06PlTrSkrUQwsaIU1DrZM9i8";  
// ────────────────────────────────────────────────

let videoList = [];
let currentIndex = 0;
let player;
let timeoutId = null;
let isPlayerReady = false;

// 1) Fetch all videos in the playlist (first 50; handles pagination)
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

// 2) Called when you click “Load Playlist”
async function loadPlaylist() {
  const pid = "PLfrFfCKLZiB4dVDHOFWelQxgqR_iYqps6";  // ← Replace with your playlist ID
  if (!pid) return alert("Please enter a Playlist ID");

  videoList = await fetchPlaylistItems(pid);
  if (!videoList.length) return;

  currentIndex = 0;
  if (player && isPlayerReady) {
    playRandomClip();
  } else {
    createPlayer();
  }
}

// 3) Init YouTube IFrame player
function onYouTubeIframeAPIReady() {
  // We wait until loadPlaylist() before creating the player
}

// 4) Create the player only after we know videoList
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

// 5) Pick a random start between 30s and 150s
function getRandomStart() {
  return Math.floor(30 + Math.random() * 120);
}

// 6) Play a 60-second clip and auto-advance
function playRandomClip() {
  if (timeoutId) clearTimeout(timeoutId);

  const vid = videoList[currentIndex].id;
  const start = getRandomStart();
  player.loadVideoById({ videoId: vid, startSeconds: start });

  timeoutId = setTimeout(() => {
    currentIndex = (currentIndex + 1) % videoList.length;
    playRandomClip();
  }, 60000);
}

// 7) Manual skip button
function skipToNext() {
  if (timeoutId) clearTimeout(timeoutId);
  currentIndex = (currentIndex + 1) % videoList.length;
  playRandomClip();
}
