// ===============================
// Canvas and Animation Setup
// ===============================

// Get canvas element by id 'c'
const c = document.getElementById('c'); 
// Set canvas width and height to window size
let w = (c.width = window.innerWidth),                
  h = (c.height = window.innerHeight),                
  ctx = c.getContext("2d"),                           // Get 2D drawing context
  hw = w * 0.25,                                      // Horizontal offset for text
  hh = h / 2,                                         // Vertical center
  opts = {                                            // Animation and firework options
    strings: ["Happy", "! Birthday !", "*.*.*.*.*", "Tú Linh", "Cute Phô Mai Que"], // Text lines
    charSize: 65,                                     // Font size for letters
    charSpacing: 45,                                  // Space between characters
    lineHeight: 70,                                   // Space between lines
    cx: w * 0.25,                                     // X center for text
    cy: h / 2 - 60,                                   // Y center for text
    fireworkPrevPoints: 10,                           // Trail points for fireworks
    fireworkBaseLineWidth: 5,                         // Base line width for fireworks
    fireworkAddedLineWidth: 8,                        // Additional random line width
    fireworkSpawnTime: 200,                           // Time before firework launches
    fireworkBaseReachTime: 30,                        // Base time for firework to reach target
    fireworkAddedReachTime: 30,                       // Additional random reach time
    fireworkCircleBaseSize: 20,                       // Base size for firework circle
    fireworkCircleAddedSize: 10,                      // Additional random circle size
    fireworkCircleBaseTime: 30,                       // Base time for circle animation
    fireworkCircleAddedTime: 30,                      // Additional random circle time
    fireworkCircleFadeBaseTime: 10,                   // Base time for circle fade
    fireworkCircleFadeAddedTime: 5,                   // Additional random fade time
    fireworkBaseShards: 10,                           // Base number of shards per firework
    fireworkAddedShards: 5,                           // Additional random shards
    fireworkShardPrevPoints: 3,                       // Trail points for shards
    fireworkShardBaseVel: 4,                          // Base velocity for shards
    fireworkShardAddedVel: 2,                         // Additional random velocity
    fireworkShardBaseSize: 6,                         // Base size for shards
    fireworkShardAddedSize: 3,                        // Additional random size
    gravity: 0.1,                                     // Gravity for shards
  },
  calc = {
    totalWidth: opts.charSpacing * Math.max(opts.strings[0].length, opts.strings[1].length), // Max width for text lines
  },
  Tau = Math.PI * 2,                                  // Full circle in radians
  TauQuarter = Tau / 4,                               // Quarter circle
  letters = [];                                       // Array to hold Letter objects

// ===============================
// Cursor Trail Effect
// ===============================

const cursorTrail = [];                               // Array for mouse trail points
const maxTrail = 12;                                  // Max number of trail points
document.addEventListener('mousemove', function (e) { // Listen for mouse movement
  cursorTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() }); // Add new point
  if (cursorTrail.length > maxTrail) cursorTrail.shift();             // Remove oldest if too many
});
let bounceStartTime = Date.now();                     // Used for text bounce animation

// ===============================  
// Load SmothyBubble font as .woff if not already loaded
// ===============================

const smothyBubbleFontStyle = document.createElement('style'); // Create style element
smothyBubbleFontStyle.innerHTML = `
@font-face {
  font-family: 'SmothyBubble';
  src: url('./src/SmothyBubble-d9D06.woff') format('woff');
  font-display: swap;
}
`;
document.head.appendChild(smothyBubbleFontStyle);     // Add font to document
ctx.font = "bold " + opts.charSize + "px SmothyBubble, monospace"; // Set font for canvas

// ===============================
// Letter Animation Class
// ===============================

