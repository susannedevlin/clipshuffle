// ── CONFIG ─────────────────────────────────────
const YT_API_KEY = "AIzaSyBKj7GOQvp06PlTrSkrUQwsaIU1DrZM9i8"; // Replace with your YouTube Data API key
// ───────────────────────────────────────────────

let videoList = [];
let currentIndex = 0;
let player;
let timeoutId = null;
let isPlayerReady = false;

// Shuffle function (Fisher–Yates)
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

// Fetch all video IDs from playlist
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

// Load the playlist and shuffle it
async function loadPlaylist() {
  const pid = document.getElementById("playlistIdInput").value.trim();
  if (!pid) return alert("Please enter a Playlist ID");

  const fetchedVideos = await fetchPlaylistItems(pid);
  if (!fetchedVideos.length) return;

  videoList = shuffleArray(fetchedVideos); // ✅ Shuffle here
  currentIndex = 0;

  if (player && isPlayerReady) {
    playRandomClip();
  } else {
    createPlayer();
  }
}

// YouTube player creation
function onYouTubeIframeAPIReady() {
  // Wait until we call createPlayer()
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

// Get a random start time between 30s–150s
function getRandomStart() {
  return Math.floor(30 + Math.random() * 120);
}

// Play 60-second clip and move to next
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

// Manual skip button
function skipToNext() {
  if (timeoutId) clearTimeout(timeoutId);
  currentIndex = (currentIndex + 1) % videoList.length;
  playRandomClip();
}
