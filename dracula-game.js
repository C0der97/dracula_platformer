// ============================================
// DRÁCULA'S REVENGE - PLATFORM GAME
// ============================================

// Canvas and Context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const PLAYER_SPEED = 5;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;
const ENEMY_WIDTH = 35;
const ENEMY_HEIGHT = 35;
const PLATFORM_HEIGHT = 20;
const FLOOR_Y = 500;

// Image Assets
const images = {
    dracula: null,
    cat: null,
    dog: null,
    background: null
};

let imagesLoaded = false;
let loadedCount = 0;
const totalImages = 4;

// Load Images
function loadImages() {
    const imageSources = {
        dracula: 'dracula-sprite.png',
        cat: 'cat-sprite.png',
        dog: 'dog-sprite.png',
        background: 'background.png'
    };

    for (let key in imageSources) {
        images[key] = new Image();
        images[key].onload = function () {
            loadedCount++;
            if (loadedCount === totalImages) {
                imagesLoaded = true;
                console.log('All images loaded!');
            }
        };
        images[key].onerror = function () {
            console.error(`Failed to load image: ${imageSources[key]}`);
            loadedCount++;
            if (loadedCount === totalImages) {
                imagesLoaded = true;
            }
        };
        images[key].src = imageSources[key];
    }
}

// Call image loading immediately
loadImages();

// Load Background Music Audio
const backgroundMusic = new Audio('src/sounds/soundenv.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3; // 30% volume

// ============================================
// SOUND SYSTEM (Web Audio API)
// ============================================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let backgroundMusicGain = null;
let musicOscillator = null;
let soundEnabled = true;

// Create a simple oscillator-based sound
function playSound(frequency, duration, type = 'square', volume = 0.3) {
    if (!soundEnabled) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.error('Sound error:', e);
    }
}

// Jump sound - ascending beep
function playJumpSound() {
    if (!soundEnabled) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(200, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
}

// Enemy defeat sound - explosion
function playDefeatSound() {
    if (!soundEnabled) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.2);
}

// Damage sound - descending beep
function playDamageSound() {
    if (!soundEnabled) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);

    gain.gain.setValueAtTime(0.25, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
}

// Victory sound - ascending melody
function playVictorySound() {
    if (!soundEnabled) return;

    const notes = [262, 330, 392, 523]; // C, E, G, C
    notes.forEach((freq, i) => {
        setTimeout(() => playSound(freq, 0.2, 'sine', 0.3), i * 150);
    });
}

// Game Over sound - descending melody
function playGameOverSound() {
    if (!soundEnabled) return;

    const notes = [392, 330, 262, 196]; // G, E, C, G
    notes.forEach((freq, i) => {
        setTimeout(() => playSound(freq, 0.3, 'triangle', 0.25), i * 200);
    });
}

// Background music - play MP3 file
function startBackgroundMusic() {
    if (!soundEnabled) return;

    try {
        backgroundMusic.currentTime = 0; // Start from beginning
        backgroundMusic.play().catch(e => {
            console.log('Background music autoplay blocked:', e);
        });
    } catch (e) {
        console.error('Background music error:', e);
    }
}

