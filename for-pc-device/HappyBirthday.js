// ===============================
// Canvas and Animation Setup
// ===============================

// Get canvas element and set up context and dimensions
const c = document.getElementById('c'); // Main canvas element
let w = (c.width = window.innerWidth);  // Canvas width = window width
let h = (c.height = window.innerHeight); // Canvas height = window height
const ctx = c.getContext("2d");         // 2D drawing context

// Animation and firework options
const opts = {
  strings: ["Happy", "! Birthday !", "*.*.*.*.*", "Tú Linh", "Cute Phô Mai Que"], // Animated text lines
  charSize: 50,                  // Font size for animated letters
  charSpacing: 45,               // Space between characters
  lineHeight: 70,                // Space between lines
  cx: w * 0.25,                  // X center for text
  cy: h / 2 - 60,                // Y center for text
  fireworkPrevPoints: 10,        // Trail points for firework lines
  fireworkBaseLineWidth: 5,      // Minimum firework line width
  fireworkAddedLineWidth: 8,     // Random extra firework line width
  fireworkSpawnTime: 200,        // Random delay before letter launches
  fireworkBaseReachTime: 30,     // Minimum time for firework to reach
  fireworkAddedReachTime: 30,    // Random extra reach time
  fireworkCircleBaseSize: 20,    // Minimum explosion circle size
  fireworkCircleAddedSize: 10,   // Random extra explosion circle size
  fireworkCircleBaseTime: 30,    // Minimum explosion circle time
  fireworkCircleAddedTime: 30,   // Random extra explosion circle time
  fireworkCircleFadeBaseTime: 10,// Minimum fade time for explosion
  fireworkCircleFadeAddedTime: 5,// Random extra fade time
  fireworkBaseShards: 10,        // Minimum number of shards per explosion
  fireworkAddedShards: 5,        // Random extra shards per explosion
  fireworkShardPrevPoints: 3,    // Trail points for shards
  fireworkShardBaseVel: 4,       // Minimum shard velocity
  fireworkShardAddedVel: 2,      // Random extra shard velocity
  fireworkShardBaseSize: 6,      // Minimum shard size
  fireworkShardAddedSize: 3,     // Random extra shard size
  gravity: 0.1,                  // Gravity for falling shards
};

// Calculate total width for the widest line
const calc = {
  totalWidth: opts.charSpacing * Math.max(...opts.strings.map(s => s.length)),
};

const Tau = Math.PI * 2;         // Full circle constant
const TauQuarter = Tau / 4;      // Quarter circle

// ===============================
// Cursor Trail Effect
// ===============================
const cursorTrail = [];          // Stores cursor positions for trail
const maxTrail = 12;             // Max number of trail points
document.addEventListener('mousemove', function (e) {
  cursorTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() }); // Add cursor position
  if (cursorTrail.length > maxTrail) cursorTrail.shift();             // Remove oldest if too many
});
let bounceStartTime = Date.now(); // Start time for bounce animation

// ===============================
// Load SmothyBubble font as .woff if not already loaded
// ===============================
const smothyBubbleFontStyle = document.createElement('style');
smothyBubbleFontStyle.innerHTML = `
@font-face {
  font-family: 'SmothyBubble';
  src: url('./SmothyBubble-d9D06.woff') format('woff');
  font-display: swap;
}
`;
document.head.appendChild(smothyBubbleFontStyle);

// Set SmothyBubble font for animated strings
ctx.font = "bold " + opts.charSize + "px SmothyBubble, monospace";

