/**
 * ALPHA CORE: Realistic Water Physics
 * Creates authentic water ripple effects that mimic real finger touching water
 */

class RealisticWater {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.current = [];
        this.previous = [];
        this.damping = 0.99;
        this.rippleMap = [];
        this.texture = [];
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.initWaterGrid();
        this.bindEvents();
        this.animate();
        console.log('Realistic water physics initialized');
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
            z-index: 1;
            cursor: crosshair;
        `;
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        document.body.appendChild(this.canvas);
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.initWaterGrid();
    }
    
    initWaterGrid() {
        const size = this.width * this.height;
        this.current = new Array(size).fill(0);
        this.previous = new Array(size).fill(0);
        this.rippleMap = new Array(size).fill(0);
        this.texture = new Array(size).fill(0);
    }
    
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                this.createWaterRipple(touch.clientX, touch.clientY, 150);
            });
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            Array.from(e.touches).forEach(touch => {
                this.createWaterRipple(touch.clientX, touch.clientY, 80);
            });
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
        
        this.isMouseDown = false;
    }
    
    onPointerDown(e) {
        this.isMouseDown = true;
        this.createWaterRipple(e.clientX, e.clientY, 200);
    }
    
    onPointerMove(e) {
        if (this.isMouseDown) {
            this.createWaterRipple(e.clientX, e.clientY, 100);
        } else if (Math.random() < 0.1) {
            this.createWaterRipple(e.clientX, e.clientY, 30);
        }
    }
    
    onPointerUp(e) {
        this.isMouseDown = false;
    }
    
    createWaterRipple(x, y, intensity = 200) {
        const radius = 3;
        
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const distance = Math.sqrt(i * i + j * j);
                if (distance <= radius) {
                    const px = Math.floor(x) + i;
                    const py = Math.floor(y) + j;
                    
                    if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                        const index = py * this.width + px;
                        const force = intensity * (1 - distance / radius);
                        this.current[index] = force;
                    }
                }
            }
        }
    }
    
    updateWaterPhysics() {
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                const index = i * this.width + j;
                
                // Water wave equation: average of neighboring heights
                const newHeight = (
                    this.current[index - 1] +     // left
                    this.current[index + 1] +     // right
                    this.current[index - this.width] + // up
                    this.current[index + this.width]   // down
                ) / 2 - this.previous[index];
                
                // Apply damping
                this.previous[index] = this.current[index];
                this.current[index] = newHeight * this.damping;
            }
        }
    }
    
    renderWater() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;
        
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                const index = i * this.width + j;
                const pixelIndex = index * 4;
                
                const height = this.current[index];
                
                // Calculate water color based on height (depth)
                const intensity = Math.abs(height);
                const normalizedHeight = Math.min(255, Math.max(0, height + 128));
                
                // Crystal clear to deep water colors
                let r, g, b, a;
                
                if (intensity < 50) {
                    // Crystal clear water
                    r = 240 + Math.sin(height * 0.1) * 15;
                    g = 248 + Math.sin(height * 0.1) * 7;
                    b = 255;
                    a = 30 + intensity * 0.5;
                } else if (intensity < 150) {
                    // Medium depth
                    const factor = (intensity - 50) / 100;
                    r = 240 - factor * 105; // 240 to 135
                    g = 248 - factor * 42;  // 248 to 206
                    b = 255 - factor * 5;   // 255 to 250
                    a = 30 + intensity * 0.8;
                } else {
                    // Deep water
                    const factor = Math.min(1, (intensity - 150) / 100);
                    r = 135 - factor * 135; // 135 to 0
                    g = 206 - factor * 176; // 206 to 30
                    b = 250 - factor * 170; // 250 to 80
                    a = 100 + factor * 100;
                }
                
                // Add ripple reflections
                if (intensity > 10) {
                    const rippleEffect = Math.sin(height * 0.2) * 20;
                    r += rippleEffect;
                    g += rippleEffect;
                    b += rippleEffect;
                }
                
                data[pixelIndex] = Math.max(0, Math.min(255, r));     // Red
                data[pixelIndex + 1] = Math.max(0, Math.min(255, g)); // Green
                data[pixelIndex + 2] = Math.max(0, Math.min(255, b)); // Blue
                data[pixelIndex + 3] = Math.max(0, Math.min(255, a)); // Alpha
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        // Add surface highlights
        this.renderSurfaceHighlights();
    }
    
    renderSurfaceHighlights() {
        this.ctx.globalCompositeOperation = 'screen';
        
        for (let i = 1; i < this.height - 1; i++) {
            for (let j = 1; j < this.width - 1; j++) {
                const index = i * this.width + j;
                const height = this.current[index];
                
                if (Math.abs(height) > 20) {
                    const x = j;
                    const y = i;
                    const intensity = Math.min(1, Math.abs(height) / 100);
                    
                    // Create highlight gradient
                    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 3);
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.3})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    animate() {
        this.updateWaterPhysics();
        this.renderWater();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize realistic water effects
document.addEventListener('DOMContentLoaded', function() {
    // Remove old water effects
    if (window.waterEffects) {
        window.waterEffects.destroy();
    }
    
    // Create realistic water
    window.realisticWater = new RealisticWater();
});