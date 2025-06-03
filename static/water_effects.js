/**
 * AVA CORE: Interactive Water Effects
 * Copyright and Trademark: Ervin Radosavlevici
 * 
 * Creates beautiful water ripple effects that respond to touch and mouse interactions
 */

class WaterEffects {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.ripples = [];
        this.particles = [];
        this.bubbles = [];
        this.isInitialized = false;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.createWaterContainer();
        this.setupCanvas();
        this.bindEvents();
        this.startAnimation();
        this.createFloatingParticles();
        this.createBubbles();
        
        this.isInitialized = true;
        console.log('Water effects initialized');
    }
    
    createWaterContainer() {
        // Create water container
        const waterContainer = document.createElement('div');
        waterContainer.className = 'water-container';
        waterContainer.id = 'water-container';
        
        // Create water surface
        const waterSurface = document.createElement('div');
        waterSurface.className = 'water-surface';
        waterSurface.id = 'water-surface';
        
        // Create wave background
        const waveBackground = document.createElement('div');
        waveBackground.className = 'wave-background';
        
        waterContainer.appendChild(waterSurface);
        waterContainer.appendChild(waveBackground);
        
        // Insert at the beginning of body
        document.body.insertBefore(waterContainer, document.body.firstChild);
    }
    
    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'water-canvas';
        this.canvas.id = 'water-canvas';
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        const waterContainer = document.getElementById('water-container');
        waterContainer.appendChild(this.canvas);
        
        // Resize handler
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    bindEvents() {
        const waterSurface = document.getElementById('water-surface');
        
        // Mouse events
        waterSurface.addEventListener('click', (e) => this.createRipple(e));
        waterSurface.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Touch events
        waterSurface.addEventListener('touchstart', (e) => this.onTouchStart(e));
        waterSurface.addEventListener('touchmove', (e) => this.onTouchMove(e));
        
        // Prevent default touch behaviors
        waterSurface.addEventListener('touchstart', (e) => e.preventDefault());
        waterSurface.addEventListener('touchmove', (e) => e.preventDefault());
    }
    
    createRipple(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.addRipple(x, y, false);
        this.createTouchFeedback(event.clientX, event.clientY);
    }
    
    onMouseMove(event) {
        // Create subtle ripples on mouse move (throttled)
        if (Math.random() < 0.02) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.addRipple(x, y, true, 0.3);
        }
    }
    
    onTouchStart(event) {
        Array.from(event.touches).forEach(touch => {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.addRipple(x, y, true);
            this.createTouchFeedback(touch.clientX, touch.clientY);
        });
    }
    
    onTouchMove(event) {
        Array.from(event.touches).forEach(touch => {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.addRipple(x, y, true, 0.5);
        });
    }
    
    addRipple(x, y, isLarge = false, opacity = 1) {
        const ripple = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: isLarge ? 200 : 120,
            opacity: opacity,
            speed: isLarge ? 2 : 3,
            life: 0,
            maxLife: isLarge ? 60 : 40
        };
        
        this.ripples.push(ripple);
        
        // Create DOM ripple for additional effect
        this.createDOMRipple(x, y, isLarge);
    }
    
    createDOMRipple(x, y, isLarge = false) {
        const ripple = document.createElement('div');
        ripple.className = `ripple ${isLarge ? 'large' : ''}`;
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        const waterContainer = document.getElementById('water-container');
        waterContainer.appendChild(ripple);
        
        // Remove after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, isLarge ? 2000 : 1500);
    }
    
    createTouchFeedback(x, y) {
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.style.left = x + 'px';
        feedback.style.top = y + 'px';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 600);
    }
    
    createFloatingParticles() {
        for (let i = 0; i < 15; i++) {
            setTimeout(() => this.addParticle(), i * 500);
        }
        
        // Add new particles periodically
        setInterval(() => this.addParticle(), 3000);
    }
    
    addParticle() {
        const particle = document.createElement('div');
        particle.className = 'water-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (8 + Math.random() * 4) + 's';
        
        const waterContainer = document.getElementById('water-container');
        waterContainer.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 12000);
    }
    
    createBubbles() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => this.addBubble(), i * 800);
        }
        
        // Add new bubbles periodically
        setInterval(() => this.addBubble(), 5000);
    }
    
    addBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = 4 + Math.random() * 8;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.animationDelay = Math.random() * 4 + 's';
        bubble.style.animationDuration = (4 + Math.random() * 2) + 's';
        
        const waterContainer = document.getElementById('water-container');
        waterContainer.appendChild(bubble);
        
        // Remove after animation
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, 8000);
    }
    
    startAnimation() {
        this.animate();
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw ripples
        this.ripples = this.ripples.filter(ripple => {
            ripple.life++;
            ripple.radius += ripple.speed;
            ripple.opacity = (1 - ripple.life / ripple.maxLife) * 0.6;
            
            if (ripple.life < ripple.maxLife && ripple.radius < ripple.maxRadius) {
                this.drawRipple(ripple);
                return true;
            }
            return false;
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawRipple(ripple) {
        this.ctx.save();
        this.ctx.globalAlpha = ripple.opacity;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Inner ripple
        this.ctx.globalAlpha = ripple.opacity * 0.5;
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    // Enhanced card effects
    enhanceCards() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.add('water-themed');
        });
        
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            if (!button.classList.contains('liquid')) {
                button.classList.add('liquid');
            }
        });
    }
    
    // Auto-ripples for ambient effect
    createAutoRipples() {
        setInterval(() => {
            if (Math.random() < 0.3) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                this.addRipple(x, y, Math.random() < 0.3, 0.2);
            }
        }, 2000);
    }
    
    // Destroy method for cleanup
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const waterContainer = document.getElementById('water-container');
        if (waterContainer) {
            waterContainer.remove();
        }
        
        this.isInitialized = false;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        window.waterEffects = new WaterEffects();
        
        // Enhance cards after a short delay
        setTimeout(() => {
            if (window.waterEffects) {
                window.waterEffects.enhanceCards();
                window.waterEffects.createAutoRipples();
            }
        }, 1000);
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (window.waterEffects) {
        window.waterEffects.destroy();
    }
});