// ===============================
// Letter Animation Class
// ===============================
function Letter(char, x, y) {
  this.char = char;                                   // The character to display
  this.x = x;                                         // X position
  this.y = y;                                         // Y position
  this.dx = -ctx.measureText(char).width / 2;         // Center character horizontally
  this.dy = +opts.charSize / 2;                       // Center character vertically
  this.fireworkDy = this.y - h / 2;                   // Vertical distance for firework
  var hue = (x / calc.totalWidth) * 360;              // Color hue based on position
  this.color = `hsl(${hue},80%,50%)`;                 // Main color
  this.lightAlphaColor = `hsla(${hue},80%,light%,alp)`; // Light color with alpha
  this.lightColor = `hsl(${hue},80%,light%)`;           // Light color
  this.alphaColor = `hsla(${hue},80%,50%,alp)`;         // Main color with alpha
  this.reset();                                       // Initialize animation state
}
Letter.prototype.reset = function () {
  this.phase = "firework";                             // Start in firework phase
  this.tick = 0;                                      // Animation tick
  this.spawned = false;                               // Has the letter launched
  this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0; // Random launch delay
  this.reachTime = (opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random()) | 0; // Random reach time
  this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random(); // Random line width
  this.prevPoints = [[0, h / 2, 0]];                  // Trail points for firework
};
Letter.prototype.step = function () {
  // Handles firework and bounce animation for each letter
  if (this.phase === "firework") {
    if (!this.spawned) {
      ++this.tick;                                    // Wait for launch
      if (this.tick >= this.spawningTime) {
        this.tick = 0;
        this.spawned = true;
      }
    } else {
      ++this.tick;                                    // Animate firework
      var linearProportion = this.tick / this.reachTime,
        armonicProportion = Math.sin(linearProportion * TauQuarter),
        x = linearProportion * this.x,
        y = h / 2 + armonicProportion * this.fireworkDy;
      if (this.prevPoints.length > opts.fireworkPrevPoints)
        this.prevPoints.shift();
      this.prevPoints.push([x, y, linearProportion * this.lineWidth]);
      var lineWidthProportion = 1 / (this.prevPoints.length - 1);
      for (var i = 1; i < this.prevPoints.length; ++i) {
        var point = this.prevPoints[i],
          point2 = this.prevPoints[i - 1];
        ctx.strokeStyle = this.alphaColor.replace("alp", i / this.prevPoints.length);
        ctx.lineWidth = point[2] * lineWidthProportion * i;
        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(point2[0], point2[1]);
        ctx.stroke();
      }
      if (this.tick >= this.reachTime) {
        this.phase = "contemplate";                    // Switch to bounce phase
        this.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
        this.circleCompleteTime = (opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random()) | 0;
        this.circleCreating = true;
        this.circleFading = false;
        this.circleFadeTime = (opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random()) | 0;
        this.tick = 0;
        this.tick2 = 0;
        this.shards = [];
        var shardCount = (opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random()) | 0,
          angle = Tau / shardCount,
          cos = Math.cos(angle),
          sin = Math.sin(angle),
          x = 1,
          y = 0;
        for (var i = 0; i < shardCount; ++i) {
          var x1 = x;
          x = x * cos - y * sin;
          y = y * cos + x1 * sin;
          this.shards.push(new Shard(this.x, this.y, x, y, this.alphaColor));
        }
      }
    }
  } else if (this.phase === "contemplate") {
    ++this.tick;
    // Bounce effect for each letter
    const bounceAmplitude = 3;
    const bounceFrequency = 1.25;
    let lineIndex = 0, charIndex = 0, totalChars = 0;
    for (let i = 0; i < opts.strings.length; ++i) {
      if (totalChars + opts.strings[i].length > letters.indexOf(this)) {
        lineIndex = i;
        charIndex = letters.indexOf(this) - totalChars;
        break;
      }
      totalChars += opts.strings[i].length;
    }
    const now = (Date.now() - bounceStartTime) / 1000;
    const bounce =
      Math.sin(
        now * bounceFrequency * Math.PI * 2 +
        (charIndex + lineIndex * 2) * 0.4
      ) * bounceAmplitude;
    if (this.circleCreating) {
      ++this.tick2;
      var proportion = this.tick2 / this.circleCompleteTime,
        armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;
      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor
        .replace("light", 50 + 50 * proportion)
        .replace("alp", proportion);
      ctx.arc(this.x, this.y + bounce, armonic * this.circleFinalSize, 0, Tau);
      ctx.fill();
      if (this.tick2 > this.circleCompleteTime) {
        this.tick2 = 0;
        this.circleCreating = false;
        this.circleFading = true;
      }
    } else if (this.circleFading) {
      ctx.fillStyle = this.lightColor.replace("light", 70);
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy + bounce);
      ++this.tick2;
      var proportion = this.tick2 / this.circleFadeTime,
        armonic = -Math.cos(proportion * Math.PI) / 2 + 0.5;
      ctx.beginPath();
      ctx.fillStyle = this.lightAlphaColor
        .replace("light", 100)
        .replace("alp", 1 - armonic);
      ctx.arc(this.x, this.y + bounce, this.circleFinalSize, 0, Tau);
      ctx.fill();
      if (this.tick2 >= this.circleFadeTime) this.circleFading = false;
    } else {
      ctx.fillStyle = this.lightColor.replace("light", 70);
      ctx.fillText(this.char, this.x + this.dx, this.y + this.dy + bounce);
    }
    for (var i = 0; i < this.shards.length; ++i) {
      this.shards[i].step();
      if (!this.shards[i].alive) {
        this.shards.splice(i, 1);
        --i;
      }
    }
  }
};