function Letter(char, x, y) {
  this.char = char;                                   // The character to display
  this.x = x;                                         // X position
  this.y = y;                                         // Y position
  this.dx = -ctx.measureText(char).width / 2;         // Center character horizontally
  this.dy = +opts.charSize / 2;                       // Center character vertically
  this.fireworkDy = this.y - hh;                      // Vertical distance for firework
  var hue = (x / calc.totalWidth) * 360;              // Color hue based on position
  this.color = "hsl(hue,80%,50%)".replace("hue", hue);
  this.lightAlphaColor = "hsla(hue,80%,light%,alp)".replace("hue", hue);
  this.lightColor = "hsl(hue,80%,light%)".replace("hue", hue);
  this.alphaColor = "hsla(hue,80%,50%,alp)".replace("hue", hue);
  this.reset();                                       // Initialize animation state
}
Letter.prototype.reset = function () {
  this.phase = "firework";                            // Animation phase
  this.tick = 0;                                      // Animation tick
  this.spawned = false;                               // Has firework spawned
  this.spawningTime = (opts.fireworkSpawnTime * Math.random()) | 0; // Random spawn delay
  this.reachTime = (opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random()) | 0; // Random reach time
  this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random(); // Random line width
  this.prevPoints = [[0, hh, 0]];                     // Trail points for firework
};
Letter.prototype.step = function () {
  if (this.phase === "firework") {
    if (!this.spawned) {
      ++this.tick;
      if (this.tick >= this.spawningTime) {
        this.tick = 0;
        this.spawned = true;
      }
    } else {
      ++this.tick;
      var linearProportion = this.tick / this.reachTime,
        armonicProportion = Math.sin(linearProportion * TauQuarter),
        x = linearProportion * this.x,
        y = hh + armonicProportion * this.fireworkDy;
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
        this.phase = "contemplate";
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
  var vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
  this.vx = vx * vel;
  this.vy = vy * vel;
  this.x = x;
  this.y = y;
  this.prevPoints = [[x, y]];
  this.color = color;
  this.alive = true;
  this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
}
Shard.prototype.step = function () {
  this.x += this.vx;
  this.y += this.vy += opts.gravity;
  if (this.prevPoints.length > opts.fireworkShardPrevPoints)
    this.prevPoints.shift();
  this.prevPoints.push([this.x, this.y]);
  var lineWidthProportion = this.size / this.prevPoints.length;
  for (var k = 0; k < this.prevPoints.length - 1; ++k) {
    var point = this.prevPoints[k],
      point2 = this.prevPoints[k + 1];
    ctx.save();
    ctx.translate(point2[0], point2[1]);
    ctx.scale(0.12 * k, 0.12 * k);
    ctx.beginPath();
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
  if (this.prevPoints[0][1] > h || this.prevPoints[0][0] < 0 || this.prevPoints[0][0] > w) this.alive = false;
};

// ===============================
// Blinking Stars Background
// ===============================

const starCount = 165;                                // Number of stars
const stars = [];                                     // Array for star objects
for (let i = 0; i < starCount; i++) {                 // Create stars with random properties
  stars.push({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 2 + 1,
    blinkSpeed: Math.random() * 1.5 + 0.5,
    blinkPhase: Math.random() * Math.PI * 2
  });
}
function drawStars() {                                // Draw all stars with blinking effect
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    const t = Date.now() / 1000;
    const alpha = 0.5 + 0.5 * Math.sin(t * star.blinkSpeed + star.blinkPhase);
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

let cardSpawned = false;                              // Is the card spawned
let cardSpawnProgress = 0;                            // Card spawn progress
const cardSpawnDuration = 120;                        // Card spawn duration
const cardElement = document.querySelector('.birthday-card'); // Get card element

function animateCardSpawn() {
  if (!cardElement) return;                           // If no card, exit
  cardElement.style.display = "block";                // Show card
  cardElement.style.pointerEvents = ".card-inner";    // Enable pointer events
  cardElement.style.transformOrigin = "center center";// Set transform origin
  cardElement.style.transition = "none";              // Remove transition
  cardElement.style.opacity = cardSpawnProgress;      // Set opacity
  cardElement.style.transform = `translateY(-50%) scale(${0.7 + 0.3 * cardSpawnProgress})`; // Set transform
}

// ===============================
// Overlay for Click-to-Start
// ===============================

let animationStarted = false;                         // Animation started flag
const overlay = document.createElement('div');        // Create overlay div
overlay.style.position = 'fixed';                     // Fixed position
overlay.style.top = 0;                                // Top 0
overlay.style.left = 0;                               // Left 0
overlay.style.width = '100vw';                        // Full width
overlay.style.height = '100vh';                       // Full height
overlay.style.background = 'rgba(2,20,53,0.96)';      // Background color
overlay.style.zIndex = 10;                            // On top
overlay.style.display = 'flex';                       // Flex layout
overlay.style.alignItems = 'center';                  // Center vertically
overlay.style.justifyContent = 'center';              // Center horizontally
overlay.style.flexDirection = 'column';               // Column direction
overlay.style.color = '#fff';                         // Text color
overlay.style.fontSize = '2rem';                      // Font size
overlay.style.fontFamily = 'Segoe UI, Havana, sans-serif'; // Font family
overlay.style.letterSpacing = '2px';                  // Letter spacing
overlay.style.cursor = 'pointer';                     // Pointer cursor
overlay.innerHTML = `<div>✨ Click to Start ✨</div>`; // Overlay text
document.body.appendChild(overlay);                   // Add overlay to body

// ===============================
// Hide Card and Letter Until Animation Starts
// ===============================

const letterElement = document.querySelector('.letter'); // Get letter element
if (cardElement) {
  cardElement.style.opacity = "0";                   // Hide card
  cardElement.style.transform = "translateY(-50%) scale(0.7)"; // Shrink card
  cardElement.style.transition = "opacity 0.6s, transform 0.6s"; // Transition
  cardElement.style.pointerEvents = "none";          // Disable pointer events
  cardElement.style.display = "none";                // Hide card
  cardElement.addEventListener('click', function () {
    if (cardSpawned && cardElement.style.opacity === "1") {
      cardElement.classList.add("flipped");          // Flip card on click
    }
  });
  // Use the new close interaction for both desktop and mobile
  addCloseInteraction(
    cardElement,
    () => cardSpawned && cardElement.style.opacity === "1",
    () => cardElement.classList.remove("flipped")
  );
}
if (letterElement) {
  letterElement.style.opacity = "0";                 // Hide letter
  letterElement.style.transition = "opacity 0.6s";   // Transition
}

// ===============================
// Create Letters for Animated Strings
// ===============================

for (let i = 0; i < opts.strings.length; ++i) {
  for (var j = 0; j < opts.strings[i].length; ++j) {
    letters.push(
      new Letter(
        opts.strings[i][j],
        j * opts.charSpacing +
          opts.charSpacing / 2 -
          (opts.strings[i].length * opts.charSize) / 3
          + window.innerWidth / 4,
        i * opts.lineHeight +
          opts.lineHeight / 2
          + window.innerHeight * -0.46
      )
    );
  }
}

// ===============================
// Letter Card Animation State
// ===============================

const letterCardElement = document.querySelector('.letter'); // Get letter card element
let letterCardSpawned = false;                               // Is letter card spawned
let letterCardSpawnProgress = 0;                             // Letter card spawn progress
const letterCardSpawnDuration = 120;                         // Letter card spawn duration

function animateLetterCardSpawn() {
  if (!letterCardElement) return;                            // If no letter card, exit
  letterCardElement.style.display = "block";                 // Show letter card
  letterCardElement.style.transition = "none";               // Remove transition
  letterCardElement.style.opacity = letterCardSpawnProgress; // Set opacity
  letterCardElement.style.transform = `translateY(-50%) scale(${0.7 + 0.3 * letterCardSpawnProgress})`; // Set transform
}

if (letterCardElement) {
  letterCardElement.style.opacity = "0";                     // Hide letter card
  letterCardElement.style.transform = "translateY(-50%) scale(0.7)"; // Shrink letter card
  letterCardElement.style.transition = "opacity 0.6s, transform 0.6s"; // Transition
  letterCardElement.style.pointerEvents = "none";            // Disable pointer events
  letterCardElement.style.display = "none";                  // Hide letter card
  letterCardElement.addEventListener('click', function () {
    if (letterCardSpawned && letterCardElement.style.opacity === "1") {
      letterCardElement.classList.add("flipped");            // Flip letter card on click
    }
  });
  // Use the new close interaction for both desktop and mobile
  addCloseInteraction(
    letterCardElement,
    () => letterCardSpawned && letterCardElement.style.opacity === "1",
    () => letterCardElement.classList.remove("flipped")
  );
}

// ===============================
// Firework Shooting Line
// ===============================

const globalFireworkLines = [];
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
  this.color = color || "hsla(" + (Math.random() * 360) + ",80%,50%,1)";
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
    spawnFirework(this.targetX, this.targetY);
    this.done = true;
  }
};

// ===============================
// Firework & Shard System
// ===============================

const globalShards = [];
function spawnFirework(x, y) {
  const shardCount = (opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random()) | 0;
  const extraShards = 12 + Math.floor(Math.random() * 8);
  const totalShards = shardCount + extraShards;
  const angle = Tau / totalShards;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let vx = 1, vy = 0;
  for (let i = 0; i < totalShards; ++i) {
    let vx1 = vx;
    vx = vx * cos - vy * sin;
    vy = vy * cos + vx1 * sin;
    globalShards.push(new Shard(x, y, vx, vy, "hsla(" + (Math.random() * 360) + ",80%,60%,1)"));
  }
}
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
// Firework Interval
// ===============================

setInterval(() => {
  if (animationStarted) {
    const hits = 3 + Math.floor(Math.random() * 5);  // Random number of fireworks
    for (let i = 0; i < hits; i++) {
      const tx = Math.random() * w;                  // Random X
      const ty = Math.random() * h;                  // Random Y
      globalFireworkLines.push(new FireworkLine(tx, ty)); // Add firework
    }
  }
}, 1200);                                            // Every 1.2 seconds

// ===============================
// Allow user to spawn fireworks by clicking the canvas or the main panel
// ===============================

function handleFireworkClick(e) {
  if (!animationStarted) return;                     // Only if animation started
  let rect = c.getBoundingClientRect();              // Get canvas position
  const tx = e.clientX - rect.left;                  // X relative to canvas
  const ty = e.clientY - rect.top;                   // Y relative to canvas
  globalFireworkLines.push(new FireworkLine(tx, ty));// Add firework at click
}
c.addEventListener('click', handleFireworkClick);    // Listen for canvas click
const mainPanel = document.querySelector('.main-panel');
if (mainPanel) {
  mainPanel.addEventListener('click', handleFireworkClick); // Listen for main panel click
}

// ===============================
// Freeze animation, music, and ALL interactions when tab/app is not visible
// ===============================

let animationFrozen = false;
document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    animationFrozen = true;
    soundtrack1.pause();
    soundtrack2.pause();
    voice.pause();
    window.__intervals = window.__intervals || [];
    if (!window.__intervalsPatched) {
      const _setInterval = window.setInterval;
      const _clearInterval = window.clearInterval;
      window.setInterval = function(fn, delay, ...args) {
        const id = _setInterval(fn, delay, ...args);
        window.__intervals.push(id);
        return id;
      };
      window.clearInterval = function(id) {
        _clearInterval(id);
        window.__intervals = window.__intervals.filter(x => x !== id);
      };
      window.__intervalsPatched = true;
    }
    window.__intervals.forEach(id => clearInterval(id));
    window.__animationWasRunning = animationStarted;
    animationStarted = false;
    overlay.style.display = 'flex';
    overlay.innerHTML = `<div>⏸️ Paused (Switch back to continue)</div>`;
    overlay.style.pointerEvents = 'none';
  } else {
    animationFrozen = false;
    if (window.__animationWasRunning) animationStarted = true;
    if (animationStarted) {
      if (soundtrack1.paused && !soundtrack2.ended) soundtrack1.play();
      else if (soundtrack2.paused && !voice.ended) soundtrack2.play();
      else if (voice.paused) voice.play();
    }
    overlay.style.display = animationStarted ? 'none' : 'flex';
    overlay.innerHTML = `<div>✨ Click to Start ✨</div>`;
    if (!window.__fireworkInterval) {
      window.__fireworkInterval = setInterval(() => {
        if (animationStarted) {
          const hits = 3 + Math.floor(Math.random() * 5);
          for (let i = 0; i < hits; i++) {
            const tx = Math.random() * w;
            const ty = Math.random() * h;
            globalFireworkLines.push(new FireworkLine(tx, ty));
          }
        }
      }, 1200);
    }
  }
});