function stopBackgroundMusic() {
    try {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    } catch (e) {
        console.error('Stop music error:', e);
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    if (!soundEnabled) {
        stopBackgroundMusic();
    }
    return soundEnabled;
}

// Game State
let gameState = 'start'; // start, playing, paused, gameover, victory
let score = 0;
let lives = 3;
let gameTime = 0;
let keys = {};
let animationId;

// Combo System
let comboCount = 0;
let comboMultiplier = 1;
let comboTimer = 0;
const COMBO_TIMEOUT = 3000; // 3 seconds

// Game Objects
let player;
let platforms = [];
let enemies = [];
let particles = [];
let collectibles = [];
let projectiles = [];
let currentLevel = 0;

// Timing
let lastTime = 0;
const FPS = 60;
const frameDelay = 1000 / FPS;

// ============================================
// LEVEL DATA STRUCTURE
// ============================================
const levels = [
    // Level 1: Entrance
    {
        id: 1,
        name: "Entrada del Castillo",
        platforms: [
            { x: 200, y: 450, width: 150 },
            { x: 400, y: 380, width: 120 },
            { x: 600, y: 320, width: 150 },
            { x: 800, y: 400, width: 180 },
        ],
        movingPlatforms: [
            { x: 150, y: 280, width: 100, endX: 350, endY: 280, speed: 2 }
        ],
        enemies: [
            { x: 300, y: 200, type: 'cat' },
            { x: 500, y: 200, type: 'dog' },
            { x: 850, y: 200, type: 'cat' },
        ],
        collectibles: [
            { x: 250, y: 400, type: 'coin' },
            { x: 450, y: 330, type: 'coin' },
            { x: 650, y: 270, type: 'coin' },
            { x: 700, y: 150, type: 'heart' },
        ]
    },
    // Level 2: Garden
    {
        id: 2,
        name: "Jardín Gótico",
        platforms: [
            { x: 100, y: 480, width: 150 },
            { x: 300, y: 420, width: 100 },
            { x: 500, y: 360, width: 120 },
            { x: 700, y: 300, width: 150 },
            { x: 200, y: 240, width: 100 },
            { x: 450, y: 180, width: 130 },
        ],
        movingPlatforms: [
            { x: 600, y: 450, width: 100, endX: 800, endY: 450, speed: 3 },
            { x: 350, y: 300, width: 80, endX: 350, endY: 200, speed: 2 }
        ],
        enemies: [
            { x: 350, y: 200, type: 'cat' },
            { x: 550, y: 200, type: 'dog' },
            { x: 750, y: 150, type: 'cat' },
            { x: 400, y: 250, type: 'bat' },
            { x: 650, y: 200, type: 'bat' },
            { x: 200, y: 100, type: 'spider', ceilingY: 100 },
            { x: 500, y: 80, type: 'spider', ceilingY: 80 },
        ],
        collectibles: [
            { x: 350, y: 390, type: 'coin' },
            { x: 550, y: 330, type: 'coin' },
            { x: 750, y: 270, type: 'coin' },
            { x: 250, y: 210, type: 'coin' },
            { x: 500, y: 150, type: 'star' },
            { x: 150, y: 450, type: 'heart' },
        ]
    },
    // Level 3: Castle Towers
    {
        id: 3,
        name: "Torres del Castillo",
        platforms: [
            { x: 50, y: 490, width: 120 },
            { x: 250, y: 440, width: 100 },
            { x: 450, y: 380, width: 120 },
            { x: 650, y: 320, width: 100 },
            { x: 850, y: 260, width: 130 },
            { x: 300, y: 220, width: 110 },
            { x: 550, y: 160, width: 100 },
        ],
        movingPlatforms: [
            { x: 100, y: 350, width: 90, endX: 200, endY: 350, speed: 2.5 },
            { x: 500, y: 280, width: 90, endX: 600, endY: 280, speed: 3 },
            { x: 700, y: 420, width: 80, endX: 700, endY: 320, speed: 2 }
        ],
        enemies: [
            { x: 300, y: 200, type: 'dog' },
            { x: 500, y: 150, type: 'dog' },
            { x: 700, y: 200, type: 'cat' },
            { x: 200, y: 300, type: 'bat' },
            { x: 500, y: 250, type: 'bat' },
            { x: 750, y: 200, type: 'bat' },
        ],
        collectibles: [
            { x: 100, y: 460, type: 'coin' },
            { x: 300, y: 410, type: 'coin' },
            { x: 500, y: 350, type: 'coin' },
            { x: 700, y: 290, type: 'coin' },
            { x: 900, y: 230, type: 'coin' },
            { x: 600, y: 130, type: 'star' },
            { x: 350, y: 190, type: 'heart' },
        ]
    },
    // Level 4: Dark Laboratory
    {
        id: 4,
        name: "Laboratorio Oscuro",
        platforms: [
            { x: 100, y: 490, width: 100 },
            { x: 300, y: 450, width: 80 },
            { x: 500, y: 400, width: 90 },
            { x: 700, y: 350, width: 100 },
            { x: 200, y: 300, width: 80 },
            { x: 450, y: 250, width: 100 },
            { x: 650, y: 200, width: 80 },
            { x: 300, y: 150, width: 90 },
        ],
        movingPlatforms: [
            { x: 50, y: 380, width: 80, endX: 150, endY: 380, speed: 2 },
            { x: 550, y: 320, width: 70, endX: 550, endY: 220, speed: 2.5 },
            { x: 800, y: 450, width: 90, endX: 900, endY: 450, speed: 3 }
        ],
        enemies: [
            { x: 350, y: 200, type: 'dog' },
            { x: 550, y: 150, type: 'dog' },
            { x: 250, y: 250, type: 'cat' },
            { x: 700, y: 200, type: 'cat' },
            { x: 150, y: 320, type: 'bat' },  // High bat - needs projectiles
            { x: 450, y: 280, type: 'bat' },
            { x: 650, y: 230, type: 'bat' },
            { x: 850, y: 250, type: 'bat' },  // Far bat - needs projectiles
            { x: 400, y: 180, type: 'cat' },
            { x: 600, y: 150, type: 'dog' },
        ],
        collectibles: [
            { x: 350, y: 420, type: 'coin' },
            { x: 550, y: 370, type: 'coin' },
            { x: 750, y: 320, type: 'coin' },
            { x: 250, y: 270, type: 'coin' },
            { x: 500, y: 220, type: 'coin' },
            { x: 700, y: 170, type: 'coin' },
            { x: 150, y: 460, type: 'heart' },
            { x: 500, y: 140, type: 'star' },
        ]
    }
];

// ============================================
// PLAYER CLASS
// ============================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.velocityX = 0;
        this.velocityY = 0;
        this.jumping = false;
        this.onGround = false;
        this.invincible = false;
        this.invincibleTime = 0;
        this.direction = 1; // 1 = right, -1 = left
        this.animFrame = 0;
        this.animTimer = 0;
        this.shootCooldown = 0;
        this.shootCooldownTime = 500; // 0.5 seconds between shots
        this.jumpsRemaining = 2; // Double jump enabled
        this.hasDoubleJump = true;
    }

    update(deltaTime) {
        // Horizontal Movement
        if (keys['ArrowLeft']) {
            this.velocityX = -PLAYER_SPEED;
            this.direction = -1;
        } else if (keys['ArrowRight']) {
            this.velocityX = PLAYER_SPEED;
            this.direction = 1;
        } else {
            this.velocityX *= 0.8; // Friction
        }

        // Jump
        if (keys['ArrowUp'] && this.jumpsRemaining > 0 && !this.wasJumpPressed) {
            this.velocityY = JUMP_FORCE;
            this.jumping = true;
            this.onGround = false;
            this.jumpsRemaining--;

            // Second jump effect
            if (this.jumpsRemaining === 0) {
                createParticles(this.x + this.width / 2, this.y + this.height, '#9933ff');
                playSound(600, 0.15, 'sine', 0.2);
            } else {
                playJumpSound();
            }

            this.wasJumpPressed = true;
        }

        if (!keys['ArrowUp']) {
            this.wasJumpPressed = false;
        }

        // Apply Gravity
        this.velocityY += GRAVITY;

        // Update Position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Boundary Check
        if (this.x < 0) this.x = 0;
        if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;

        // Reset onGround before checking collisions
        this.onGround = false;

        // Floor Collision
        if (this.y + this.height >= FLOOR_Y) {
            this.y = FLOOR_Y - this.height;
            this.velocityY = 0;
            this.jumping = false;
            this.onGround = true;
            this.jumpsRemaining = 2; // Reset double jump
        }

        // Platform Collision
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.jumping = false;
                    this.onGround = true;
                    this.jumpsRemaining = 2; // Reset double jump
                }
            }
        });

        // Invincibility Timer
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        // Shoot Cooldown
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        // Animation
        if (Math.abs(this.velocityX) > 0.5) {
            this.animTimer += deltaTime;
            if (this.animTimer > 100) {
                this.animFrame = (this.animFrame + 1) % 2;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
            this.x + this.width > obj.x &&
            this.y < obj.y + obj.height &&
            this.y + this.height > obj.y;
    }

    takeDamage() {
        if (!this.invincible) {
            lives--;
            updateHUD();
            this.invincible = true;
            this.invincibleTime = 2000;
            playDamageSound();
            achievementStats.damageTakenThisLevel++; // Track damage
            vibrateGamepad(300, 0.8); // Vibrate controller

            if (lives <= 0) {
                gameOver();
            }
        }
    }

    shoot() {
        if (this.shootCooldown > 0) return;

        // Create projectile in front of player
        const projectileX = this.direction === 1 ? this.x + this.width : this.x;
        const projectileY = this.y + this.height / 2;

        projectiles.push(new Projectile(projectileX, projectileY, this.direction));

        // Set cooldown
        this.shootCooldown = this.shootCooldownTime;

        // Play shoot sound
        playSound(400, 0.1, 'square', 0.15);
    }

    draw() {
        ctx.save();

        // Flicker when invincible
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Translate to player position
        ctx.translate(this.x, this.y);

        // Flip sprite if moving left
        if (this.direction === -1) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }

        // Draw Dracula with geometric shapes
        // Cape
        ctx.fillStyle = '#2c0000';
        ctx.fillRect(-5, 5, this.width + 10, this.height - 5);

        // Body
        ctx.fillStyle = '#000';
        ctx.fillRect(5, 15, this.width - 10, this.height - 20);

        // Head
        ctx.fillStyle = '#f0e6d2';
        ctx.fillRect(10, 0, this.width - 20, 20);

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(15, 8, 4, 4);
        ctx.fillRect(this.width - 19, 8, 4, 4);

        // Fangs
        ctx.fillStyle = '#fff';
        ctx.fillRect(17, 15, 3, 5);
        ctx.fillRect(this.width - 20, 15, 3, 5);

        // Cape collar
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(0, 18, 8, 12);
        ctx.fillRect(this.width - 8, 18, 8, 12);

        ctx.restore();
    }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * 8;
        this.velocityY = (Math.random() - 0.5) * 8 - 2;
        this.life = 1;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityY += 0.3;
        this.life -= 0.02;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// ============================================