// ===============================
// Firework Shard Class
// ===============================
function Shard(x, y, vx, vy, color) {
  var vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random(); // Random velocity
  this.vx = vx * vel;                   // X velocity
  this.vy = vy * vel;                   // Y velocity
  this.x = x;                           // X position
  this.y = y;                           // Y position
  this.prevPoints = [[x, y]];           // Trail points
  this.color = color;                   // Color
  this.alive = true;                    // Is shard still visible
  this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random(); // Random size
}
Shard.prototype.step = function () {
  this.x += this.vx;                    // Move shard
  this.y += this.vy += opts.gravity;    // Apply gravity
  if (this.prevPoints.length > opts.fireworkShardPrevPoints)
    this.prevPoints.shift();
  this.prevPoints.push([this.x, this.y]);
  var lineWidthProportion = this.size / this.prevPoints.length;
  for (var k = 0; k < this.prevPoints.length - 1; ++k) {
    var point = this.prevPoints[k],
      point2 = this.prevPoints[k + 1];
    // Draw heart shape instead of line
    ctx.save();
    ctx.translate(point2[0], point2[1]);
    ctx.scale(0.12 * k, 0.12 * k); // Scale heart based on trail position
    ctx.beginPath();
    // Heart shape path
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0, -12, -12, -12, -12, 0);
    ctx.bezierCurveTo(-12, 12, 0, 16, 0, 24);
    ctx.bezierCurveTo(0, 16, 12, 12, 12, 0);
    ctx.bezierCurveTo(12, -12, 0, -12, 0, 0);
    ctx.closePath();
    ctx.fillStyle = this.color.replace("alp", k / this.prevPoints.length);
    ctx.globalAlpha = k / this.prevPoints.length;
    ctx.fill();
    ctx.restore();
  }
  // Remove if out of bounds
  if (this.prevPoints[0][1] > h || this.prevPoints[0][0] < 0 || this.prevPoints[0][0] > w) this.alive = false;
};

// ===============================
// Blinking Stars Background
// ===============================
const starCount = 165;                   // Number of stars
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * w,                // X position
    y: Math.random() * h,                // Y position
    radius: Math.random() * 2 + 1,       // Star size
    blinkSpeed: Math.random() * 1.5 + 0.5, // Blink speed
    blinkPhase: Math.random() * Math.PI * 2 // Blink phase
  });
}
function drawStars() {
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const t = Date.now() / 1000;
    const alpha = 0.5 + 0.5 * Math.sin(t * star.blinkSpeed + star.blinkPhase); // Blinking effect
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }
}

// ===============================
// Card and Letter Card Animation State
// ===============================
let cardSpawned = false;                  // Is card visible
let cardSpawnProgress = 0;                // Card spawn progress (0-1)
const cardSpawnDuration = 120;            // Frames for card to appear
const cardElement = document.querySelector('.birthday-card'); // Card DOM element

// Helper to animate card spawn (scale up and fade in)
function animateCardSpawn() {
  if (!cardElement) return;
  cardElement.style.display = "block";    // Show card
  cardElement.style.pointerEvents = ".card-inner"; // Enable pointer events
  cardElement.style.transformOrigin = "center center"; // Set transform origin
  cardElement.style.transition = "none";  // Remove transition for animation
  cardElement.style.opacity = cardSpawnProgress; // Fade in
  cardElement.style.transform = `translateY(-50%) scale(${0.7 + 0.3 * cardSpawnProgress})`; // Scale up
}

