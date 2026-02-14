const proposalScreen = document.getElementById("proposalScreen");
const giftScreen = document.getElementById("giftScreen");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const noMessage = document.getElementById("noMessage");
const buttonZone = document.getElementById("buttonZone");
const giftBtn = document.getElementById("giftBtn");
const modal = document.getElementById("surpriseModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const loveVideo = document.getElementById("loveVideo");
const videoHelp = document.getElementById("videoHelp");
const heartField = document.getElementById("heartField");
const musicToggle = document.getElementById("musicToggle");
const musicHint = document.getElementById("musicHint");
const letterParagraphs = Array.from(document.querySelectorAll(".love-letter p"));

let noAttempts = 0;
let musicStarted = false;
let musicPaused = false;
let letterAnimationToken = 0;
let ytPlayer = null;
let ytReady = false;
let customCursor = null;
let lastSparkleTime = 0;

const letterTextParts = letterParagraphs.map((paragraph) => paragraph.textContent.trim());

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function spawnSparkle(x, y) {
  const sparkle = document.createElement("span");
  const sparkleGlyphs = ["✨", "💗", "💖"];
  sparkle.className = "sparkle";
  sparkle.textContent = sparkleGlyphs[Math.floor(Math.random() * sparkleGlyphs.length)];
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  sparkle.style.fontSize = `${Math.random() * 8 + 10}px`;
  sparkle.style.setProperty("--dx", `${(Math.random() - 0.5) * 30}px`);
  sparkle.style.setProperty("--dy", `${(Math.random() - 0.5) * 30 - 8}px`);
  document.body.appendChild(sparkle);

  setTimeout(() => {
    sparkle.remove();
  }, 720);
}

function initHeartCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  customCursor = document.createElement("span");
  customCursor.className = "heart-cursor";
  document.body.appendChild(customCursor);

  window.addEventListener(
    "mousemove",
    (event) => {
      if (!customCursor) {
        return;
      }

      customCursor.style.left = `${event.clientX}px`;
      customCursor.style.top = `${event.clientY}px`;

      const now = performance.now();
      if (now - lastSparkleTime > 55) {
        spawnSparkle(event.clientX, event.clientY);
        lastSparkleTime = now;
      }
    },
    { passive: true }
  );
}

async function runLetterReveal() {
  letterAnimationToken += 1;
  const myToken = letterAnimationToken;

  letterParagraphs.forEach((paragraph) => {
    paragraph.textContent = "";
    paragraph.classList.remove("typing");
  });

  for (let index = 0; index < letterParagraphs.length; index += 1) {
    if (myToken !== letterAnimationToken) {
      return;
    }

    const paragraph = letterParagraphs[index];
    const fullText = letterTextParts[index];

    paragraph.classList.add("typing");

    for (let letterIndex = 0; letterIndex <= fullText.length; letterIndex += 1) {
      if (myToken !== letterAnimationToken) {
        return;
      }

      paragraph.textContent = fullText.slice(0, letterIndex);
      await wait(34);
    }

    paragraph.classList.remove("typing");
    await wait(340);
  }
}

function createHearts(count = 26) {
  for (let index = 0; index < count; index += 1) {
    const heart = document.createElement("span");
    heart.className = "float-heart";

    const randomX = `${Math.random() * 100}vw`;
    const driftX = `${(Math.random() - 0.5) * 24}vw`;
    const scale = (Math.random() * 0.8 + 0.6).toFixed(2);

    heart.style.setProperty("--x", randomX);
    heart.style.setProperty("--dx", driftX);
    heart.style.setProperty("--s", scale);
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.animationDuration = `${Math.random() * 8 + 10}s`;
    heart.style.animationDelay = `${Math.random() * 8}s`;

    heartField.appendChild(heart);
  }
}

function setMusicUi(playing) {
  musicToggle.setAttribute("aria-pressed", String(playing));
  musicToggle.textContent = playing ? "🎵 Music playing" : "🎵 Play our song";
  musicHint.textContent = playing
    ? "Our song is playing in the background 💖"
    : "Tap once to start music for the whole site 💞";
}

