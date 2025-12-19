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
        playDefeatSound();
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
                score += 150;
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