// ===============================
// Overlay for Click-to-Start
// ===============================
let animationStarted = false;              // Has animation started
const overlay = document.createElement('div'); // Overlay element
overlay.style.position = 'fixed';          // Fixed position
overlay.style.top = 0;
overlay.style.left = 0;
overlay.style.width = '100vw';
overlay.style.height = '100vh';
overlay.style.background = 'rgba(2,20,53,0.96)';
overlay.style.zIndex = 10; // Set higher than .main-panel (which is 3)
overlay.style.display = 'flex';
overlay.style.alignItems = 'center';
overlay.style.justifyContent = 'center';
overlay.style.flexDirection = 'column';
overlay.style.color = '#fff';
overlay.style.fontSize = '2rem';
overlay.style.fontFamily = 'Segoe UI, Havana, sans-serif';
overlay.style.letterSpacing = '2px';
overlay.style.cursor = 'pointer';
overlay.innerHTML = `<div>✨ Click to Start ✨</div>`;
document.body.appendChild(overlay);

// ===============================
// Hide Card and Letter Until Animation Starts
// ===============================

const letterElement = document.querySelector('.letter'); // Letter DOM element
if (cardElement) {
  cardElement.style.opacity = "0";         // Hide card
  cardElement.style.transform = "translateY(-50%) scale(0.7)";
  cardElement.style.transition = "opacity 0.6s, transform 0.6s";
  cardElement.style.pointerEvents = "none";
  cardElement.style.display = "none";
  // Card flipping event: single-click to flip to back, double-click to flip to front
  cardElement.addEventListener('click', function () {
    if (cardSpawned && cardElement.style.opacity === "1") {
      cardElement.classList.add("flipped");
    }
  });
  cardElement.addEventListener('dblclick', function (e) {
    e.preventDefault(); // Prevents double-click from also firing single-click
    if (cardSpawned && cardElement.style.opacity === "1") {
      cardElement.classList.remove("flipped");
    }
  });
}
if (letterElement) {
  letterElement.style.opacity = "0";       // Hide letter
  letterElement.style.transition = "opacity 0.6s";
  letterElement.style.transform = "translateY(-50%) scale(0.7)";
  letterElement.style.pointerEvents = "none";
  letterElement.style.display = "none";
  // Letter flipping event: single-click to flip to back, double-click to flip to front
  letterElement.addEventListener('click', function () {
    if (letterCardSpawned && letterElement.style.opacity === "1") {
      letterElement.classList.add("flipped");
    }
  });
  letterElement.addEventListener('dblclick', function (e) {
    e.preventDefault();
    if (letterCardSpawned && letterElement.style.opacity === "1") {
      letterElement.classList.remove("flipped");
    }
  });
}

// ===============================
// Create Letters for Animated Strings
// ===============================
const letters = []; // Array to hold Letter objects
for (let i = 0; i < opts.strings.length; ++i) {
  for (let j = 0; j < opts.strings[i].length; ++j) {
    letters.push(
      new Letter(
        opts.strings[i][j],
        j * opts.charSpacing +
          opts.charSpacing / 2 -
          (opts.strings[i].length * opts.charSize) / 2
          + 40, // <-- Move right by 40px
        i * opts.lineHeight +
          opts.lineHeight / 2 -
          (opts.strings.length * opts.lineHeight) / 2 - 129
      )
    );
  }
}

// ===============================
// Letter Card Animation State
// ===============================
const letterCardElement = letterElement; // Letter card DOM element
let letterCardSpawned = false;           // Is letter card visible
let letterCardSpawnProgress = 0;         // Letter card spawn progress (0-1)
const letterCardSpawnDuration = 120;     // Frames for letter card to appear

// Helper to animate letter card spawn (scale up and fade in)
function animateLetterCardSpawn() {
  if (!letterCardElement) return;
  letterCardElement.style.display = "block";
  letterCardElement.style.transformOrigin = "center center";
  letterCardElement.style.transition = "none";
  letterCardElement.style.opacity = letterCardSpawnProgress;
  letterCardElement.style.transform = `translateY(-50%) scale(${0.7 + 0.3 * letterCardSpawnProgress})`;
}

// ===============================
// Firework Shooting Line (Reusable Letter Firework Animation)
// ===============================
const globalFireworkLines = []; // Stores all active firework lines

