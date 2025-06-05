/**
 * Interactive Water Effects System
 * Copyright: Ervin Remus Radosavlevici (© ervin210@icloud.com)
 * Inspired by cinemagraph water effects with touch interaction
 */

class InteractiveWaterEffects {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.waves = [];
        this.ripples = [];
        this.mousePos = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.initializeWaves();
        this.animate();
    }
    
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'water-effects-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            opacity: 0.8;
            mix-blend-mode: multiply;
        `;
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }
    
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    setupEventListeners() {
        // Enable pointer events for interaction
        this.canvas.style.pointerEvents = 'auto';
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
            
            if (this.isMouseDown) {
                this.createRipple(e.clientX, e.clientY, 'continuous');
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.createRipple(e.clientX, e.clientY, 'impact');
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.createRipple(e.clientX, e.clientY, 'click');
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.createRipple(touch.clientX, touch.clientY, 'touch');
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.createRipple(touch.clientX, touch.clientY, 'drag');
        });
        
        window.addEventListener('resize', () => this.resize());
    }
    
    initializeWaves() {
        // Create background ambient waves
        for (let i = 0; i < 8; i++) {
            this.waves.push({
                x: Math.random() * this.width,
                y: this.height * 0.7 + Math.random() * this.height * 0.3,
                amplitude: 20 + Math.random() * 30,
                frequency: 0.01 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03,
                opacity: 0.1 + Math.random() * 0.3
            });
        }
    }
    
    createRipple(x, y, type = 'click') {
        const intensity = {
            'click': 1,
            'impact': 1.5,
            'continuous': 0.3,
            'touch': 1.2,
            'drag': 0.5
        };
        
        const ripple = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 80 + Math.random() * 120,
            opacity: 0.8 * (intensity[type] || 1),
            speed: 2 + Math.random() * 3,
            life: 0,
            maxLife: 60 + Math.random() * 40,
            type: type,
            color: this.getWaterColor(),
            distortion: []
        };
        
        // Create distortion points for more realistic water effect
        for (let i = 0; i < 16; i++) {
            ripple.distortion.push({
                angle: (i / 16) * Math.PI * 2,
                offset: (Math.random() - 0.5) * 10
            });
        }
        
        this.ripples.push(ripple);
        
        // Limit ripples to prevent performance issues
        if (this.ripples.length > 50) {
            this.ripples = this.ripples.slice(-30);
        }
    }
    
    getWaterColor() {
        const colors = [
            'rgba(0, 150, 255, 0.3)',
            'rgba(0, 200, 255, 0.2)',
            'rgba(100, 180, 255, 0.25)',
            'rgba(50, 160, 255, 0.3)',
            'rgba(0, 170, 255, 0.2)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateWaves() {
        this.waves.forEach(wave => {
            wave.phase += wave.speed;
            wave.x += Math.sin(wave.phase * 0.5) * 0.5;
            
            // Boundary check
            if (wave.x < -100) wave.x = this.width + 100;
            if (wave.x > this.width + 100) wave.x = -100;
        });
    }
    
    updateRipples() {
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            ripple.life++;
            
            if (ripple.life >= ripple.maxLife) {
                this.ripples.splice(i, 1);
                continue;
            }
            
            ripple.radius += ripple.speed;
            ripple.opacity *= 0.96;
            
            // Update distortion for more natural movement
            ripple.distortion.forEach(dist => {
                dist.offset += (Math.random() - 0.5) * 0.5;
                dist.offset *= 0.98; // Decay distortion over time
            });
        }
    }
    
    drawWaves() {
        this.waves.forEach(wave => {
            this.ctx.save();
            this.ctx.globalAlpha = wave.opacity;
            this.ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)';
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            for (let x = 0; x <= this.width; x += 5) {
                const y = wave.y + Math.sin((x * wave.frequency) + wave.phase) * wave.amplitude;
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
            this.ctx.restore();
        });
    }
    
    drawRipples() {
        this.ripples.forEach(ripple => {
            this.ctx.save();
            this.ctx.globalAlpha = ripple.opacity;
            
            // Create gradient for water effect
            const gradient = this.ctx.createRadialGradient(
                ripple.x, ripple.y, 0,
                ripple.x, ripple.y, ripple.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            gradient.addColorStop(0.3, ripple.color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            // Draw main ripple with distortion
            this.ctx.beginPath();
            const numPoints = ripple.distortion.length;
            
            for (let i = 0; i <= numPoints; i++) {
                const distortion = ripple.distortion[i % numPoints];
                const angle = distortion.angle;
                const offset = distortion.offset;
                const radius = ripple.radius + offset;
                
                const x = ripple.x + Math.cos(angle) * radius;
                const y = ripple.y + Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Add inner highlight
            if (ripple.radius > 10) {
                this.ctx.beginPath();
                this.ctx.arc(ripple.x, ripple.y, ripple.radius * 0.3, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    drawParticles() {
        // Add floating particles for enhanced effect
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 20; i++) {
            const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * this.width;
            const y = (Math.cos(time * 0.3 + i * 0.5) * 0.5 + 0.5) * this.height;
            const size = 1 + Math.sin(time * 2 + i) * 0.5;
            
            this.ctx.save();
            this.ctx.globalAlpha = 0.1 + Math.sin(time * 3 + i) * 0.05;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.updateWaves();
        this.updateRipples();
        
        this.drawWaves();
        this.drawRipples();
        this.drawParticles();
        
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

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure page is fully loaded
    setTimeout(() => {
        window.waterEffects = new InteractiveWaterEffects();
    }, 1000);
});

// Handle page visibility to optimize performance
document.addEventListener('visibilitychange', function() {
    if (window.waterEffects) {
        if (document.hidden) {
            // Reduce animation frequency when page is hidden
            window.waterEffects.canvas.style.display = 'none';
        } else {
            window.waterEffects.canvas.style.display = 'block';
        }
    }
});