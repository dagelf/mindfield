// Configuration with defaults
let config = {
  rows: 4,
  cols: 4,
  nums: 7,
  size: 300,
  showTiming: true,
  hideNumbersAtStart: false,
  eventType: null // will be auto-detected
};

// Load saved config from localStorage
function loadConfig() {
  try {
    const saved = localStorage.getItem('chimp-game-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      config = { ...config, ...parsed };
    }
  } catch (e) {
    console.log('Could not load saved config:', e);
  }
}

// Save config to localStorage
function saveConfig() {
  try {
    localStorage.setItem('chimp-game-config', JSON.stringify(config));
  } catch (e) {
    console.log('Could not save config:', e);
  }
}

// Auto-detect touchscreen capability
function detectTouchscreen() {
  // Check multiple ways to detect touch support
  const hasTouch = (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0)
  );

  config.eventType = hasTouch ? 'touchstart' : 'mousedown';
  console.log('Input method detected:', hasTouch ? 'Touchscreen' : 'Mouse');
  return config.eventType;
}

// Initialize configuration
loadConfig();
detectTouchscreen();

// Game state variables
let rows = config.rows;
let cols = config.cols;
let nums = config.nums;
let size = config.size;

let ww, wh, w, btot, bx, by;
let box = [];
let boxes;
let next = 1;
let tstart = 0;
let mistakes = 0;
let best = 10000;
let tlast = Date.now();
let tgame = [], tmove = [], tview = [];
let flawless = 0, topstreak = 0, streak = 0, streaktime = 0, topstreaktime = 0;
let gameStarted = false;

// Utility: shuffle array
function shuffle(a) {
  let j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
}

// Calculate board dimensions based on window size
function calculateDimensions() {
  ww = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  wh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  w = Math.min(Math.min(wh, ww) - 40, rows * size);
  btot = rows * cols - 1;
  bx = w / rows - 2;
  by = bx;
}

// Apply dynamic CSS for board sizing
function applyDynamicCSS() {
  const css = `#game { width: ${w}px; } li { width: ${bx}px; height: ${by}px; font-size: ${bx - 9}px; text-align: center; }`;
  let style = document.getElementById('dynamic-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamic-style';
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.textContent = css;
  }
}

// Initialize the game board
function initBoard() {
  rows = config.rows;
  cols = config.cols;
  nums = config.nums;

  calculateDimensions();
  applyDynamicCSS();

  // Fill box array with numbers and blanks, then shuffle
  box = [];
  for (let i = 1; i <= btot + 1; i++) {
    if (i <= nums) {
      box.push(i);
    } else {
      box.push('');
    }
  }
  shuffle(box);

  // Create board HTML
  let output = '';
  for (let i = 0; i <= btot; i++) {
    const show = config.hideNumbersAtStart ? '' : box[i];
    output += `<li data-index="${i}">${show}</li>`;
  }
  document.getElementById('game').innerHTML = output;

  // Reset game state
  next = 1;
  mistakes = 0;
  tlast = Date.now();
  gameStarted = !config.hideNumbersAtStart;

  // Attach event listeners
  attachEventListeners();
}

// Attach event listeners to board
function attachEventListeners() {
  boxes = document.querySelectorAll('#game li');
  boxes.forEach((tag, n) => {
    tag.addEventListener(config.eventType, handleClick);
  });
}