// FireworkLine: animates a shooting firework line, then explodes into shards
function FireworkLine(targetX, targetY, color) {
  this.x = w / 2;
  this.y = h;
  this.targetX = targetX;
  this.targetY = targetY;
  this.fireworkDy = targetY - h;
  this.reachTime = (opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random()) | 0;
  this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
  this.prevPoints = [[w / 2, h, 0]];
  this.tick = 0;
  this.color = color || `hsla(${Math.random() * 360},80%,50%,1)`;
  this.done = false;
}
FireworkLine.prototype.step = function () {
  ++this.tick;
  var linearProportion = this.tick / this.reachTime,
      armonicProportion = Math.sin(linearProportion * TauQuarter),
      x = (1 - linearProportion) * (w / 2) + linearProportion * this.targetX,
      y = h + armonicProportion * this.fireworkDy;
  if (this.prevPoints.length > opts.fireworkPrevPoints)
    this.prevPoints.shift();
  this.prevPoints.push([x, y, linearProportion * this.lineWidth]);
  var lineWidthProportion = 1 / (this.prevPoints.length - 1);
  for (var i = 1; i < this.prevPoints.length; ++i) {
    var point = this.prevPoints[i],
        point2 = this.prevPoints[i - 1];
    ctx.strokeStyle = this.color.replace("alp", i / this.prevPoints.length);
    ctx.lineWidth = point[2] * lineWidthProportion * i;
    ctx.beginPath();
    ctx.moveTo(point[0], point[1]);
    ctx.lineTo(point2[0], point2[1]);
    ctx.stroke();
  }
  if (this.tick >= this.reachTime) {
    // Explode into shards at the end
    spawnFirework(this.targetX, this.targetY);
    this.done = true;
  }
};

// ===============================
// Firework & Shard System (Global, Independent)
// ===============================
const globalShards = []; // Stores all active firework shards

// Spawn a firework at (x, y)
function spawnFirework(x, y) {
  // Increase the number of shards for a bigger explosion
  const shardCount = (opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random()) | 0;
  const extraShards = 12 + Math.floor(Math.random() * 8); // Add 12-20 more shards
  const totalShards = shardCount + extraShards;
  const angle = Tau / totalShards;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let vx = 1, vy = 0;
  for (let i = 0; i < totalShards; ++i) {
    let vx1 = vx;
    vx = vx * cos - vy * sin;
    vy = vy * cos + vx1 * sin;
    globalShards.push(new Shard(x, y, vx, vy, `hsla(${Math.random() * 360},80%,60%,1)`));
  }
}

// Animate and draw global firework shards
function stepAndDrawGlobalShards() {
  for (let i = 0; i < globalShards.length; ++i) {
    globalShards[i].step();
    if (!globalShards[i].alive) {
      globalShards.splice(i, 1);
      --i;
    }
  }
}

// ===============================
// Firework Interval: Random 3-7 hits at once each interval
// ===============================
setInterval(() => {
  if (animationStarted) {
    const hits = 3 + Math.floor(Math.random() * 5); // 3 to 7 hits
    for (let i = 0; i < hits; i++) {
      const tx = Math.random() * w;
      const ty = Math.random() * h;
      globalFireworkLines.push(new FireworkLine(tx, ty));
    }
  }
}, 1650); // 1650ms interval for frequent shooting

// ===============================
// Allow user to spawn fireworks by clicking the canvas or the main panel
// ===============================
function handleFireworkClick(e) {
  if (!animationStarted) return;
  let rect = c.getBoundingClientRect();
  const tx = e.clientX - rect.left;
  const ty = e.clientY - rect.top;
  globalFireworkLines.push(new FireworkLine(tx, ty));
}
c.addEventListener('click', handleFireworkClick);
const mainPanel = document.querySelector('.main-panel');
if (mainPanel) {
  mainPanel.addEventListener('click', handleFireworkClick);
}

// ===============================
// Freeze animation, music, and ALL interactions when tab/app is not visible
// ===============================
let animationFrozen = false;

/**
 * Freeze or unfreeze everything: animation, music, UI, and all effects.
 * @param {boolean} freeze - true to freeze, false to unfreeze
 */
