/**
 * ALPHA CORE: Simple Gravity Ball with Finger Attraction and Black Holes
 * A simple bouncing ball that follows your finger and interacts with black holes
 */

class GravityBall {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.ball = {
            x: 200,
            y: 100,
            vx: 0,
            vy: 0,
            radius: 12,
            trail: []
        };
        this.gravity = 0.6;
        this.friction = 0.985;
        this.bounce = 0.75;
        this.attractionStrength = 0.3;
        this.magnetStrength = 0.4;
        
        this.mouse = { x: 0, y: 0, down: false };
        this.blackHoles = [];
        this.animationId = null;
        this.isActive = false;
        
        // Device motion for phone tilting
        this.deviceMotion = { x: 0, y: 0, enabled: false };
        this.motionSensitivity = 0.3;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.createToggleButton();
        this.setupEventListeners();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 100;
            pointer-events: none;
            display: none;
        `;
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 4;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.trail = [];
        this.blackHoles = [];
    }
    
    createToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '●';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 15px;
            right: 15px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.2);
            background: rgba(0, 170, 255, 0.3);
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.4;
        `;
        
        toggleBtn.addEventListener('click', () => this.toggleGame());
        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.opacity = '1';
            toggleBtn.style.background = 'rgba(0, 170, 255, 0.8)';
        });
        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.opacity = '0.4';
            toggleBtn.style.background = 'rgba(0, 170, 255, 0.3)';
        });
        
        document.body.appendChild(toggleBtn);
        this.toggleBtn = toggleBtn;
        return toggleBtn;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Mouse events for finger attraction
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mouse.down = true;
            const touch = e.touches[0];
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouse.down = false;
        });
        
        // Double-click to create black holes
        this.canvas.addEventListener('dblclick', (e) => {
            this.createBlackHole(e.clientX, e.clientY);
        });
        
        // Device motion for phone tilting
        this.setupDeviceMotion();
    }
    
    toggleGame() {
        this.isActive = !this.isActive;
        this.canvas.style.pointerEvents = this.isActive ? 'all' : 'none';
        this.canvas.style.display = this.isActive ? 'block' : 'none';
        this.toggleBtn.innerHTML = this.isActive ? '✕' : '●';
        
        if (this.isActive) {
            this.resetBall();
            this.startGame();
        } else {
            this.stopGame();
        }
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
    }
    
    setupDeviceMotion() {
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (event) => {
                if (this.isActive) {
                    // Get acceleration data
                    const acceleration = event.accelerationIncludingGravity;
                    if (acceleration) {
                        // Convert device tilt to ball movement
                        this.deviceMotion.x = acceleration.x || 0;
                        this.deviceMotion.y = acceleration.y || 0;
                        this.deviceMotion.enabled = true;
                    }
                }
            });
        }
        
        // For iOS devices, request permission
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        this.setupDeviceMotion();
                    }
                })
                .catch(console.error);
        }
    }

    createBlackHole(x, y) {
        // Create magnetic points like pool table bumpers
        const types = ['attract', 'repel', 'magnet'];
        this.blackHoles.push({
            x: x,
            y: y,
            radius: 20,
            strength: this.magnetStrength,
            type: types[Math.floor(Math.random() * types.length)]
        });
    }
    
    updateBall() {
        // Finger attraction when mouse is down
        if (this.mouse.down) {
            const dx = this.mouse.x - this.ball.x;
            const dy = this.mouse.y - this.ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.ball.vx += (dx / distance) * this.attractionStrength;
                this.ball.vy += (dy / distance) * this.attractionStrength;
            }
        }
        
        // Magnetic interactions like pool table physics
        this.blackHoles.forEach(hole => {
            const dx = hole.x - this.ball.x;
            const dy = hole.y - this.ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0 && distance < 120) {
                const force = hole.strength / (distance * 0.02);
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                if (hole.type === 'attract') {
                    // Strong magnetic pull
                    this.ball.vx += forceX * 0.15;
                    this.ball.vy += forceY * 0.15;
                } else if (hole.type === 'repel') {
                    // Push away like same poles
                    this.ball.vx -= forceX * 0.12;
                    this.ball.vy -= forceY * 0.12;
                } else if (hole.type === 'magnet') {
                    // Sideways magnetic force
                    this.ball.vx += forceY * 0.1;
                    this.ball.vy -= forceX * 0.1;
                }
            }
        });
        
        // Device motion (phone tilting) affects ball movement
        if (this.deviceMotion.enabled) {
            // Tilt left/right moves ball horizontally
            this.ball.vx += this.deviceMotion.x * this.motionSensitivity;
            // Tilt forward/back moves ball vertically
            this.ball.vy -= this.deviceMotion.y * this.motionSensitivity;
        }
        
        // Apply gravity
        this.ball.vy += this.gravity;
        
        // Apply friction
        this.ball.vx *= this.friction;
        this.ball.vy *= this.friction;
        
        // Update position
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // Boundary collisions
        if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.x = this.canvas.width - this.ball.radius;
            this.ball.vx *= -this.bounce;
        }
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx *= -this.bounce;
        }
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.y = this.canvas.height - this.ball.radius;
            this.ball.vy *= -this.bounce;
        }
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.vy *= -this.bounce;
        }
        
        // Update trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 15) {
            this.ball.trail.shift();
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw trail
        this.ctx.strokeStyle = 'rgba(0, 170, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ball.trail.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        this.ctx.stroke();
        
        // Draw magnetic points like pool table elements
        this.blackHoles.forEach(hole => {
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            
            if (hole.type === 'attract') {
                // Blue magnet - pulls ball in
                this.ctx.fillStyle = 'rgba(0, 100, 255, 0.7)';
            } else if (hole.type === 'repel') {
                // Red magnet - pushes ball away
                this.ctx.fillStyle = 'rgba(255, 50, 50, 0.7)';
            } else {
                // Green magnet - sideways force
                this.ctx.fillStyle = 'rgba(50, 255, 100, 0.7)';
            }
            this.ctx.fill();
            
            // Draw magnetic field effect
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, hole.radius + 8, 0, Math.PI * 2);
            this.ctx.strokeStyle = hole.type === 'attract' ? 'rgba(0, 100, 255, 0.4)' : 
                                  hole.type === 'repel' ? 'rgba(255, 50, 50, 0.4)' : 'rgba(50, 255, 100, 0.4)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00aaff';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw finger attraction indicator
        if (this.mouse.down) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.ball.x, this.ball.y);
            this.ctx.lineTo(this.mouse.x, this.mouse.y);
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fill();
        }
    }
    
    gameLoop() {
        this.updateBall();
        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
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