// ===============================
// Main Animation Loop
// ===============================
function anim() {
  window.requestAnimationFrame(anim);

  if (animationFrozen) return;

  // Draw background and fireworks
  let gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "#021435");
  gradient.addColorStop(1, "#4d5a70");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  drawStars();

  for (let i = 0; i < globalFireworkLines.length; ++i) {
    globalFireworkLines[i].step();
    if (globalFireworkLines[i].done) {
      globalFireworkLines.splice(i, 1);
      --i;
    }
  }
  stepAndDrawGlobalShards();

  if (!animationStarted) return;

  ctx.translate(hw, hh);

  var done = true;
  for (var l = 0; l < letters.length; ++l) {
    letters[l].step();
    if (letters[l].phase !== "done") done = false;
  }

  ctx.translate(-hw, -hh);

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
        }
      }
      animateCardSpawn();
    }
  }

  if (cardSpawned && !letterCardSpawned) {
    letterCardSpawnProgress += 1 / letterCardSpawnDuration;
    if (letterCardSpawnProgress >= 1) {
      letterCardSpawnProgress = 1;
      letterCardSpawned = true;
      if (letterCardElement) {
        letterCardElement.style.transition = "";
        letterCardElement.style.opacity = "1";
        letterCardElement.style.transform = "translateY(-50%) scale(1)";
        letterCardElement.style.pointerEvents = "auto";
      }
    }
    animateLetterCardSpawn();
  }

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
    }
    letterCardSpawned = false;
    letterCardSpawnProgress = 0;
    if (letterCardElement) {
      letterCardElement.style.opacity = "0";
      letterCardElement.style.transform = "translateY(-50%) scale(0.7)";
      letterCardElement.style.pointerEvents = "none";
      letterCardElement.style.display = "none";
    }
  }
}
anim();

