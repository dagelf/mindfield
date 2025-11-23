// Configuration with defaults
let config = {
  rows: 4,
  cols: 4,
  nums: 7,
  size: 300,
  showTiming: true,
  hideNumbersAtStart: false,
  showGraphs: false,
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
let tboardStart = 0; // Time when board was generated/revealed
let mistakes = 0;
let best = 10000;
let tlast = Date.now();
let tgame = [], tmove = [], tview = [];
let flawless = 0, topstreak = 0, streak = 0, streaktime = 0, topstreaktime = 0;
let gameStarted = false;

// Advanced analytics
let fastestByNumber = {}; // Fastest time for each number transition (1→2, 2→3, etc.)
let fastestByDistance = {}; // Fastest time by Manhattan distance
let lastPosition = null; // Track last clicked position for distance calculation

// Load analytics from localStorage
function loadAnalytics() {
  try {
    const saved = localStorage.getItem('chimp-game-analytics');
    if (saved) {
      const parsed = JSON.parse(saved);
      fastestByNumber = parsed.fastestByNumber || {};
      fastestByDistance = parsed.fastestByDistance || {};
    }
  } catch (e) {
    console.log('Could not load analytics:', e);
  }
}

// Save analytics to localStorage
function saveAnalytics() {
  try {
    localStorage.setItem('chimp-game-analytics', JSON.stringify({
      fastestByNumber,
      fastestByDistance
    }));
  } catch (e) {
    console.log('Could not save analytics:', e);
  }
}

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

  btot = rows * cols;

  // Calculate box size accounting for margins and padding
  // Container padding: 10px * 2 = 20px
  // Each box margin: 4px * 2 = 8px per box
  // Total width needed: cols * (bx + 8) + 20
  const maxWidth = Math.min(wh, ww) - 60; // Leave some margin
  w = Math.min(maxWidth, cols * size);
  bx = (w - 20) / cols - 8; // Subtract container padding and box margins
  by = bx;

  // Update w to actual needed width
  w = cols * (bx + 8) + 20;
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
  // Optimized: use Array.from and ternary
  box = Array.from({ length: btot }, (_, i) => i < nums ? i + 1 : '');
  shuffle(box);

  // Create board HTML using array map (more efficient)
  const boardHTML = box.map((value, i) => {
    const display = config.hideNumbersAtStart ? '' : value;
    return `<li data-index="${i}">${display}</li>`;
  }).join('');

  document.getElementById('game').innerHTML = boardHTML;

  // Reset game state
  next = 1;
  mistakes = 0;
  lastPosition = null; // Reset position tracking
  const now = Date.now();
  tlast = now;
  tboardStart = now;
  gameStarted = !config.hideNumbersAtStart;

  // Note: Event listeners are attached via event delegation on #game element
  // See setupEventDelegation() - no need to attach/remove listeners per board
}

// Calculate position from index
function getPosition(index) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  return { row, col };
}

// Calculate Manhattan distance between two positions
function getManhattanDistance(pos1, pos2) {
  return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col);
}

// Handle click/touch on a box
function handleClick(m) {
  m.preventDefault(); // disable scroll and improve browser response time

  // Handle event delegation - get the li element
  const tag = m.target.closest('li');
  if (!tag) return;

  const tnow = Date.now();
  const timeDiff = tnow - tlast;

  // Optimization: prevent rapid duplicate clicks (debounce)
  if (timeDiff < 10) {
    return;
  }

  if (config.showTiming) {
    console.log(timeDiff, "ms");
  }

  const n = parseInt(tag.dataset.index);
  const x = box[n]; // number clicked on

  // Start game on first click if numbers are hidden
  if (!gameStarted && config.hideNumbersAtStart) {
    gameStarted = true;
    tboardStart = tnow; // Reset board start time when revealing
    document.querySelectorAll('#game li').forEach((t, i) => {
      t.innerHTML = box[i];
    });
    tlast = tnow;
    return;
  }

  if (x == 1) {
    tstart = tnow;
    // Track time from board start to first click (true reaction time)
    const reactionTime = tnow - tboardStart;
    tview.push(reactionTime);

    // Limit array size to prevent memory issues
    if (tview.length > 1000) {
      tview.shift();
    }

    flawless = 1;
    if (streak == 0) {
      streaktime = 0;
    }
    lastPosition = getPosition(n);
  } else if (x == next) {
    // Track move time
    tmove.push(timeDiff);

    // Limit array size
    if (tmove.length > 1000) {
      tmove.shift();
    }

    // Track fastest by number transition
    const transition = `${next - 1}→${next}`;
    if (!fastestByNumber[transition] || timeDiff < fastestByNumber[transition]) {
      fastestByNumber[transition] = timeDiff;
      saveAnalytics(); // Persist when we get a new record
    }

    // Track fastest by distance
    if (lastPosition) {
      const currentPos = getPosition(n);
      const distance = getManhattanDistance(lastPosition, currentPos);
      if (!fastestByDistance[distance] || timeDiff < fastestByDistance[distance]) {
        fastestByDistance[distance] = timeDiff;
        saveAnalytics(); // Persist when we get a new record
      }
      lastPosition = currentPos;
    }
  }
  tlast = tnow;

  if (x != next) {
    // Wrong click
    console.log("Wrong! You clicked", x, "instead of", next);
    mistakes++;
    flawless = 0;
    streak = 0;
    tag.style.background = 'red';
    document.querySelectorAll('#game li').forEach((t, i) => {
      t.innerHTML = box[i];
    });
  } else {
    // Correct click
    tag.style.background = 'lime';
    document.querySelectorAll('#game li').forEach((t) => {
      t.innerHTML = '';
    });
    next++;

    if (x == nums) {
      // Game complete
      const gameTime = tnow - tstart;
      tgame.push(gameTime);

      // Limit array size
      if (tgame.length > 1000) {
        tgame.shift();
      }

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
      lastPosition = null; // Reset position tracking for new game
      document.querySelectorAll('#game li').forEach((t, i) => {
        t.style.background = '';
        const show = config.hideNumbersAtStart ? '' : box[i];
        t.innerHTML = show;
      });
      next = 1;
      const now = Date.now();
      tboardStart = now; // Reset board start time for new game
      gameStarted = !config.hideNumbersAtStart;
    }
  }
}

