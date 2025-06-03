/**
 * ALPHA CORE: Interactive Gravity Ball Game
 * A fun bouncing ball with realistic physics for entertainment
 */

class GravityBall {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.ball = {
            x: 200,
            y: 100,
            vx: 3,
            vy: 0,
            radius: 15,
            color: '#00aaff',
            trail: []
        };
        this.gravity = 0.4;
        this.friction = 0.98;
        this.bounce = 0.85;
        this.mouse = { x: 0, y: 0, down: false };
        this.animationId = null;
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.bindEvents();
        this.startGame();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: all;
            z-index: 5;
            cursor: grab;
            background: transparent;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        document.body.appendChild(this.canvas);
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Add toggle button
        this.createToggleButton();
    }
    
    createToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '🏀';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.3);
            background: rgba(0, 170, 255, 0.8);
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 10;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        
        toggleBtn.addEventListener('click', () => this.toggleGame());
        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.transform = 'scale(1.1)';
            toggleBtn.style.background = 'rgba(0, 200, 255, 0.9)';
        });
        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.transform = 'scale(1)';
            toggleBtn.style.background = 'rgba(0, 170, 255, 0.8)';
        });
        
        document.body.appendChild(toggleBtn);
        this.toggleBtn = toggleBtn;
    }
    
    toggleGame() {
        this.isActive = !this.isActive;
        this.canvas.style.pointerEvents = this.isActive ? 'all' : 'none';
        this.canvas.style.display = this.isActive ? 'block' : 'none';
        this.toggleBtn.innerHTML = this.isActive ? '❌' : '🏀';
        
        if (this.isActive) {
            this.resetBall();
            this.startGame();
        } else {
            this.stopGame();
        }
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    onMouseDown(e) {
        this.mouse.down = true;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.checkBallClick(e.clientX, e.clientY);
        this.canvas.style.cursor = 'grabbing';
    }
    
    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        
        if (this.mouse.down && this.ballGrabbed) {
            this.ball.x = e.clientX;
            this.ball.y = e.clientY;
            this.ball.vx = 0;
            this.ball.vy = 0;
        }
    }
    
    onMouseUp(e) {
        if (this.ballGrabbed) {
            // Add some velocity based on mouse movement
            this.ball.vx = (e.clientX - this.mouse.x) * 0.2;
            this.ball.vy = (e.clientY - this.mouse.y) * 0.2;
        }
        
        this.mouse.down = false;
        this.ballGrabbed = false;
        this.canvas.style.cursor = 'grab';
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
    
    onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
    
    onTouchEnd(e) {
        e.preventDefault();
        this.onMouseUp({ clientX: this.mouse.x, clientY: this.mouse.y });
    }
    
    checkBallClick(x, y) {
        const dist = Math.sqrt((x - this.ball.x) ** 2 + (y - this.ball.y) ** 2);
        if (dist < this.ball.radius + 20) {
            this.ballGrabbed = true;
        }
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = 100;
        this.ball.vx = Math.random() * 6 - 3;
        this.ball.vy = 0;
        this.ball.trail = [];
    }
    
    updatePhysics() {
        if (!this.ballGrabbed) {
            // Apply gravity
            this.ball.vy += this.gravity;
            
            // Apply friction
            this.ball.vx *= this.friction;
            this.ball.vy *= this.friction;
            
            // Update position
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            
            // Bounce off walls
            if (this.ball.x - this.ball.radius < 0) {
                this.ball.x = this.ball.radius;
                this.ball.vx *= -this.bounce;
            }
            if (this.ball.x + this.ball.radius > this.canvas.width) {
                this.ball.x = this.canvas.width - this.ball.radius;
                this.ball.vx *= -this.bounce;
            }
            
            // Bounce off floor
            if (this.ball.y + this.ball.radius > this.canvas.height) {
                this.ball.y = this.canvas.height - this.ball.radius;
                this.ball.vy *= -this.bounce;
                
                // Add some random energy occasionally
                if (Math.random() < 0.1) {
                    this.ball.vy -= 2;
                }
            }
            
            // Bounce off ceiling
            if (this.ball.y - this.ball.radius < 0) {
                this.ball.y = this.ball.radius;
                this.ball.vy *= -this.bounce;
            }
        }
        
        // Add to trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 20) {
            this.ball.trail.shift();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw trail
        this.ctx.globalAlpha = 0.6;
        for (let i = 0; i < this.ball.trail.length; i++) {
            const point = this.ball.trail[i];
            const alpha = i / this.ball.trail.length;
            const size = (this.ball.radius * alpha) / 2;
            
            this.ctx.fillStyle = `rgba(0, 170, 255, ${alpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
        
        // Draw ball
        const gradient = this.ctx.createRadialGradient(
            this.ball.x - 5, this.ball.y - 5, 0,
            this.ball.x, this.ball.y, this.ball.radius
        );
        gradient.addColorStop(0, '#66ccff');
        gradient.addColorStop(1, '#0088cc');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x - 4, this.ball.y - 4, this.ball.radius / 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw instructions if ball is still
        if (Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Click and drag the ball!', this.canvas.width / 2, 50);
        }
    }
    
    gameLoop() {
        if (this.isActive) {
            this.updatePhysics();
            this.render();
        }
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    startGame() {
        if (!this.animationId) {
            this.gameLoop();
        }
    }
    
    stopGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    destroy() {
        this.stopGame();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        if (this.toggleBtn && this.toggleBtn.parentNode) {
            this.toggleBtn.parentNode.removeChild(this.toggleBtn);
        }
    }
}

// Initialize gravity ball game
document.addEventListener('DOMContentLoaded', function() {
    window.gravityBall = new GravityBall();
});