// ===============================
// Music Playback Control
// ===============================

const soundtrack1 = new Audio('src/soundtrack1.mp3'); // First soundtrack
const soundtrack2 = new Audio('src/soundtrack2.mp3'); // Second soundtrack
const voice = new Audio('src/voice.mp3');             // Voice message
soundtrack1.loop = false;                             // No loop
soundtrack2.loop = false;                             // No loop

function playMusicSequence() {
  soundtrack1.currentTime = 0;                        // Start from beginning
  soundtrack2.currentTime = 0;
  soundtrack1.play();                                 // Play first soundtrack
  soundtrack1.onended = () => {
    soundtrack2.currentTime = 0;
    soundtrack2.play();                               // Play second soundtrack after first
  };
  soundtrack2.onended = () => {
    soundtrack1.pause();
    soundtrack2.pause();
    soundtrack1.currentTime = 0;
    soundtrack2.currentTime = 0;
    voice.currentTime = 0;
    voice.play();                                     // Play voice after music
  };
}

// ===============================
// Overlay Click: Start Animation
// ===============================

overlay.addEventListener('click', function () {
  overlay.style.display = 'none';                     // Hide overlay
  animationStarted = true;                            // Start animation
  playMusicSequence();                                // Start music
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
    el.addEventListener('contextmenu', e => e.preventDefault()); // Prevent context menu
    el.addEventListener('selectstart', e => e.preventDefault()); // Prevent select
  });
});