// Setup event delegation on game board
function setupEventDelegation() {
  const gameBoard = document.getElementById('game');
  gameBoard.addEventListener(config.eventType, handleClick);
}

// Update score display
function updateScore(gameTime, mistakes, streak, streaktime, topstreak, topstreaktime) {
  const score = document.getElementById('score');

  // Format mistake text
  const mistakeText = mistakes === 1 ? '1 mistake' : `${mistakes} mistakes`;

  // Format streak text with proper grammar
  const streakGameText = streak === 1 ? 'game' : 'games';
  const topStreakGameText = topstreak === 1 ? 'game' : 'games';

  // Build score HTML
  let html = `<div class="score-entry">⏱️ ${gameTime}ms with ${mistakeText}</div>`;

  if (streak > 0) {
    html += `<div class="score-entry">🔥 Streak: ${streak} ${streakGameText} (${streaktime}ms) | Best: ${topstreak} ${topStreakGameText} (${topstreaktime}ms)</div>`;
  } else if (topstreak > 0) {
    html += `<div class="score-entry">Best streak: ${topstreak} ${topStreakGameText} in ${topstreaktime}ms</div>`;
  }

  // Add analytics if available
  html += getAnalyticsHTML();

  score.innerHTML = html + score.innerHTML;

  // Keep only last 20 entries (including analytics)
  const entries = score.querySelectorAll('.score-entry');
  if (entries.length > 20) {
    for (let i = 20; i < entries.length; i++) {
      entries[i].remove();
    }
  }

  // Update graphs with new data
  updateGraphs();
}

// Generate analytics HTML
function getAnalyticsHTML() {
  let html = '';

  // Display fastest by number transition
  const transitions = Object.keys(fastestByNumber).sort((a, b) => {
    const aNum = parseInt(a.split('→')[0]);
    const bNum = parseInt(b.split('→')[0]);
    return aNum - bNum;
  });

  if (transitions.length > 0) {
    const top3 = transitions.slice(0, 3).map(t =>
      `${t}: ${fastestByNumber[t]}ms`
    ).join(' | ');
    html += `<div class="score-entry analytics">⚡ Fastest transitions: ${top3}</div>`;
  }

  // Display fastest by distance
  const distances = Object.keys(fastestByDistance).sort((a, b) => parseInt(a) - parseInt(b));
  if (distances.length > 0) {
    const distanceLabels = {
      '1': 'Adjacent',
      '2': 'Distance 2',
      '3': 'Distance 3',
      '4': 'Distance 4'
    };
    const distanceStats = distances.slice(0, 4).map(d =>
      `${distanceLabels[d] || `Dist ${d}`}: ${fastestByDistance[d]}ms`
    ).join(' | ');
    html += `<div class="score-entry analytics">📏 Fastest by distance: ${distanceStats}</div>`;
  }

  return html;
}

// Toggle settings menu
function toggleSettings() {
  const menu = document.getElementById('settings-menu');
  menu.classList.toggle('open');
}