// GAME FUNCTIONS
// ============================================
function initGame() {
    // Set Canvas Size
    canvas.width = 1000;
    canvas.height = 600;

    // Load current level
    loadLevel(currentLevel);

    updateHUD();
}

function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        gameComplete();
        return;
    }

    const level = levels[levelIndex];

    // Create Player at start position
    player = new Player(100, 300);

    // Clear arrays
    platforms = [];
    enemies = [];
    collectibles = [];
    particles = [];

    // Create Platforms from level data
    level.platforms.forEach(p => {
        platforms.push(new Platform(p.x, p.y, p.width));
    });

    // Create Moving Platforms
    if (level.movingPlatforms) {
        level.movingPlatforms.forEach(mp => {
            platforms.push(new MovingPlatform(mp.x, mp.y, mp.width, mp.endX, mp.endY, mp.speed));
        });
    }

    // Create Enemies
    level.enemies.forEach(e => {
        if (e.type === 'bat') {
            enemies.push(new Bat(e.x, e.y));
        } else if (e.type === 'spider') {
            enemies.push(new Spider(e.x, e.y, e.ceilingY || 50));
        } else if (e.type === 'ghost') {
            enemies.push(new Ghost(e.x, e.y));
        } else {
            enemies.push(new Enemy(e.x, e.y, e.type));
        }
    });

    // Create Collectibles
    if (level.collectibles) {
        level.collectibles.forEach(c => {
            collectibles.push(new Collectible(c.x, c.y, c.type));
        });
    }

    // Reset particles
    particles = [];
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives));
    document.getElementById('timer').textContent = Math.floor(gameTime / 1000);

    // Update combo display
    const comboDisplay = document.getElementById('combo-display');
    if (comboDisplay) {
        if (comboCount > 0) {
            comboDisplay.style.display = 'block';
            comboDisplay.textContent = `COMBO x${comboMultiplier} (${comboCount})`;

            // Color based on multiplier
            if (comboMultiplier >= 5) comboDisplay.style.color = '#ff00ff';
            else if (comboMultiplier >= 4) comboDisplay.style.color = '#ff0000';
            else if (comboMultiplier >= 3) comboDisplay.style.color = '#ff6600';
            else comboDisplay.style.color = '#ffff00';
        } else {
            comboDisplay.style.display = 'none';
        }
    }
}

