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

// Game State
let gameState = 'start'; // start, playing, paused, gameover, victory
let score = 0;
let lives = 3;
let gameTime = 0;
let keys = {};
let animationId;

// Game Objects
let player;
let platforms = [];
let enemies = [];
let particles = [];

// Timing
let lastTime = 0;
const FPS = 60;
const frameDelay = 1000 / FPS;

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
        if (keys[' '] && this.onGround) {
            this.velocityY = JUMP_FORCE;
            this.jumping = true;
            this.onGround = false;
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
        }

        // Platform Collision
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.jumping = false;
                    this.onGround = true;
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

            if (lives <= 0) {
                gameOver();
            }
        }
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
// ENEMY CLASS
// ============================================
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'cat' or 'dog'
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;
        this.velocityX = type === 'cat' ? 2 : 3;
        this.velocityY = 0;
        this.direction = 1;
        this.alive = true;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(deltaTime) {
        if (!this.alive) return;

        // Movement
        this.x += this.velocityX * this.direction;

        // Apply Gravity
        this.velocityY += GRAVITY;
        this.y += this.velocityY;

        // Floor Collision
        if (this.y + this.height >= FLOOR_Y) {
            this.y = FLOOR_Y - this.height;
            this.velocityY = 0;
        }

        // Platform Collision
        platforms.forEach(platform => {
            if (this.checkCollision(platform)) {
                if (this.velocityY > 0 && this.y + this.height - this.velocityY <= platform.y) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                }
            }
        });

        // Turn around at edges
        if (this.x < 0 || this.x > canvas.width - this.width) {
            this.direction *= -1;
        }

        // Turn around at platform edges
        let onPlatform = false;
        platforms.forEach(platform => {
            if (this.y + this.height === platform.y &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width) {
                onPlatform = true;

                // Check if near edge
                if (this.direction === 1 && this.x + this.width > platform.x + platform.width - 10) {
                    this.direction = -1;
                } else if (this.direction === -1 && this.x < platform.x + 10) {
                    this.direction = 1;
                }
            }
        });

        // Animation
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        // Check collision with player
        if (this.checkCollision(player)) {
            // Check if player jumped on top
            if (player.velocityY > 0 && player.y + player.height - player.velocityY < this.y + this.height / 2) {
                this.die();
                player.velocityY = JUMP_FORCE * 0.5;
                score += this.type === 'cat' ? 100 : 200;
                updateHUD();
            } else {
                player.takeDamage();
            }
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
            this.x + this.width > obj.x &&
            this.y < obj.y + obj.height &&
            this.y + this.height > obj.y;
    }

    die() {
        this.alive = false;
        createParticles(this.x + this.width / 2, this.y + this.height / 2, this.type === 'cat' ? '#ff8800' : '#8b4513');
    }

    draw() {
        if (!this.alive) return;

        ctx.save();

        // Translate to enemy position
        ctx.translate(this.x, this.y);

        // Flip sprite if moving left
        if (this.direction === -1) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }

        // Draw with geometric shapes
        if (this.type === 'cat') {
            // Cat Enemy
            ctx.fillStyle = '#ff8800';
            // Body
            ctx.fillRect(5, 10, this.width - 10, this.height - 15);
            // Head
            ctx.fillRect(this.width - 20, 5, 15, 15);
            // Ears
            ctx.fillRect(this.width - 18, 0, 5, 8);
            ctx.fillRect(this.width - 10, 0, 5, 8);
            // Legs
            ctx.fillRect(8, this.height - 10, 5, 10);
            ctx.fillRect(18, this.height - 10, 5, 10);
            // Eyes
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.width - 17, 8, 3, 3);
            ctx.fillRect(this.width - 10, 8, 3, 3);
        } else {
            // Dog Enemy
            ctx.fillStyle = '#8b4513';
            // Body
            ctx.fillRect(5, 12, this.width - 10, this.height - 17);
            // Head
            ctx.fillRect(this.width - 22, 7, 18, 18);
            // Ears (floppy)
            ctx.fillRect(this.width - 20, 15, 4, 12);
            ctx.fillRect(this.width - 10, 15, 4, 12);
            // Legs
            ctx.fillRect(8, this.height - 12, 6, 12);
            ctx.fillRect(20, this.height - 12, 6, 12);
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(this.width - 18, 12, 3, 3);
            ctx.fillRect(this.width - 10, 12, 3, 3);
        }

        ctx.restore();
    }
}

// ============================================
// PLATFORM CLASS
// ============================================
class Platform {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = PLATFORM_HEIGHT;
    }

    draw() {
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Top edge highlight
        ctx.fillStyle = '#6a6a6a';
        ctx.fillRect(this.x, this.y, this.width, 4);

        // Bottom shadow
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(this.x, this.y + this.height - 4, this.width, 4);
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

    // Create Player
    player = new Player(100, 300);

    // Create Platforms
    platforms = [
        new Platform(200, 450, 150),
        new Platform(400, 380, 120),
        new Platform(600, 320, 150),
        new Platform(150, 280, 100),
        new Platform(800, 400, 180),
        new Platform(350, 200, 130),
        new Platform(700, 180, 120),
    ];

    // Create Enemies
    enemies = [
        new Enemy(300, 200, 'cat'),
        new Enemy(500, 200, 'dog'),
        new Enemy(700, 150, 'cat'),
        new Enemy(850, 200, 'cat'),
        new Enemy(200, 200, 'dog'),
        new Enemy(600, 200, 'cat'),
    ];

    // Reset Game State
    score = 0;
    lives = 3;
    gameTime = 0;
    particles = [];

    updateHUD();
}

function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives));
    document.getElementById('timer').textContent = Math.floor(gameTime / 1000);
}

function update(deltaTime) {
    if (gameState !== 'playing') return;

    // Update game time
    gameTime += deltaTime;

    // Update Player
    player.update(deltaTime);

    // Update Enemies
    enemies.forEach(enemy => enemy.update(deltaTime));

    // Update Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());

    // Check Win Condition
    const aliveEnemies = enemies.filter(e => e.alive).length;
    if (aliveEnemies === 0) {
        victory();
    }

    updateHUD();
}

function draw() {
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

    // Draw Enemies
    enemies.forEach(enemy => enemy.draw());

    // Draw Player
    player.draw();

    // Draw Particles
    particles.forEach(p => p.draw());
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
    initGame();
    gameState = 'playing';
    showScreen('game-screen');
    lastTime = performance.now();
    gameLoop(lastTime);
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
}

function victory() {
    gameState = 'victory';
    document.getElementById('victory-score').textContent = score;
    showScreen('victory-screen');
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