function freezeEverything(freeze) {
  animationFrozen = freeze;

  // Pause all music and voice
  soundtrack1.pause();
  soundtrack2.pause();
  voice.pause();

  // Show overlay and block all pointer events
  if (freeze) {
    overlay.style.display = 'flex';
    overlay.innerHTML = `<div>⏸️ Paused (Switch back to continue)</div>`;
    overlay.style.pointerEvents = 'auto';
    document.body.style.pointerEvents = 'none'; // Block all interactions except overlay
    overlay.style.pointerEvents = 'auto'; // Allow overlay to receive events
  } else {
    overlay.style.display = animationStarted ? 'none' : 'flex';
    overlay.innerHTML = `<div>✨ Click to Start ✨</div>`;
    document.body.style.pointerEvents = '';
    // Resume music if animation started
    if (animationStarted) {
      if (soundtrack1.paused && !soundtrack2.ended) soundtrack1.play();
      else if (soundtrack2.paused && !voice.ended) soundtrack2.play();
      else if (voice.paused) voice.play();
    }
  }
}

// Listen for visibility changes and freeze/unfreeze everything
document.addEventListener('visibilitychange', function () {
  freezeEverything(document.hidden);
});

// ===============================
// Main Animation Loop
// ===============================
function anim() {
  window.requestAnimationFrame(anim); // Loop animation
  if (animationFrozen) return; // Freeze absolutely everything if not visible

  // Draw background and blinking stars
  let gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#021435");
  gradient.addColorStop(1, "#4d5a70");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  drawStars();

  // Animate and draw firework shooting lines
  for (let i = 0; i < globalFireworkLines.length; ++i) {
    globalFireworkLines[i].step();
    if (globalFireworkLines[i].done) {
      globalFireworkLines.splice(i, 1);
      --i;
    }
  }

  // Draw global fireworks and shards (always, even if not animating strings)
  stepAndDrawGlobalShards();

  // Wait for overlay click to start animation
  if (!animationStarted) return;

  ctx.translate(opts.cx, opts.cy); // Move origin for text

  var done = true;
  for (var l = 0; l < letters.length; ++l) {
    letters[l].step();
    if (letters[l].phase !== "done") done = false;
  }

  ctx.translate(-opts.cx, -opts.cy); // Restore origin

  // Card spawn animation: start when all letters are in "contemplate" phase
  if (!cardSpawned) {
    let allContemplate = letters.every(
      letter => letter.phase === "contemplate"
    );
    if (allContemplate) {
      if (cardElement && cardElement.style.display !== "block") {
        cardElement.style.display = "block";
      }
      cardSpawnProgress += 1 / cardSpawnDuration;
      if (cardSpawnProgress >= 1) {
        cardSpawnProgress = 1;
        cardSpawned = true;
        if (cardElement) {
          cardElement.style.transition = "";
          cardElement.style.opacity = "1";
          cardElement.style.transform = "translateY(-50%) scale(1)";
          cardElement.style.pointerEvents = "";
        }
        if (letterElement) {
          letterElement.style.opacity = "1";
          letterElement.style.transform = "translateY(-50%) scale(1)";
          letterElement.style.pointerEvents = "";
          letterElement.style.display = "block";
        }
      }
      animateCardSpawn();
    }
  }

  // Letter card spawn animation: start when main card is fully spawned
  if (cardSpawned && !letterCardSpawned) {
    letterCardSpawnProgress += 1 / letterCardSpawnDuration;
    if (letterCardSpawnProgress >= 1) {
      letterCardSpawnProgress = 1;
      letterCardSpawned = true;
      if (letterCardElement) {
        letterCardElement.style.transition = "";
        letterCardElement.style.opacity = "1";
        letterCardElement.style.transform = "translateY(-50%) scale(1)";
        letterCardElement.style.pointerEvents = "";
        letterCardElement.style.display = "block";
      }
    }
    animateLetterCardSpawn();
  }

  // Reset everything if animation is done
  if (done) {
    for (var l = 0; l < letters.length; ++l) letters[l].reset();
    cardSpawned = false;
    cardSpawnProgress = 0;
    if (cardElement) {
      cardElement.style.opacity = "0";
      cardElement.style.transform = "translateY(-50%) scale(0.7)";
      cardElement.style.pointerEvents = "none";
      cardElement.style.display = "none";
    }
    if (letterElement) {
      letterElement.style.opacity = "0";
      letterElement.style.transform = "translateY(-50%) scale(0.7)";
      letterElement.style.pointerEvents = "none";
      letterElement.style.display = "none";
    }
    letterCardSpawned = false;
    letterCardSpawnProgress = 0;
  }
}
anim(); // Start the animation loop