function update(deltaTime) {
    // Update gamepad in all states
    updateGamepad();
    updateMenuNavigation();

    if (gameState !== 'playing') return;

    // Update game time
    gameTime += deltaTime;

    // Update combo timer
    updateCombo(deltaTime);
    
    // Update gamepad
    updateGamepad();

    // Update Player
    player.update(deltaTime);

    // Update Enemies
    enemies.forEach(enemy => enemy.update(deltaTime));

    // Update Collectibles
    collectibles.forEach(collectible => collectible.update(deltaTime));

    // Update Projectiles
    projectiles = projectiles.filter(p => p.active);
    projectiles.forEach(projectile => projectile.update(deltaTime));

    // Update Moving Platforms
    platforms.forEach(platform => {
        if (platform.update) platform.update(deltaTime);
    });

    // Update Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());

    // Check Level Complete Condition
    const aliveEnemies = enemies.filter(e => e.alive).length;
    if (aliveEnemies === 0) {
        nextLevel();
    }

    updateHUD();
}

function draw() {
    ctx.save();

    // Apply screen shake
    if (cameraShake > 0) {
        const shakeX = (Math.random() - 0.5) * cameraShake;
        const shakeY = (Math.random() - 0.5) * cameraShake;
        ctx.translate(shakeX, shakeY);
        cameraShake *= 0.9; // Decay
        if (cameraShake < 0.1) cameraShake = 0;
    }

    // Draw Background
    if (images.background && images.background.complete) {
        // Draw the background image scaled to canvas
        ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: Original simple background
        ctx.fillStyle = '#0a0015';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 137) % canvas.width;
            const y = (i * 197) % canvas.height;
            const size = (i % 3) + 1;
            ctx.fillRect(x, y, size, size);
        }

        // Draw Moon
        ctx.fillStyle = '#ffff99';
        ctx.beginPath();
        ctx.arc(850, 80, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Platforms
    platforms.forEach(platform => platform.draw());

    // Draw Floor
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, FLOOR_Y, canvas.width, canvas.height - FLOOR_Y);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, FLOOR_Y, canvas.width, 5);

    // Draw Collectibles
    collectibles.forEach(collectible => collectible.draw());

    // Draw Enemies
    enemies.forEach(enemy => enemy.draw());

    // Draw Projectiles
    projectiles.forEach(projectile => projectile.draw());

    // Draw Player
    player.draw();

    // Draw Particles
    particles.forEach(p => p.draw());

    // Draw Level Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    if (levels[currentLevel]) {
        ctx.fillText(`Nivel ${currentLevel + 1}: ${levels[currentLevel].name}`, canvas.width / 2, 30);
    }
    ctx.textAlign = 'left';

    ctx.restore(); // End screen shake
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;

    if (deltaTime >= frameDelay) {
        update(deltaTime);
        draw();
        lastTime = currentTime - (deltaTime % frameDelay);
    }

    if (gameState === 'playing' || gameState === 'paused') {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    // Reset game state
    currentLevel = 0;
    score = 0;
    lives = 3;
    gameTime = 0;

    initGame();
    gameState = 'playing';
    showScreen('game-screen');
    lastTime = performance.now();
    startBackgroundMusic();
    gameLoop(lastTime);
}

