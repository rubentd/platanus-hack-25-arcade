// Race to AGI - Two-Player Resource Collection Game
// Collect Data, Compute, and Funding to train your AGI before your opponent!

const ARCADE_CONTROLS = {
  // Player 1 - WASD + U for action
  'P1U': ['w'], 'P1D': ['s'], 'P1L': ['a'], 'P1R': ['d'],
  'P1A': ['u'], 'P1B': ['i'], 'P1C': ['o'],
  'P1X': ['j'], 'P1Y': ['k'], 'P1Z': ['l'],
  'START1': ['1', 'Enter'],
  
  // Player 2 - Arrow keys + R for action
  'P2U': ['ArrowUp'], 'P2D': ['ArrowDown'], 
  'P2L': ['ArrowLeft'], 'P2R': ['ArrowRight'],
  'P2A': ['r'], 'P2B': ['t'], 'P2C': ['y'],
  'P2X': ['f'], 'P2Y': ['g'], 'P2Z': ['h'],
  'START2': ['2']
};

const KEYBOARD_TO_ARCADE = {};
for (const [code, keys] of Object.entries(ARCADE_CONTROLS)) {
  if (keys) {
    (Array.isArray(keys) ? keys : [keys]).forEach(k => {
      KEYBOARD_TO_ARCADE[k] = code;
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scene: { create, update }
};

const game = new Phaser.Game(config);

// Resource types
const RESOURCES = {
  DATA: { color: 0x00ffff, icon: 'D', points: 20 },
  COMPUTE: { color: 0xff6b35, icon: 'C', points: 25 },
  FUNDING: { color: 0xffd700, icon: 'F', points: 15 }
};

const EVENTS = [
  { name: 'BUG', color: 0xff0000, penalty: 10, icon: 'X' },
  { name: 'SCANDAL', color: 0xff00ff, penalty: 15, icon: '!' },
  { name: 'LEAK', color: 0xff6600, penalty: 12, icon: '?' }
];

// Game state
let p1, p2, graphics, resources = [], events = [], gameOver = false;
let timer = 30000, timerText, p1Progress = 0, p2Progress = 0;
let p1ScoreText, p2ScoreText, statusText;
let resourceTimer = 0, eventTimer = 0;
let p1Speed = 3, p2Speed = 3;
let p1Boost = 0, p2Boost = 0;

function create() {
  graphics = this.add.graphics();
  
  // Player 1 (Blue startup - top left)
  p1 = {
    x: 100, y: 100,
    color: 0x0099ff,
    inventory: { DATA: 0, COMPUTE: 0, FUNDING: 0 },
    base: { x: 50, y: 50, w: 100, h: 60 }
  };
  
  // Player 2 (Green startup - bottom right)
  p2 = {
    x: 700, y: 500,
    color: 0x00ff66,
    inventory: { DATA: 0, COMPUTE: 0, FUNDING: 0 },
    base: { x: 650, y: 490, w: 100, h: 60 }
  };
  
  // UI
  p1ScoreText = this.add.text(20, 15, 'P1: 0%', { 
    fontSize: '20px', color: '#0099ff', fontWeight: 'bold'
  });
  
  p2ScoreText = this.add.text(720, 15, 'P2: 0%', { 
    fontSize: '20px', color: '#00ff66', fontWeight: 'bold'
  }).setOrigin(1, 0);
  
  timerText = this.add.text(400, 15, '30s', { 
    fontSize: '24px', color: '#ffff00', fontWeight: 'bold'
  }).setOrigin(0.5, 0);
  
  statusText = this.add.text(400, 580, 'Collect resources and deposit at your base!', {
    fontSize: '14px', color: '#888888'
  }).setOrigin(0.5, 1);
  
  // Instructions
  this.add.text(400, 50, 'P1: WASD + U to deposit | P2: Arrows + R to deposit', {
    fontSize: '12px', color: '#666666'
  }).setOrigin(0.5, 0);
  
  // Input
  this.keys = this.input.keyboard.addKeys({
    w: 'W', s: 'S', a: 'A', d: 'D', u: 'U',
    up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', r: 'R',
    one: 'ONE', two: 'TWO', enter: 'ENTER'
  });
  
  this.input.keyboard.on('keydown', (e) => {
    const key = KEYBOARD_TO_ARCADE[e.key] || e.key;
    if (gameOver && (key === 'START1' || key === 'START2')) {
      restartGame(this);
    }
  });
  
  // Spawn initial resources
  for (let i = 0; i < 5; i++) spawnResource();
  
  playTone(this, 440, 0.1);
}

function update(time, delta) {
  if (gameOver) return;
  
  // Timer
  timer -= delta;
  if (timer <= 0) {
    timer = 0;
    endGame(this);
    return;
  }
  timerText.setText(Math.ceil(timer / 1000) + 's');
  
  // Player movement
  const speed1 = p1Boost > 0 ? p1Speed * 1.5 : p1Speed;
  const speed2 = p2Boost > 0 ? p2Speed * 1.5 : p2Speed;
  
  if (this.keys.w.isDown) p1.y -= speed1;
  if (this.keys.s.isDown) p1.y += speed1;
  if (this.keys.a.isDown) p1.x -= speed1;
  if (this.keys.d.isDown) p1.x += speed1;
  
  if (this.keys.up.isDown) p2.y -= speed2;
  if (this.keys.down.isDown) p2.y += speed2;
  if (this.keys.left.isDown) p2.x -= speed2;
  if (this.keys.right.isDown) p2.x += speed2;
  
  // Boundaries
  p1.x = Phaser.Math.Clamp(p1.x, 15, 785);
  p1.y = Phaser.Math.Clamp(p1.y, 80, 570);
  p2.x = Phaser.Math.Clamp(p2.x, 15, 785);
  p2.y = Phaser.Math.Clamp(p2.y, 80, 570);
  
  // Deposit action
  if (Phaser.Input.Keyboard.JustDown(this.keys.u)) {
    depositResources(p1, 1, this);
  }
  if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
    depositResources(p2, 2, this);
  }
  
  // Resource collection
  resources.forEach((res, idx) => {
    if (dist(p1, res) < 20) {
      p1.inventory[res.type]++;
      resources.splice(idx, 1);
      playTone(this, 660, 0.08);
      updateStatus('P1 collected ' + res.type);
    } else if (dist(p2, res) < 20) {
      p2.inventory[res.type]++;
      resources.splice(idx, 1);
      playTone(this, 880, 0.08);
      updateStatus('P2 collected ' + res.type);
    }
  });
  
  // Event handling
  events.forEach((evt, idx) => {
    if (dist(p1, evt) < 20) {
      p1Progress = Math.max(0, p1Progress - evt.penalty);
      events.splice(idx, 1);
      playTone(this, 220, 0.15);
      updateStatus('P1 hit ' + evt.name + '! -' + evt.penalty + '%');
      updateProgress();
    } else if (dist(p2, evt) < 20) {
      p2Progress = Math.max(0, p2Progress - evt.penalty);
      events.splice(idx, 1);
      playTone(this, 220, 0.15);
      updateStatus('P2 hit ' + evt.name + '! -' + evt.penalty + '%');
      updateProgress();
    }
  });
  
  // Spawn resources
  resourceTimer += delta;
  if (resourceTimer > 2000 && resources.length < 10) {
    resourceTimer = 0;
    spawnResource();
  }
  
  // Spawn events
  eventTimer += delta;
  if (eventTimer > 5000 && events.length < 3) {
    eventTimer = 0;
    spawnEvent();
  }
  
  // Check win condition
  if (p1Progress >= 100 || p2Progress >= 100) {
    endGame(this);
  }
  
  // Update boosts
  if (p1Boost > 0) p1Boost -= delta;
  if (p2Boost > 0) p2Boost -= delta;
  
  draw();
}

function depositResources(player, playerNum, scene) {
  const base = player.base;
  const px = player.x, py = player.y;
  
  // Check if near base
  if (px >= base.x && px <= base.x + base.w && 
      py >= base.y && py <= base.y + base.h) {
    
    let total = 0;
    for (const type in player.inventory) {
      total += player.inventory[type] * RESOURCES[type].points;
      player.inventory[type] = 0;
    }
    
    if (total > 0) {
      if (playerNum === 1) {
        p1Progress = Math.min(100, p1Progress + total);
      } else {
        p2Progress = Math.min(100, p2Progress + total);
      }
      updateProgress();
      playTone(scene, 1200, 0.12);
      updateStatus('P' + playerNum + ' deposited! +' + total + '%');
      
      // Random caffeine boost
      if (Math.random() < 0.15) {
        if (playerNum === 1) p1Boost = 2000;
        else p2Boost = 2000;
        updateStatus('P' + playerNum + ' got CAFFEINE BOOST!');
      }
    }
  }
}

function spawnResource() {
  const types = Object.keys(RESOURCES);
  const type = types[Math.floor(Math.random() * types.length)];
  resources.push({
    x: 100 + Math.random() * 600,
    y: 100 + Math.random() * 440,
    type: type,
    ...RESOURCES[type]
  });
}

function spawnEvent() {
  const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  events.push({
    x: 100 + Math.random() * 600,
    y: 100 + Math.random() * 440,
    ...evt
  });
}

function draw() {
  graphics.clear();
  
  // Draw bases
  graphics.fillStyle(p1.color, 0.3);
  graphics.fillRect(p1.base.x, p1.base.y, p1.base.w, p1.base.h);
  graphics.lineStyle(3, p1.color, 1);
  graphics.strokeRect(p1.base.x, p1.base.y, p1.base.w, p1.base.h);
  
  graphics.fillStyle(p2.color, 0.3);
  graphics.fillRect(p2.base.x, p2.base.y, p2.base.w, p2.base.h);
  graphics.lineStyle(3, p2.color, 1);
  graphics.strokeRect(p2.base.x, p2.base.y, p2.base.w, p2.base.h);
  
  // Draw resources
  resources.forEach(res => {
    graphics.fillStyle(res.color, 1);
    graphics.fillCircle(res.x, res.y, 12);
    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.strokeCircle(res.x, res.y, 12);
  });
  
  // Draw events
  events.forEach(evt => {
    graphics.fillStyle(evt.color, 0.8);
    graphics.fillRect(evt.x - 12, evt.y - 12, 24, 24);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(evt.x - 12, evt.y - 12, 24, 24);
  });
  
  // Draw players
  const p1Size = p1Boost > 0 ? 18 : 15;
  const p2Size = p2Boost > 0 ? 18 : 15;
  
  graphics.fillStyle(p1.color, 1);
  graphics.fillCircle(p1.x, p1.y, p1Size);
  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeCircle(p1.x, p1.y, p1Size);
  
  graphics.fillStyle(p2.color, 1);
  graphics.fillCircle(p2.x, p2.y, p2Size);
  graphics.lineStyle(3, 0xffffff, 1);
  graphics.strokeCircle(p2.x, p2.y, p2Size);
  
  // Progress bars
  graphics.fillStyle(0x333333, 1);
  graphics.fillRect(200, 18, 200, 20);
  graphics.fillRect(400, 18, 200, 20);
  
  graphics.fillStyle(p1.color, 1);
  graphics.fillRect(200, 18, p1Progress * 2, 20);
  
  graphics.fillStyle(p2.color, 1);
  graphics.fillRect(400, 18, p2Progress * 2, 20);
}

function updateProgress() {
  p1ScoreText.setText('P1: ' + Math.floor(p1Progress) + '%');
  p2ScoreText.setText('P2: ' + Math.floor(p2Progress) + '%');
}

function updateStatus(msg) {
  statusText.setText(msg);
}

function endGame(scene) {
  gameOver = true;
  const winner = p1Progress > p2Progress ? 'PLAYER 1' : 
                 p2Progress > p1Progress ? 'PLAYER 2' : 'TIE';
  const winColor = p1Progress > p2Progress ? '#0099ff' : 
                   p2Progress > p1Progress ? '#00ff66' : '#ffff00';
  
  playTone(scene, winner === 'TIE' ? 440 : 880, 0.3);
  
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.8);
  overlay.fillRect(0, 0, 800, 600);
  
  scene.add.text(400, 250, winner + ' WINS!', {
    fontSize: winner === 'TIE' ? '48px' : '56px',
    color: winColor,
    fontWeight: 'bold',
    stroke: '#000000',
    strokeThickness: 8
  }).setOrigin(0.5);
  
  scene.add.text(400, 330, 'P1: ' + Math.floor(p1Progress) + '%  |  P2: ' + Math.floor(p2Progress) + '%', {
    fontSize: '32px',
    color: '#ffffff'
  }).setOrigin(0.5);
  
  const restartTxt = scene.add.text(400, 400, 'Press START to Restart', {
    fontSize: '24px',
    color: '#ffff00'
  }).setOrigin(0.5);
  
  scene.tweens.add({
    targets: restartTxt,
    alpha: { from: 1, to: 0.3 },
    duration: 700,
    yoyo: true,
    repeat: -1
  });
}

function restartGame(scene) {
  timer = 30000;
  p1Progress = 0;
  p2Progress = 0;
  resources = [];
  events = [];
  gameOver = false;
  resourceTimer = 0;
  eventTimer = 0;
  p1Boost = 0;
  p2Boost = 0;
  
  p1.x = 100; p1.y = 100;
  p2.x = 700; p2.y = 500;
  p1.inventory = { DATA: 0, COMPUTE: 0, FUNDING: 0 };
  p2.inventory = { DATA: 0, COMPUTE: 0, FUNDING: 0 };
  
  updateProgress();
  for (let i = 0; i < 5; i++) spawnResource();
  
  scene.scene.restart();
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function playTone(scene, freq, dur) {
  const ctx = scene.sound.context;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = freq;
  osc.type = 'square';
  
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}