// Apply settings from menu
function applySettings() {
  const oldShowGraphs = config.showGraphs;

  const rows = parseInt(document.getElementById('setting-rows').value);
  const cols = parseInt(document.getElementById('setting-cols').value);
  const nums = parseInt(document.getElementById('setting-nums').value);

  // Validate settings
  if (rows < 1 || cols < 1 || nums < 1) {
    alert('Rows, columns, and numbers must be at least 1!');
    return;
  }

  const maxBoxes = rows * cols;
  if (nums > maxBoxes) {
    alert(`Numbers (${nums}) cannot exceed total boxes (${maxBoxes})!`);
    return;
  }

  config.rows = rows;
  config.cols = cols;
  config.nums = nums;
  config.showTiming = document.getElementById('setting-timing').checked;
  config.hideNumbersAtStart = document.getElementById('setting-hide-numbers').checked;
  config.showGraphs = document.getElementById('setting-show-graphs').checked;

  saveConfig();

  // Handle graph toggling dynamically
  if (oldShowGraphs !== config.showGraphs) {
    if (config.showGraphs) {
      // Enable graphs - load Plotly and initialize
      loadPlotly(() => {
        initGraphs();
      });
    } else {
      // Disable graphs - just hide them
      hideGraphDivs();
    }
  }

  initBoard();
  toggleSettings();
}

// Reset to defaults
function resetSettings() {
  const oldShowGraphs = config.showGraphs;

  config = {
    rows: 4,
    cols: 4,
    nums: 7,
    size: 300,
    showTiming: true,
    hideNumbersAtStart: false,
    showGraphs: false,
    eventType: config.eventType
  };
  saveConfig();
  updateSettingsUI();
  initBoard();

  // Handle graph toggling dynamically
  if (oldShowGraphs !== config.showGraphs) {
    if (config.showGraphs) {
      loadPlotly(() => {
        initGraphs();
      });
    } else {
      hideGraphDivs();
    }
  }
}