function nextLevel() {
    currentLevel++;

    if (currentLevel >= levels.length) {
        gameComplete();
    } else {
        gameState = 'paused';
        playVictorySound();

        // Show transition message
        setTimeout(() => {
            loadLevel(currentLevel);
            gameState = 'playing';
        }, 2000);
    }
}

function gameComplete() {
    gameState = 'victory';
    document.getElementById('victory-score').textContent = score;
    showScreen('victory-screen');
    stopBackgroundMusic();
    playVictorySound();
}

function pauseGame() {
    gameState = 'paused';
    showScreen('pause-screen');
}

function resumeGame() {
    gameState = 'playing';
    showScreen('game-screen');
    lastTime = performance.now();
    gameLoop(lastTime);
}

function gameOver() {
    gameState = 'gameover';
    document.getElementById('final-score').textContent = score;
    showScreen('gameover-screen');
    stopBackgroundMusic();
    playGameOverSound();
}

function victory() {
    gameState = 'victory';
    document.getElementById('victory-score').textContent = score;
    showScreen('victory-screen');
    stopBackgroundMusic();
    playVictorySound();
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function returnToMenu() {
    gameState = 'start';
    showScreen('start-screen');
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Shoot with X key
    if (e.key === 'x' || e.key === 'X') {
        if (player && gameState === 'playing') {
            player.shoot();
        }
    }

    if (e.key === ' ') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Button Events
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('pause-btn').addEventListener('click', pauseGame);
document.getElementById('resume-btn').addEventListener('click', resumeGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', returnToMenu);
document.getElementById('restart-gameover-btn').addEventListener('click', startGame);
document.getElementById('menu-gameover-btn').addEventListener('click', returnToMenu);
document.getElementById('restart-victory-btn').addEventListener('click', startGame);
document.getElementById('menu-victory-btn').addEventListener('click', returnToMenu);

// ============================================
// INITIALIZE
// ============================================
showScreen('start-screen');

// ============================================
// MOBILE TOUCH CONTROLS
// ============================================
// Detect touch device and show controls
function initMobileControls() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const mobileControls = document.getElementById('mobile-controls');

    if (isTouchDevice && mobileControls) {
        mobileControls.classList.add('visible');

        // Left button
        const btnLeft = document.getElementById('btn-left');
        btnLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['ArrowLeft'] = true;
        });
        btnLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowLeft'] = false;
        });

        // Right button
        const btnRight = document.getElementById('btn-right');
        btnRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['ArrowRight'] = true;
        });
        btnRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowRight'] = false;
        });

        // Jump button
        const btnJump = document.getElementById('btn-jump');
        btnJump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys['ArrowUp'] = true;
        });
        btnJump.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys['ArrowUp'] = false;
        });

        // Prevent buttons from sticking
        [btnLeft, btnRight, btnJump].forEach(btn => {
            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                keys['ArrowLeft'] = false;
                keys['ArrowRight'] = false;
                keys['ArrowUp'] = false;
            });
        });
    }
}

