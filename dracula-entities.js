// ============================================
// NEW GAME ENTITIES FOR MULTI-LEVEL SYSTEM
// ============================================

// ============================================
// PLATFORM CLASS (Base class)
// ============================================
class Platform {
    constructor(x, y, width) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 20; // PLATFORM_HEIGHT
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
// COLLECTIBLE CLASS
// ============================================
class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'coin', 'heart', 'star'
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.floatOffset = 0;
        this.floatSpeed = 0.05;
    }

    update(deltaTime) {
        if (this.collected) return;

        // Floating animation
        this.floatOffset += this.floatSpeed;

        // Check collision with player
        if (this.checkCollision(player)) {
            this.collect();
        }
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
            this.x + this.width > obj.x &&
            this.y < obj.y + obj.height &&
            this.y + this.height > obj.y;
    }

    collect() {
        this.collected = true;

        switch (this.type) {
            case 'coin':
                score += 50;
                playSound(800, 0.1, 'sine', 0.2);
                break;
            case 'heart':
                if (lives < 5) lives++;
                playSound(600, 0.2, 'sine', 0.3);
                break;
            case 'star':
                player.invincible = true;
                player.invincibleTime = 5000;
                playSound(1000, 0.3, 'square', 0.3);
                break;
        }

        updateHUD();
    }

    draw() {
        if (this.collected) return;

        ctx.save();

        const floatY = this.y + Math.sin(this.floatOffset) * 5;
        ctx.translate(this.x, floatY);

        if (this.type === 'coin') {
            // Gold coin
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, this.width / 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'heart') {
            // Red heart
            ctx.fillStyle = '#ff0066';
            ctx.beginPath();
            ctx.moveTo(this.width / 2, this.height / 4);
            ctx.arc(this.width / 3, this.height / 4, this.width / 4, 0, Math.PI, true);
            ctx.arc(2 * this.width / 3, this.height / 4, this.width / 4, 0, Math.PI, true);
            ctx.lineTo(this.width / 2, 3 * this.height / 4);
            ctx.fill();
        } else if (this.type === 'star') {
            // Yellow star
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = this.width / 2 + Math.cos(angle) * this.width / 2;
                const y = this.height / 2 + Math.sin(angle) * this.height / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

// ============================================
// MOVING PLATFORM CLASS
// ============================================
class MovingPlatform extends Platform {
    constructor(x, y, width, endX, endY, speed) {
        super(x, y, width);
        this.startX = x;
        this.startY = y;
        this.endX = endX;
        this.endY = endY;
        this.speed = speed || 2;
        this.direction = 1;
        this.moving = true;
    }

    update(deltaTime) {
        if (!this.moving) return;

        // Move platform
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;

        if (dx !== 0) {
            this.x += this.speed * this.direction;

            if (this.direction === 1 && this.x >= this.endX) {
                this.direction = -1;
                this.x = this.endX;
            } else if (this.direction === -1 && this.x <= this.startX) {
                this.direction = 1;
                this.x = this.startX;
            }
        }

        if (dy !== 0) {
            this.y += this.speed * this.direction;

            if (this.direction === 1 && this.y >= this.endY) {
                this.direction = -1;
                this.y = this.endY;
            } else if (this.direction === -1 && this.y <= this.startY) {
                this.direction = 1;
                this.y = this.startY;
            }
        }

        // Move player with platform if standing on it
        if (player && player.onGround) {
            const isOnPlatform = player.x + player.width > this.x &&
                player.x < this.x + this.width &&
                Math.abs(player.y + player.height - this.y) < 5;

            if (isOnPlatform) {
                if (dx !== 0) player.x += this.speed * this.direction;
                if (dy !== 0) player.y += this.speed * this.direction;
            }
        }
    }

    draw() {
        // Draw with slightly different color
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(this.x, this.y, this.width, 4);

        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(this.x, this.y + this.height - 4, this.width, 4);

        // Draw movement indicator
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x + this.width / 2 - 3, this.y + this.height / 2 - 3, 6, 6);
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
        this.width = 35; // ENEMY_WIDTH
        this.height = 35; // ENEMY_HEIGHT
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
        this.velocityY += 0.6; // GRAVITY
        this.y += this.velocityY;

        // Floor Collision
        if (this.y + this.height >= 500) { // FLOOR_Y
            this.y = 500 - this.height;
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
                player.velocityY = -13 * 0.5; // JUMP_FORCE * 0.5
                score += (this.type === 'cat' ? 100 : 200) * comboMultiplier;
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
        playDefeatSound();

        // Add combo
        addCombo();

        // Firebase Analytics: Track enemy defeat
        if (window.GameAnalytics) {
            GameAnalytics.logEnemyDefeated(this.type);
        }
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
// BAT ENEMY CLASS
// ============================================
class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 'bat');
        this.width = 30;
        this.height = 25;
        this.velocityX = 3;
        this.amplitude = 40;
        this.frequency = 0.05;
        this.offset = 0;
        this.startY = y;
    }

    update(deltaTime) {
        if (!this.alive) return;

        // Horizontal movement
        this.x += this.velocityX * this.direction;

        // Sinusoidal vertical movement (flying pattern)
        this.offset += this.frequency;
        this.y = this.startY + Math.sin(this.offset) * this.amplitude;

        // Turn around at edges
        if (this.x < 0 || this.x > canvas.width - this.width) {
            this.direction *= -1;
        }

        // Animation
        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        // Check collision with player
        if (this.checkCollision(player)) {
            // Bats can be defeated by jumping on them from above
            if (player.velocityY > 0 && player.y + player.height - player.velocityY < this.y + this.height / 2) {
                this.die();
                player.velocityY = JUMP_FORCE * 0.5;
                score += 150 * comboMultiplier;
                updateHUD();
            } else {
                player.takeDamage();
            }
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.save();

        ctx.translate(this.x, this.y);

        if (this.direction === -1) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }

        // Bat body (purple)
        ctx.fillStyle = '#663399';
        ctx.fillRect(10, 10, 15, 10);

        // Wings - animated
        const wingSpan = this.animFrame === 0 ? 10 : 5;
        ctx.fillRect(5, 10, wingSpan, 5);
        ctx.fillRect(20, 10, wingSpan, 5);

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(13, 12, 2, 2);
        ctx.fillRect(17, 12, 2, 2);

        ctx.restore();
    }
}

// ============================================
// PROJECTILE CLASS (Blood Drops)
// ============================================
class Projectile {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.direction = direction; // 1 = right, -1 = left
        this.speed = 10;
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        // Move projectile
        this.x += this.speed * this.direction;

        // Check if out of bounds
        if (this.x < 0 || this.x > canvas.width) {
            this.active = false;
            return;
        }

        // Check collision with enemies
        enemies.forEach(enemy => {
            if (!enemy.alive) return;

            if (this.checkCollision(enemy)) {
                // Check if this is a boss enemy
                if (enemy.isBoss && enemy.takeDamage) {
                    // Boss takes damage but doesn't die immediately
                    enemy.takeDamage(1);
                    this.active = false;

                    // Track projectile kill achievement
                    achievementStats.projectileKills++;
                    checkAchievements();

                    // No score until boss dies (boss awards score on death)
                } else {
                    // Regular enemy - dies in one hit
                    enemy.die();
                    this.active = false;
                    score += 150 * comboMultiplier; // Bonus for projectile kill
                    updateHUD();

                    // Track projectile kill achievement
                    achievementStats.projectileKills++;
                    checkAchievements();
                }

                // Create blood particles
                createParticles(this.x, this.y, '#ff0000');
            }
        });
    }

    checkCollision(obj) {
        return this.x < obj.x + obj.width &&
            this.x + this.width > obj.x &&
            this.y < obj.y + obj.height &&
            this.y + this.height > obj.y;
    }

    draw() {
        if (!this.active) return;

        ctx.save();

        // Blood drop with glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';

        // Main drop
        ctx.fillStyle = '#cc0000';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 1, this.y + this.height / 2 - 1, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ============================================
// SPIDER ENEMY CLASS (Ceiling Crawler)
// ============================================
class Spider extends Enemy {
    constructor(x, y, ceilingY) {
        super(x, y, 'spider');
        this.width = 30;
        this.height = 25;
        this.velocityX = 1.5;
        this.ceilingY = ceilingY || 50; // Default ceiling position
        this.onCeiling = true;
    }

    update(deltaTime) {
        if (!this.alive) return;

        // Move horizontally on ceiling
        this.x += this.velocityX * this.direction;
        this.y = this.ceilingY; // Stick to ceiling

        // Turn around at edges
        if (this.x < 0 || this.x > canvas.width - this.width) {
            this.direction *= -1;
        }

        // Animation
        this.animTimer += deltaTime;
        if (this.animTimer > 120) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        // Check collision with player
        if (this.checkCollision(player)) {
            // Can defeat from below
            if (player.velocityY < 0 && player.y > this.y + this.height / 2) {
                this.die();
                player.velocityY = 5; // Bounce down
                score += 120 * comboMultiplier;
                updateHUD();
            } else {
                player.takeDamage();
            }
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.direction === -1) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }

        // Spider body (black/orange)
        ctx.fillStyle = '#222';
        ctx.fillRect(10, 10, 15, 12);

        // Legs
        ctx.fillStyle = '#ff6600';
        const legOffset = this.animFrame === 0 ? 0 : 2;
        // Left legs
        ctx.fillRect(8, 8 + legOffset, 5, 2);
        ctx.fillRect(8, 15 + legOffset, 5, 2);
        // Right legs
        ctx.fillRect(22, 8 + legOffset, 5, 2);
        ctx.fillRect(22, 15 + legOffset, 5, 2);

        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(13, 13, 2, 2);
        ctx.fillRect(17, 13, 2, 2);

        ctx.restore();
    }
}

// ============================================
// GHOST ENEMY CLASS (Float through platforms)
// ============================================
class Ghost extends Enemy {
    constructor(x, y) {
        super(x, y, 'ghost');
        this.width = 28;
        this.height = 32;
        this.velocityX = 1;
        this.startY = y;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.03;
        this.transparency = 0.7;
    }

    update(deltaTime) {
        if (!this.alive) return;

        // Horizontal movement
        this.x += this.velocityX * this.direction;

        // Vertical floating
        this.floatOffset += this.floatSpeed;
        this.y = this.startY + Math.sin(this.floatOffset) * 40;

        // Turn around at edges
        if (this.x < 0 || this.x > canvas.width - this.width) {
            this.direction *= -1;
        }

        // Animation
        this.animTimer += deltaTime;
        if (this.animTimer > 150) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        // Check collision with player (can't jump on ghosts, must shoot)
        if (this.checkCollision(player)) {
            player.takeDamage();
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.save();
        ctx.globalAlpha = this.transparency;
        ctx.translate(this.x, this.y);

        if (this.direction === -1) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }

        // Ghost body (white/blue)
        ctx.fillStyle = '#e0e0ff';
        // Head
        ctx.fillRect(6, 0, 16, 18);
        // Body with wavy bottom
        ctx.fillRect(4, 18, 20, 10);

        const wave = this.animFrame === 0 ? 0 : 2;
        ctx.fillRect(4, 28 + wave, 6, 4);
        ctx.fillRect(12, 28 - wave, 6, 4);
        ctx.fillRect(20, 28 + wave, 6, 4);

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(10, 8, 3, 4);
        ctx.fillRect(17, 8, 3, 4);

        ctx.restore();
    }
}

// ============================================
// CAT GOLEM BOSS CLASS (Boss Fight)
// ============================================
class CatGolem extends Enemy {
    constructor(x, y) {
        super(x, y, 'catgolem');
        this.width = 100;
        this.height = 120;
        this.velocityX = 1.5; // Moves faster

        // Boss stats
        this.maxHP = 10;
        this.hp = this.maxHP;
        this.isBoss = true;

        // Attack system
        this.attackCooldown = 0;
        this.attackCooldownTime = 3000; // 3 seconds between attacks
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 800; // Attack animation duration
        this.hammerY = 0; // Hammer position for animation

        // Attack properties
        this.attackRange = 100; // Attack radius
        this.attackDamage = 1;

        // Jump system
        this.onGround = true;
        this.jumpCooldown = 0;
        this.jumpCooldownTime = 2000; // 2 seconds between jumps
        this.canJump = true;
    }

    takeDamage(damage = 1) {
        if (this.hp <= 0) return;

        this.hp -= damage;

        // Create hit particles
        createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ff0000');
        playSound(300, 0.15, 'square', 0.2);

        // Screen shake on hit
        screenShake(5);

        // Check if defeated
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;

        // Epic death particles
        for (let i = 0; i < 30; i++) {
            createParticles(
                this.x + Math.random() * this.width,
                this.y + Math.random() * this.height,
                '#8b4513'
            );
        }

        // Big screen shake
        screenShake(20);

        // Victory sound and score
        playVictorySound();
        score += 1000 * comboMultiplier;
        updateHUD();

        // Firebase Analytics: Track boss defeat
        if (window.GameAnalytics) {
            GameAnalytics.logEnemyDefeated('catgolem_boss');
        }
    }

    attack() {
        if (this.isAttacking || this.attackCooldown > 0) return;

        this.isAttacking = true;
        this.attackTimer = 0;
        this.hammerY = 0;

        // Sound for hammer swing
        playSound(200, 0.3, 'sawtooth', 0.3);
    }

    update(deltaTime) {
        if (!this.alive) return;

        // Movement
        this.x += this.velocityX * this.direction;

        // Apply Gravity
        this.velocityY += 0.6; // GRAVITY
        this.y += this.velocityY;

        // Floor Collision
        if (this.y + this.height >= 500) { // FLOOR_Y
            this.y = 500 - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Turn around at edges
        if (this.x < 0 || this.x > canvas.width - this.width) {
            this.direction *= -1;
        }

        // Jump system
        if (this.jumpCooldown > 0) {
            this.jumpCooldown -= deltaTime;
        }

        // Random jump when on ground and cooldown expired
        if (this.onGround && this.jumpCooldown <= 0 && this.canJump) {
            // 30% chance to jump each time cooldown expires
            if (Math.random() < 0.3) {
                this.velocityY = -12; // Jump force
                this.onGround = false;
                this.jumpCooldown = this.jumpCooldownTime;

                // Jump sound
                playSound(250, 0.2, 'square', 0.2);
            } else {
                // Reset cooldown for next attempt
                this.jumpCooldown = 500; // Try again in 0.5 seconds
            }
        }

        // Animation
        this.animTimer += deltaTime;
        if (this.animTimer > 200) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }

        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // Attack logic
        if (this.isAttacking) {
            this.attackTimer += deltaTime;

            // Hammer animation (raise then slam)
            if (this.attackTimer < this.attackDuration / 2) {
                // Raising hammer
                this.hammerY = -30 * (this.attackTimer / (this.attackDuration / 2));
            } else if (this.attackTimer >= this.attackDuration / 2 && this.attackTimer < this.attackDuration) {
                // Slamming hammer
                this.hammerY = -30 + 30 * ((this.attackTimer - this.attackDuration / 2) / (this.attackDuration / 2));

                // Impact moment
                if (this.attackTimer >= this.attackDuration - 50 && this.hammerY >= -5) {
                    // Only trigger once
                    if (!this.impacted) {
                        this.onHammerImpact();
                        this.impacted = true;
                    }
                }
            } else {
                // Attack finished
                this.isAttacking = false;
                this.attackCooldown = this.attackCooldownTime;
                this.hammerY = 0;
                this.impacted = false;
            }
        } else {
            // Try to attack if player is nearby
            if (player && Math.abs(player.x - this.x) < 200) {
                this.attack();
            }
        }

        // Check collision with player (contact damage)
        if (this.checkCollision(player)) {
            // Boss can't be defeated by jumping
            if (player.velocityY > 0 && player.y + player.height - player.velocityY < this.y + this.height / 2) {
                // Player tried to jump on boss - take damage instead
                player.takeDamage();
                player.velocityY = -8; // Bounce off
            } else {
                player.takeDamage();
            }
        }
    }

    onHammerImpact() {
        // Screen shake!
        screenShake(15);

        // Impact sound
        playSound(100, 0.5, 'sawtooth', 0.4);

        // Vibrate gamepad
        vibrateGamepad(400, 1.0);

        // Create impact particles
        for (let i = 0; i < 20; i++) {
            createParticles(
                this.x + this.width / 2 + (Math.random() - 0.5) * 60,
                this.y + this.height,
                '#888888'
            );
        }

        // Check if player is in attack range
        if (player) {
            const distanceToPlayer = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));
            if (distanceToPlayer < this.attackRange) {
                player.takeDamage();
                // Knock player back
                player.velocityX = (player.x < this.x) ? -10 : 10;
                player.velocityY = -8;
            }
        }
    }

    drawHealthBar() {
        if (this.hp <= 0) return;

        const barWidth = 80;
        const barHeight = 8;
        const barX = this.x + (this.width - barWidth) / 2;
        const barY = this.y - 20;

        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

        // Red background (empty health)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Green foreground (current health)
        const healthPercent = this.hp / this.maxHP;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff6600';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // HP text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.hp}/${this.maxHP}`, barX + barWidth / 2, barY + barHeight + 12);
        ctx.textAlign = 'left';
    }

    draw() {
        if (!this.alive) return;

        ctx.save();

        // Draw health bar first
        this.drawHealthBar();

        // Translate to enemy position
        ctx.translate(this.x, this.y);

        // Flip sprite if moving left
        if (this.direction === -1) {
            ctx.translate(this.width, 0);
            ctx.scale(-1, 1);
        }

        // Giant Cat Golem (stone/rock colors)
        // Body (large, blocky)
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(10, 40, this.width - 20, this.height - 45);

        // Stone texture lines
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.lineTo(this.width - 20, 60);
        ctx.moveTo(20, 90);
        ctx.lineTo(this.width - 20, 90);
        ctx.stroke();

        // Head (massive)
        ctx.fillStyle = '#6a5a4a';
        ctx.fillRect(20, 10, this.width - 40, 40);

        // Ears (cat-like, pointed)
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.moveTo(25, 10);
        ctx.lineTo(30, 0);
        ctx.lineTo(35, 10);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.width - 35, 10);
        ctx.lineTo(this.width - 30, 0);
        ctx.lineTo(this.width - 25, 10);
        ctx.fill();

        // Eyes (glowing orange)
        ctx.fillStyle = '#ff6600';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff6600';
        ctx.fillRect(30, 25, 10, 10);
        ctx.fillRect(this.width - 40, 25, 10, 10);
        ctx.shadowBlur = 0;

        // Fangs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(35, 42, 6, 10);
        ctx.fillRect(this.width - 41, 42, 6, 10);

        // Legs (thick)
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(15, this.height - 25, 15, 25);
        ctx.fillRect(35, this.height - 25, 15, 25);
        ctx.fillRect(this.width - 50, this.height - 25, 15, 25);
        ctx.fillRect(this.width - 30, this.height - 25, 15, 25);

        // Hammer/Mazo
        const hammerX = this.width - 15;
        const hammerY = 30 + this.hammerY;

        // Hammer handle
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(hammerX, hammerY, 8, 50);

        // Hammer head
        ctx.fillStyle = '#888888';
        ctx.fillRect(hammerX - 10, hammerY - 5, 28, 15);

        // Hammer detail (metallic look)
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(hammerX - 8, hammerY - 3, 4, 11);

        ctx.restore();
    }
}