// Update settings UI with current config
function updateSettingsUI() {
  document.getElementById('setting-rows').value = config.rows;
  document.getElementById('setting-cols').value = config.cols;
  document.getElementById('setting-nums').value = config.nums;
  document.getElementById('setting-timing').checked = config.showTiming;
  document.getElementById('setting-hide-numbers').checked = config.hideNumbersAtStart;
  document.getElementById('setting-show-graphs').checked = config.showGraphs;

  // Update slider display values
  document.getElementById('rows-value').textContent = config.rows;
  document.getElementById('cols-value').textContent = config.cols;
  document.getElementById('nums-value').textContent = config.nums;

  // Update max numbers
  const maxNums = config.rows * config.cols;
  document.getElementById('nums-max').textContent = maxNums;
  document.getElementById('setting-nums').max = maxNums;
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

// Dynamically load Plotly library
function loadPlotly(callback) {
  if (typeof Plotly !== 'undefined') {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
  script.onload = callback;
  script.onerror = () => {
    console.error('Failed to load Plotly library');
    config.showGraphs = false;
    saveConfig();
  };
  document.head.appendChild(script);
}

// Show graph divs
function showGraphDivs() {
  const viewtime = document.getElementById('viewtime');
  const moves = document.getElementById('moves');
  const games = document.getElementById('games');

  if (viewtime) viewtime.classList.add('visible');
  if (moves) moves.classList.add('visible');
  if (games) games.classList.add('visible');
}

// Hide graph divs
function hideGraphDivs() {
  const viewtime = document.getElementById('viewtime');
  const moves = document.getElementById('moves');
  const games = document.getElementById('games');

  if (viewtime) viewtime.classList.remove('visible');
  if (moves) moves.classList.remove('visible');
  if (games) games.classList.remove('visible');
}

// Remove unused graph divs if graphs are not enabled
function removeUnusedDivs() {
  if (!config.showGraphs || typeof Plotly === 'undefined') {
    const viewtime = document.getElementById('viewtime');
    const moves = document.getElementById('moves');
    const games = document.getElementById('games');

    if (viewtime) viewtime.remove();
    if (moves) moves.remove();
    if (games) games.remove();
  }
}

// Initialize graphs if Plotly is available
function initGraphs() {
  if (typeof Plotly !== 'undefined' && config.showGraphs) {
    showGraphDivs();

    Plotly.newPlot('viewtime', [{
      type: 'histogram',
      x: tview,
      autobinx: true,
      name: 'View Time',
      marker: { color: '#667eea' }
    }], {
      title: 'Time to First Click (ms)',
      xaxis: { title: 'Time (ms)' },
      yaxis: { title: 'Frequency' }
    });

    Plotly.newPlot('moves', [{
      type: 'histogram',
      x: tmove,
      autobinx: true,
      name: 'Move Time',
      marker: { color: '#764ba2' }
    }], {
      title: 'Time Between Clicks (ms)',
      xaxis: { title: 'Time (ms)' },
      yaxis: { title: 'Frequency' }
    });

    Plotly.newPlot('games', [{
      type: 'scatter',
      mode: 'lines+markers',
      x: Array.from({ length: tgame.length }, (_, i) => i + 1),
      y: tgame,
      name: 'Game Time',
      line: { color: '#667eea', width: 2 },
      marker: { color: '#764ba2', size: 8 }
    }], {
      title: 'Game Performance Over Time',
      xaxis: { title: 'Game Number' },
      yaxis: { title: 'Time (ms)' }
    });
  }
}

// Update graphs with new data
function updateGraphs() {
  if (typeof Plotly !== 'undefined' && config.showGraphs) {
    Plotly.react('viewtime', [{
      type: 'histogram',
      x: tview,
      autobinx: true,
      name: 'View Time',
      marker: { color: '#667eea' }
    }], {
      title: 'Time to First Click (ms)',
      xaxis: { title: 'Time (ms)' },
      yaxis: { title: 'Frequency' }
    });

    Plotly.react('moves', [{
      type: 'histogram',
      x: tmove,
      autobinx: true,
      name: 'Move Time',
      marker: { color: '#764ba2' }
    }], {
      title: 'Time Between Clicks (ms)',
      xaxis: { title: 'Time (ms)' },
      yaxis: { title: 'Frequency' }
    });

    Plotly.react('games', [{
      type: 'scatter',
      mode: 'lines+markers',
      x: Array.from({ length: tgame.length }, (_, i) => i + 1),
      y: tgame,
      name: 'Game Time',
      line: { color: '#667eea', width: 2 },
      marker: { color: '#764ba2', size: 8 }
    }], {
      title: 'Game Performance Over Time',
      xaxis: { title: 'Game Number' },
      yaxis: { title: 'Time (ms)' }
    });
  }
}

// Live preview of board as sliders change
function previewBoard() {
  const previewRows = parseInt(document.getElementById('setting-rows').value);
  const previewCols = parseInt(document.getElementById('setting-cols').value);
  const previewNums = parseInt(document.getElementById('setting-nums').value);

  // Update displayed values
  document.getElementById('rows-value').textContent = previewRows;
  document.getElementById('cols-value').textContent = previewCols;
  document.getElementById('nums-value').textContent = previewNums;

  // Update max numbers based on grid size
  const maxNums = previewRows * previewCols;
  document.getElementById('nums-max').textContent = maxNums;
  document.getElementById('setting-nums').max = maxNums;

  // Clamp numbers to max
  if (previewNums > maxNums) {
    document.getElementById('setting-nums').value = maxNums;
    document.getElementById('nums-value').textContent = maxNums;
  }

  // Calculate preview dimensions
  const ww = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const wh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const btot = previewRows * previewCols;

  // Calculate box size accounting for margins and padding
  const maxWidth = Math.min(wh, ww) - 60;
  let w = Math.min(maxWidth, previewCols * size);
  const bx = (w - 20) / previewCols - 8;
  const by = bx;

  // Update w to actual needed width
  w = previewCols * (bx + 8) + 20;

  // Apply preview CSS
  const css = `#game { width: ${w}px; } li { width: ${bx}px; height: ${by}px; font-size: ${bx - 9}px; text-align: center; }`;
  let style = document.getElementById('dynamic-style');
  if (style) {
    style.textContent = css;
  }

  // Create preview board
  const previewBox = Array.from({ length: btot }, (_, i) => i < previewNums ? i + 1 : '');
  shuffle(previewBox);

  const boardHTML = previewBox.map((value, i) => {
    const display = config.hideNumbersAtStart ? '' : value;
    return `<li data-index="${i}">${display}</li>`;
  }).join('');

  document.getElementById('game').innerHTML = boardHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load saved analytics
  loadAnalytics();

  // Setup event delegation for game board
  setupEventDelegation();

  // Hide about message on click
  document.getElementById('about').addEventListener('mouseup', function(m) {
    m.currentTarget.style.display = 'none';
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', toggleSettings);
  document.getElementById('apply-settings').addEventListener('click', applySettings);
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
  document.getElementById('close-settings').addEventListener('click', toggleSettings);

  // Live preview sliders
  document.getElementById('setting-rows').addEventListener('input', previewBoard);
  document.getElementById('setting-cols').addEventListener('input', previewBoard);
  document.getElementById('setting-nums').addEventListener('input', previewBoard);

  // Update settings UI
  updateSettingsUI();

  // Initialize board
  initBoard();

  // Load graphs dynamically if enabled
  if (config.showGraphs) {
    loadPlotly(() => {
      initGraphs();
    });
  } else {
    removeUnusedDivs();
  }

  // Handle window resize
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
});