// Initialize mobile controls on load
initMobileControls();

// Add shoot button handler for mobile
const btnShoot = document.getElementById('btn-shoot');
if (btnShoot) {
    btnShoot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (player && gameState === 'playing') {
            player.shoot();
        }
    });
}

// ============================================
// COMBO SYSTEM FUNCTIONS
// ============================================
function addCombo() {
    comboCount++;
    comboTimer = COMBO_TIMEOUT;

    // Calculate multiplier (max 5x)
    if (comboCount >= 15) comboMultiplier = 5;
    else if (comboCount >= 10) comboMultiplier = 4;
    else if (comboCount >= 5) comboMultiplier = 3;
    else if (comboCount >= 3) comboMultiplier = 2;
    else comboMultiplier = 1;

    // Play combo sound
    if (comboMultiplier >= 3) {
        playSound(800 + (comboMultiplier * 100), 0.15, 'square', 0.2);
    
    // Check for achievements
    checkAchievements();
    checkAchievements();
    console.log('[COMBO]', comboCount, 'x' + comboMultiplier);
    }
}

function resetCombo() {
    comboCount = 0;
    comboMultiplier = 1;
    comboTimer = 0;
}

function updateCombo(deltaTime) {
    if (comboTimer > 0) {
        comboTimer -= deltaTime;
        if (comboTimer <= 0) {
            resetCombo();
        }
    }
}

// ============================================
// SCREEN SHAKE SYSTEM
// ============================================
let cameraShake = 0;

function screenShake(intensity) {
    cameraShake = intensity;
}

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================
const achievements = {
    speedRunner: {
        name: "⚡ Speed Runner",
        description: "Completa un nivel en menos de 60 segundos",
        unlocked: false
    },
    comboMaster: {
        name: "🔥 Combo Master",
        description: "Alcanza combo x3 (5 kills seguidos)",
        unlocked: false
    },
    untouchable: {
        name: "👻 Intocable",
        description: "Completa un nivel sin recibir daño",
        unlocked: false
    },
    sharpShooter: {
        name: "🎯 Tirador Experto",
        description: "Derrota 10 enemigos con proyectiles",
        unlocked: false
    },
    doubleJumper: {
        name: "🦇 Acróbata",
        description: "Usa el doble salto 20 veces",
        unlocked: false
    }
};

let achievementStats = {
    projectileKills: 0,
    doubleJumps: 0,
    levelStartTime: 0,
    damageTakenThisLevel: 0
};

function loadAchievements() {
    const saved = localStorage.getItem('dracula_achievements');
    if (saved) {
        const savedData = JSON.parse(saved);
        Object.keys(achievements).forEach(key => {
            if (savedData[key]) {
                achievements[key].unlocked = savedData[key].unlocked;
            }
        });
    }
}

function saveAchievements() {
    localStorage.setItem('dracula_achievements', JSON.stringify(achievements));
}

function unlockAchievement(achievementKey) {
    console.log('[ACHIEVEMENT]', achievementKey, achievements[achievementKey]);
    if (!achievements[achievementKey].unlocked) {
        achievements[achievementKey].unlocked = true;
        saveAchievements();
        showAchievementNotification(achievements[achievementKey]);
    }
}