function loadYouTubeApi() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);

    const previousHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousHandler === "function") {
        previousHandler();
      }
      resolve();
    };
  });
}

async function ensureYouTubePlayer() {
  if (ytPlayer) {
    return ytPlayer;
  }

  await loadYouTubeApi();

  return new Promise((resolve) => {
    ytPlayer = new window.YT.Player("youtubePlayer", {
      width: 1,
      height: 1,
      videoId: "75-Com9Bo_s",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        fs: 0,
        playsinline: 1,
        loop: 1,
        playlist: "75-Com9Bo_s",
      },
      events: {
        onReady: (event) => {
          ytReady = true;
          ytPlayer = event?.target || ytPlayer;

          if (ytPlayer && typeof ytPlayer.setVolume === "function") {
            ytPlayer.setVolume(60);
          }

          resolve(ytPlayer);
        },
        onError: () => {
          musicHint.textContent = "Music is blocked here. Use the button again or test in deployed site 💗";
        },
      },
    });
  });
}

async function startMusic() {
  const player = await ensureYouTubePlayer();
  if (!ytReady) {
    return;
  }

  if (player && typeof player.unMute === "function") {
    player.unMute();
  }

  if (player && typeof player.playVideo === "function") {
    player.playVideo();
  }

  musicStarted = true;
  musicPaused = false;
  setMusicUi(true);
}

function pauseMusic() {
  if (!ytPlayer || !ytReady) {
    return;
  }

  ytPlayer.pauseVideo();
  musicPaused = true;
  setMusicUi(false);
}

function moveNoButton() {
  noAttempts += 1;

  const zoneRect = buttonZone.getBoundingClientRect();
  const buttonRect = noBtn.getBoundingClientRect();

  const maxX = Math.max(10, zoneRect.width - buttonRect.width - 10);
  const maxY = Math.max(10, zoneRect.height - buttonRect.height - 10);

  const nextX = Math.random() * maxX;
  const nextY = Math.random() * maxY;

  noBtn.style.left = `${nextX}px`;
  noBtn.style.top = `${nextY}px`;
  noBtn.style.transform = "none";

  noMessage.textContent = `Nope 😝 Request denied. Try again (${noAttempts})`;
}

function showGiftScreen() {
  proposalScreen.classList.remove("active");
  giftScreen.classList.add("active");
}

function launchConfetti() {
  const endTime = Date.now() + 1600;

  (function blast() {
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.55 },
      colors: ["#ff2e63", "#ff66b2", "#ffffff", "#ffd6e8"],
    });

    if (Date.now() < endTime) {
      requestAnimationFrame(blast);
    }
  })();
}

function openSurprise() {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  launchConfetti();
  runLetterReveal();

  videoHelp.hidden = true;
  loveVideo.load();
  loveVideo.currentTime = 0;
  loveVideo.play().catch(() => {
    videoHelp.hidden = false;
  });
}

function closeSurprise() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  letterAnimationToken += 1;
  loveVideo.pause();
}

loveVideo.addEventListener("error", () => {
  videoHelp.hidden = false;
});

["pointerdown", "mouseenter", "touchstart"].forEach((eventName) => {
  noBtn.addEventListener(eventName, moveNoButton);
});

noBtn.addEventListener("click", (event) => {
  event.preventDefault();
  moveNoButton();
});

yesBtn.addEventListener("click", () => {
  startMusic();
  showGiftScreen();
});

giftBtn.addEventListener("click", () => {
  startMusic();
  openSurprise();
});

closeModalBtn.addEventListener("click", closeSurprise);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeSurprise();
  }
});

window.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeSurprise();
    }
  },
  { passive: true }
);

window.addEventListener(
  "pointerdown",
  () => {
    startMusic();
  },
  { once: true, passive: true }
);

musicToggle.addEventListener("click", async () => {
  if (!musicStarted || musicPaused) {
    await startMusic();
    return;
  }

  pauseMusic();
});

setMusicUi(false);
initHeartCursor();

createHearts();