const phoneWidth = window.innerWidth;                 // Get phone width
const phoneHeight = window.innerHeight;               // Get phone height

// Example: log the resolution
console.log(`Phone resolution: ${phoneWidth} x ${phoneHeight}`);

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
*/

if (window.innerWidth < 600) {
  // Code for small/mobile screens
}

// ===============================
// Utility: Add Close Interaction (Double-Click/Double-Tap)
// ===============================

/**
 * Adds double-click (desktop) and double-tap (mobile) close interaction.
 * @param {HTMLElement} element - The element to attach the event to.
 * @param {Function} isSpawnedCallback - Should return true if the element is visible and interactive.
 * @param {Function} closeCallback - Called to close/unflip the element.
 */
function addCloseInteraction(element, isSpawnedCallback, closeCallback) {
  // Desktop: double-click to close
  element.addEventListener('dblclick', function (e) {
    e.preventDefault();
    if (isSpawnedCallback()) closeCallback();
  });

  // Mobile: double-tap to close
  let lastTap = 0;
  element.addEventListener('touchend', function (e) {
    const now = Date.now();
    if (now - lastTap < 400) { // 400ms threshold for double-tap
      e.preventDefault();
      if (isSpawnedCallback()) closeCallback();
    }
    lastTap = now;
  });
}

// ===============================
// Expand Button for Letter (Expand/Collapse)
// ===============================

const expandBtn = document.querySelector('.letter-expand-btn'); // Get expand button
if (expandBtn && letterElement) {
  expandBtn.addEventListener('click', () => {
    if (!letterElement.classList.contains('expanded')) {
      letterElement.classList.add('expanded'); // Add expanded class for animation
    } else {
      // Collapse with animation
      letterElement.classList.add('closing'); // Add closing class for collapse animation
      letterElement.addEventListener('animationend', function handler() {
        letterElement.classList.remove('expanded', 'closing'); // Remove classes after animation
        letterElement.removeEventListener('animationend', handler); // Remove event listener
      });
    }
  });
}

// Prevent copy, cut, and context menu on card and letter messages
['.birthday-card', '.letter', '.card-message', '.letter-message'].forEach(selector => {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener('copy', e => e.preventDefault());        // Block copy
    el.addEventListener('cut', e => e.preventDefault());         // Block cut
    el.addEventListener('contextmenu', e => e.preventDefault()); // Block context menu (long-press on mobile)
    el.addEventListener('selectstart', e => e.preventDefault()); // Block selection
  });
});