function showAchievementNotification(achievement) {
    console.log('[NOTIFICATION] Attempting to show:', achievement);
    const popup = document.getElementById('achievement-popup');
    console.log('[NOTIFICATION] Popup element:', popup);
    if (!popup) return;

    const nameEl = popup.querySelector('.achievement-name');
    const descEl = popup.querySelector('.achievement-desc');

    if (nameEl) nameEl.textContent = achievement.name;
    if (descEl) descEl.textContent = achievement.description;

    popup.classList.add('show');
    console.log('[NOTIFICATION] Added show class');

    playSound(880, 0.3, 'sine', 0.4);

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function checkAchievements() {
    console.log('[CHECK] Combo:', comboMultiplier, 'Projectiles:', achievementStats.projectileKills, 'DoubleJumps:', achievementStats.doubleJumps);
    // Combo Master
    if (comboMultiplier >= 3) {
        unlockAchievement('comboMaster');
    }

    // Sharp Shooter
    if (achievementStats.projectileKills >= 10) {
        unlockAchievement('sharpShooter');
    }

    // Double Jumper
    if (achievementStats.doubleJumps >= 20) {
        unlockAchievement('doubleJumper');
    }
}

// ============================================
// GAMEPAD SUPPORT
// ============================================
let gamepadConnected = false;
let gamepad = null;
let gamepadButtonsPressed = {};

// Gamepad button mapping (standard layout)
const GAMEPAD_BUTTONS = {
    A: 0,        // Jump
    B: 1,        // Shoot
    X: 2,
    Y: 3,
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    SELECT: 8,
    START: 9,    // Pause
    L_STICK: 10,
    R_STICK: 11,
    DPAD_UP: 12,
    DPAD_DOWN: 13,
    DPAD_LEFT: 14,
    DPAD_RIGHT: 15
};

window.addEventListener('gamepadconnected', (e) => {
    console.log('Gamepad connected:', e.gamepad.id);
    gamepadConnected = true;
    gamepad = e.gamepad;
    showGamepadIndicator();
});

window.addEventListener('gamepaddisconnected', (e) => {
    console.log('Gamepad disconnected');
    gamepadConnected = false;
    gamepad = null;
    hideGamepadIndicator();
});

function showGamepadIndicator() {
    const indicator = document.getElementById('gamepad-indicator');
    if (indicator) {
        indicator.style.display = 'block';
    }
}

function hideGamepadIndicator() {
    const indicator = document.getElementById('gamepad-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

function updateGamepad() {
    if (!gamepadConnected) return;

    // Get the latest gamepad state
    const gamepads = navigator.getGamepads();
    gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (!gamepad) return;

    // Left stick / D-Pad for movement
    const axisX = gamepad.axes[0]; // Left stick X axis
    const threshold = 0.3;

    // Simulate keyboard keys for gamepad input
    if (axisX < -threshold || gamepad.buttons[GAMEPAD_BUTTONS.DPAD_LEFT]?.pressed) {
        keys['ArrowLeft'] = true;
        keys['ArrowRight'] = false;
    } else if (axisX > threshold || gamepad.buttons[GAMEPAD_BUTTONS.DPAD_RIGHT]?.pressed) {
        keys['ArrowRight'] = true;
        keys['ArrowLeft'] = false;
    } else {
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
    }

    // A button for jump
    if (gamepad.buttons[GAMEPAD_BUTTONS.A]?.pressed) {
        if (!gamepadButtonsPressed['jump']) {
            keys['ArrowUp'] = true;
            gamepadButtonsPressed['jump'] = true;
        }
    } else {
        keys['ArrowUp'] = false;
        gamepadButtonsPressed['jump'] = false;
    }

    // B button for shoot
    if (gamepad.buttons[GAMEPAD_BUTTONS.B]?.pressed) {
        if (!gamepadButtonsPressed['shoot'] && player && gameState === 'playing') {
            player.shoot();
            gamepadButtonsPressed['shoot'] = true;
        }
    } else {
        gamepadButtonsPressed['shoot'] = false;
    }

    // Start button for pause
    if (gamepad.buttons[GAMEPAD_BUTTONS.START]?.pressed) {
        if (!gamepadButtonsPressed['pause']) {
            if (gameState === 'playing') {
                pauseGame();
            } else if (gameState === 'paused') {
            } else if (gameState === 'start') {
                startGame();
                resumeGame();
            } else if (gameState === 'start') {
                startGame();
            }
            gamepadButtonsPressed['pause'] = true;
        }
    } else {
        gamepadButtonsPressed['pause'] = false;
    }
}

function vibrateGamepad(duration = 200, intensity = 1.0) {
    if (!gamepad || !gamepad.vibrationActuator) return;

    gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: intensity * 0.5,
        strongMagnitude: intensity
    });
}

// ============================================
// GAMEPAD MENU NAVIGATION SYSTEM
// ============================================
let menuButtons = [];
let selectedButtonIndex = 0;

function getMenuButtons(screen) {
    const buttons = [];
    const screenEl = document.getElementById(screen);
    if (!screenEl) return buttons;
    
    const btnElements = screenEl.querySelectorAll('button.game-btn');
    btnElements.forEach((btn, index) => {
        if (btn.offsetParent !== null) { // visible
            buttons.push({
                element: btn,
                index: index
            });
        }
    });
    return buttons;
}

function updateMenuSelection() {
    // Remove previous highlights
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.classList.remove('gamepad-selected');
    });
    
    // Highlight current
    if (menuButtons.length > 0 && menuButtons[selectedButtonIndex]) {
        menuButtons[selectedButtonIndex].element.classList.add('gamepad-selected');
    }
}

