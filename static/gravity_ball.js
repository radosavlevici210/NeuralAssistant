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
            radius: 8,
            trail: []
        };
        this.gravity = 0.8;
        this.friction = 0.98;
        this.bounce = 0.7;
        this.attractionStrength = 0.4;
        this.magnetStrength = 0.6;
        this.heavyGravity = 1.2;
        
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
            z-index: 10;
            pointer-events: none;
            display: none;
            user-select: none;
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
        
        // Mouse events for finger attraction - only when active
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isActive) {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isActive) {
                this.mouse.down = true;
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
                e.preventDefault(); // Don't interfere with page
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (this.isActive) {
                this.mouse.down = false;
            }
        });
        
        // Touch events for mobile - only when active
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isActive) {
                e.preventDefault();
                const touch = e.touches[0];
                this.mouse.x = touch.clientX;
                this.mouse.y = touch.clientY;
            }
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.mouse.down = true;
                const touch = e.touches[0];
                this.mouse.x = touch.clientX;
                this.mouse.y = touch.clientY;
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.mouse.down = false;
            }
        });
        
        // Double-click to create magnetic points - only when active
        this.canvas.addEventListener('dblclick', (e) => {
            if (this.isActive) {
                this.createBlackHole(e.clientX, e.clientY);
                e.preventDefault();
            }
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
        // Create magnetic coils and polarized magnets
        const types = ['attract', 'repel', 'magnet', 'coil', 'heavy'];
        this.blackHoles.push({
            x: x,
            y: y,
            radius: 15,
            strength: this.magnetStrength,
            type: types[Math.floor(Math.random() * types.length)],
            rotation: 0
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
        
        // Complex magnetic interactions with coils and heavy gravity
        this.blackHoles.forEach(hole => {
            const dx = hole.x - this.ball.x;
            const dy = hole.y - this.ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Update coil rotation
            if (hole.type === 'coil') {
                hole.rotation += 0.1;
            }
            
            if (distance > 0 && distance < 150) {
                const force = hole.strength / (distance * 0.015);
                const forceX = (dx / distance) * force;
                const forceY = (dy / distance) * force;
                
                if (hole.type === 'attract') {
                    // Strong magnetic pull - North pole
                    this.ball.vx += forceX * 0.25;
                    this.ball.vy += forceY * 0.25;
                } else if (hole.type === 'repel') {
                    // Push away like same poles - South pole
                    this.ball.vx -= forceX * 0.22;
                    this.ball.vy -= forceY * 0.22;
                } else if (hole.type === 'magnet') {
                    // Polarized sideways force - creates spin
                    this.ball.vx += forceY * 0.18;
                    this.ball.vy -= forceX * 0.18;
                    // Add rotational effect
                    this.ball.vx += Math.sin(distance * 0.15) * 0.12;
                    this.ball.vy += Math.cos(distance * 0.15) * 0.12;
                } else if (hole.type === 'coil') {
                    // Electromagnetic coil creates circular motion
                    const coilForce = 0.15;
                    this.ball.vx += Math.sin(hole.rotation + distance * 0.1) * coilForce;
                    this.ball.vy += Math.cos(hole.rotation + distance * 0.1) * coilForce;
                } else if (hole.type === 'heavy') {
                    // Heavy gravity well
                    this.ball.vx += forceX * 0.3;
                    this.ball.vy += forceY * 0.3 + this.heavyGravity * 0.1;
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
        
        // Apply heavier gravity - harder to move ball upward
        this.ball.vy += this.gravity;
        
        // Additional heavy gravity when ball is moving down
        if (this.ball.vy > 0) {
            this.ball.vy += this.heavyGravity * 0.3;
        }
        
        // Apply friction
        this.ball.vx *= this.friction;
        this.ball.vy *= this.friction;
        
        // Update position
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        
        // Enhanced boundary collisions with corner forces
        const cornerForce = 0.3;
        const bounceForce = 1.2;
        
        // Right wall
        if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.x = this.canvas.width - this.ball.radius;
            this.ball.vx *= -this.bounce * bounceForce;
            // Corner effects
            if (this.ball.y < 100) this.ball.vy += cornerForce; // Top corner
            if (this.ball.y > this.canvas.height - 100) this.ball.vy -= cornerForce; // Bottom corner
        }
        
        // Left wall
        if (this.ball.x - this.ball.radius < 0) {
            this.ball.x = this.ball.radius;
            this.ball.vx *= -this.bounce * bounceForce;
            // Corner effects
            if (this.ball.y < 100) this.ball.vy += cornerForce;
            if (this.ball.y > this.canvas.height - 100) this.ball.vy -= cornerForce;
        }
        
        // Bottom wall
        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.y = this.canvas.height - this.ball.radius;
            this.ball.vy *= -this.bounce * bounceForce;
            // Corner effects
            if (this.ball.x < 100) this.ball.vx += cornerForce; // Left corner
            if (this.ball.x > this.canvas.width - 100) this.ball.vx -= cornerForce; // Right corner
        }
        
        // Top wall
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.y = this.ball.radius;
            this.ball.vy *= -this.bounce * bounceForce;
            // Corner effects
            if (this.ball.x < 100) this.ball.vx += cornerForce;
            if (this.ball.x > this.canvas.width - 100) this.ball.vx -= cornerForce;
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
        
        // Draw complex magnetic elements - coils, polarized magnets, gravity wells
        this.blackHoles.forEach(hole => {
            this.ctx.beginPath();
            this.ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
            
            if (hole.type === 'attract') {
                // Blue magnet - North pole
                this.ctx.fillStyle = 'rgba(0, 100, 255, 0.8)';
            } else if (hole.type === 'repel') {
                // Red magnet - South pole
                this.ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
            } else if (hole.type === 'magnet') {
                // Green magnet - polarized sideways
                this.ctx.fillStyle = 'rgba(50, 255, 100, 0.8)';
            } else if (hole.type === 'coil') {
                // Purple electromagnetic coil
                this.ctx.fillStyle = 'rgba(150, 50, 255, 0.8)';
            } else if (hole.type === 'heavy') {
                // Dark gravity well
                this.ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
            }
            this.ctx.fill();
            
            // Draw specific effects for each type
            if (hole.type === 'coil') {
                // Rotating coil effect
                this.ctx.beginPath();
                this.ctx.arc(hole.x, hole.y, hole.radius + 5, hole.rotation, hole.rotation + Math.PI);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            } else if (hole.type === 'heavy') {
                // Heavy gravity rings
                for (let i = 1; i <= 3; i++) {
                    this.ctx.beginPath();
                    this.ctx.arc(hole.x, hole.y, hole.radius + (i * 6), 0, Math.PI * 2);
                    this.ctx.strokeStyle = `rgba(50, 50, 50, ${0.3 / i})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }
            } else {
                // Standard magnetic field
                this.ctx.beginPath();
                this.ctx.arc(hole.x, hole.y, hole.radius + 8, 0, Math.PI * 2);
                this.ctx.strokeStyle = hole.type === 'attract' ? 'rgba(0, 100, 255, 0.5)' : 
                                      hole.type === 'repel' ? 'rgba(255, 50, 50, 0.5)' : 'rgba(50, 255, 100, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
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