// Handle click/touch on a box
function handleClick(m) {
  const tnow = Date.now();
  const timeDiff = tnow - tlast;

  if (config.showTiming) {
    console.log(timeDiff, "ms");
  }

  m.preventDefault(); // disable scroll and improve browser response time

  const tag = m.currentTarget;
  const n = parseInt(tag.dataset.index);
  const x = box[n]; // number clicked on

  // Start game on first click if numbers are hidden
  if (!gameStarted && config.hideNumbersAtStart) {
    gameStarted = true;
    boxes.forEach((t, i) => {
      t.innerHTML = box[i];
    });
    tlast = tnow;
    return;
  }

  if (x == 1) {
    tstart = tnow;
    tview.push(timeDiff);
    flawless = 1;
    if (streak == 0) {
      streaktime = 0;
    }
  } else {
    tmove.push(timeDiff);
  }
  tlast = tnow;

  if (x != next) {
    // Wrong click
    console.log("Wrong! You clicked", x, "instead of", next);
    mistakes++;
    flawless = 0;
    streak = 0;
    tag.style.background = 'red';
    boxes.forEach((t, i) => {
      t.innerHTML = box[i];
    });
  } else {
    // Correct click
    tag.style.background = 'lime';
    boxes.forEach((t) => {
      t.innerHTML = '';
    });
    next++;

    if (x == nums) {
      // Game complete
      const gameTime = tnow - tstart;
      tgame.push(gameTime);

      if (flawless == 1) {
        streak += 1;
        streaktime += gameTime;
        if (streak > topstreak) {
          topstreak = streak;
          topstreaktime = streaktime;
        }
      }

      updateScore(gameTime, mistakes, streak, streaktime, topstreak, topstreaktime);

      // Reset for next game
      shuffle(box);
      mistakes = 0;
      boxes.forEach((t, i) => {
        t.style.background = '';
        const show = config.hideNumbersAtStart ? '' : box[i];
        t.innerHTML = show;
      });
      next = 1;
      gameStarted = !config.hideNumbersAtStart;
    }
  }
}

// Update score display
function updateScore(gameTime, mistakes, streak, streaktime, topstreak, topstreaktime) {
  const score = document.getElementById('score');
  let html = `<div class="score-entry">Done in ${gameTime}ms with ${mistakes} mistakes!</div>`;
  html += `<div class="score-entry">Current streak: ${streak} games in ${streaktime}ms. Best: ${topstreak} games in ${topstreaktime}ms!</div>`;
  score.innerHTML = html + score.innerHTML;

  // Keep only last 10 scores
  const entries = score.querySelectorAll('.score-entry');
  if (entries.length > 20) {
    for (let i = 20; i < entries.length; i++) {
      entries[i].remove();
    }
  }
}

// Toggle settings menu
function toggleSettings() {
  const menu = document.getElementById('settings-menu');
  menu.classList.toggle('open');
}

// Apply settings from menu
function applySettings() {
  config.rows = parseInt(document.getElementById('setting-rows').value);
  config.cols = parseInt(document.getElementById('setting-cols').value);
  config.nums = parseInt(document.getElementById('setting-nums').value);
  config.showTiming = document.getElementById('setting-timing').checked;
  config.hideNumbersAtStart = document.getElementById('setting-hide-numbers').checked;

  saveConfig();
  initBoard();
  toggleSettings();
}

// Reset to defaults
function resetSettings() {
  config = {
    rows: 4,
    cols: 4,
    nums: 7,
    size: 300,
    showTiming: true,
    hideNumbersAtStart: false,
    eventType: config.eventType
  };
  saveConfig();
  updateSettingsUI();
  initBoard();
}

// Update settings UI with current config
function updateSettingsUI() {
  document.getElementById('setting-rows').value = config.rows;
  document.getElementById('setting-cols').value = config.cols;
  document.getElementById('setting-nums').value = config.nums;
  document.getElementById('setting-timing').checked = config.showTiming;
  document.getElementById('setting-hide-numbers').checked = config.hideNumbersAtStart;
}

// Handle window resize
let resizeTimeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    calculateDimensions();
    applyDynamicCSS();
  }, 250);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Hide about message on click
  document.getElementById('about').addEventListener('mouseup', function(m) {
    m.currentTarget.style.display = 'none';
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);
  document.getElementById('apply-settings').addEventListener('click', applySettings);
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
  document.getElementById('close-settings').addEventListener('click', toggleSettings);

  // Update settings UI
  updateSettingsUI();

  // Initialize board
  initBoard();

  // Handle window resize
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
});