// ===============================
// Music Playback Control
// ===============================

// Create audio elements for both soundtracks and voice
const soundtrack1 = new Audio('src/soundtrack1.mp3');
const soundtrack2 = new Audio('src/soundtrack2.mp3');
const voice = new Audio('src/voice.mp3');             // Voice message to play after music

soundtrack1.loop = false; // Do not loop soundtrack1
soundtrack2.loop = false; // Do not loop soundtrack2

// Function to start the music sequence (play once, then stop, then play voice)
function playMusicSequence() {
  soundtrack1.currentTime = 0; // Start from beginning
  soundtrack2.currentTime = 0; // Start from beginning
  soundtrack1.play();          // Play first soundtrack
  soundtrack1.onended = () => {
    soundtrack2.currentTime = 0;
    soundtrack2.play();        // Play second soundtrack after first ends
  };
  soundtrack2.onended = () => {
    // Stop all music after both tracks played once
    soundtrack1.pause();
    soundtrack2.pause();
    soundtrack1.currentTime = 0;
    soundtrack2.currentTime = 0;
    // Play voice message
    voice.currentTime = 0;
    voice.play();
  };
}

// ===============================
// Overlay Click: Start Animation
// ===============================
overlay.addEventListener('click', function () {
  overlay.style.display = 'none'; // Hide overlay
  animationStarted = true;        // Start animation
  playMusicSequence();            // Start music sequence
});

// ===============================
// Prevent Copy, Cut, Paste, and Drag on Card and Letter Messages
// ===============================
const disableInkingSelectors = [
  '.birthday-card',
  '.letter',
  '.card-message',
  '.letter-message'
];
disableInkingSelectors.forEach(selector => {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('copy', e => e.preventDefault());        // Prevent copy
    el.addEventListener('cut', e => e.preventDefault());         // Prevent cut
    el.addEventListener('paste', e => e.preventDefault());       // Prevent paste
    el.addEventListener('dragstart', e => e.preventDefault());   // Prevent drag
    el.addEventListener('selectstart', e => e.preventDefault()); // Prevent text selection
    el.addEventListener('contextmenu', e => e.preventDefault()); // Prevent right-click menu
  });
});

// ===============================
// Expandable Letter Feature: Expand, Edit, and Collapse with Animation
// ===============================
const expandBtn = document.querySelector('.letter-expand-btn');
if (expandBtn && letterElement) {
  expandBtn.addEventListener('click', () => {
    if (!letterElement.classList.contains('expanded')) {
      letterElement.classList.add('expanded'); // Add expanded class for animation
    } else {
      // Collapse with animation
      letterElement.classList.add('closing'); // Add closing class for collapse animation
      letterElement.addEventListener('animationend', function handler() {
        letterElement.classList.remove('expanded', 'closing');
        letterElement.removeEventListener('animationend', handler);
      });
    }
  });
}

/*
===============================
NOTES FOR EACH SECTION:
===============================
- Canvas and Animation Setup: Initializes all animation and drawing options.
- Cursor Trail Effect: Adds a trailing effect to the mouse cursor.
- Letter Animation Class: Handles the firework and bounce animation for each letter.
- Firework Shard Class: Handles the firework explosion effect.
- Blinking Stars Background: Draws animated stars in the background.
- Card and Letter Card Animation State: Controls the appearance and animation of the birthday card and letter.
- Overlay for Click-to-Start: Shows a start overlay and waits for user interaction.
- Hide Card and Letter Until Animation Starts: Ensures cards are hidden until the animation begins.
- Create Letters for Animated Strings: Sets up the animated text.
- Letter Card Animation State: Controls the appearance and animation of the letter card.
- Firework Shooting Line: Animates shooting fireworks and explosions.
- Firework & Shard System: Manages global fireworks and shards.
- Main Animation Loop: Runs the animation, handles card/letter appearance, and resets when done.
- Music Playback Control: Handles background music and voice message.
- Overlay Click: Starts the animation and music.
- Prevent Copy, Cut, Paste, and Drag: Disables text selection and clipboard actions on card/letter.
- Expandable Letter Feature: Allows editing of letter content with expand/collapse animation.
*/