function updateMenuNavigation() {
    if (!gamepadConnected || !gamepad) return;
    
    // Only navigate in menu screens
    if (gameState === 'playing') return;
    
    // Get current screen buttons
    let currentScreen = 'start-screen';
    if (gameState === 'paused') currentScreen = 'pause-screen';
    else if (gameState === 'gameover') currentScreen = 'gameover-screen';
    else if (gameState === 'victory') currentScreen = 'victory-screen';
    
    menuButtons = getMenuButtons(currentScreen);
    
    if (menuButtons.length === 0) return;
    
    // D-Pad / Left Stick Navigation
    const axisY = gamepad.axes[1]; // Vertical axis
    const threshold = 0.5;
    
    if ((axisY < -threshold || gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP]?.pressed) && !gamepadButtonsPressed['up']) {
        selectedButtonIndex = Math.max(0, selectedButtonIndex - 1);
        updateMenuSelection();
        playSound(400, 0.05, 'square', 0.1);
        gamepadButtonsPressed['up'] = true;
    } else if (!gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP]?.pressed && Math.abs(axisY) < threshold) {
        gamepadButtonsPressed['up'] = false;
    }
    
    if ((axisY > threshold || gamepad.buttons[GAMEPAD_BUTTONS.DPAD_DOWN]?.pressed) && !gamepadButtonsPressed['down']) {
        selectedButtonIndex = Math.min(menuButtons.length - 1, selectedButtonIndex + 1);
        updateMenuSelection();
        playSound(400, 0.05, 'square', 0.1);
        gamepadButtonsPressed['down'] = true;
    } else if (!gamepad.buttons[GAMEPAD_BUTTONS.DPAD_DOWN]?.pressed && Math.abs(axisY) < threshold) {
        gamepadButtonsPressed['down'] = false;
    }
    
    // A button to confirm
    if (gamepad.buttons[GAMEPAD_BUTTONS.A]?.pressed && !gamepadButtonsPressed['confirm']) {
        if (menuButtons[selectedButtonIndex]) {
            menuButtons[selectedButtonIndex].element.click();
            playSound(600, 0.1, 'sine', 0.2);
        }
        gamepadButtonsPressed['confirm'] = true;
    } else if (!gamepad.buttons[GAMEPAD_BUTTONS.A]?.pressed) {
        gamepadButtonsPressed['confirm'] = false;
    }
    
    // B button to go back (return to menu from pause/gameover)
    if (gamepad.buttons[GAMEPAD_BUTTONS.B]?.pressed && !gamepadButtonsPressed['back']) {
        if (gameState === 'paused') {
            resumeGame();
        }
        gamepadButtonsPressed['back'] = true;
    } else if (!gamepad.buttons[GAMEPAD_BUTTONS.B]?.pressed) {
        gamepadButtonsPressed['back'] = false;
    }
    
    // Update highlights
    updateMenuSelection();
}

// Initialize menu selection when showing a screen
function initializeMenuSelection(screenId) {
    selectedButtonIndex = 0;
    menuButtons = getMenuButtons(screenId);
    updateMenuSelection();
}

// Call when showing screens
const originalShowScreen = typeof showScreen !== 'undefined' ? showScreen : null;
