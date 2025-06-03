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
        // Create deep ocean container
        const waterContainer = document.createElement('div');
        waterContainer.className = 'water-container';
        waterContainer.id = 'water-container';
        
        // Create multiple water layers for depth
        const deepLayer = document.createElement('div');
        deepLayer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(ellipse at center bottom, 
                rgba(0, 100, 200, 0.3) 0%, 
                rgba(0, 50, 150, 0.2) 50%, 
                transparent 100%);
            animation: deep-current 25s ease-in-out infinite;
        `;
        
        // Create water surface with enhanced effects
        const waterSurface = document.createElement('div');
        waterSurface.className = 'water-surface';
        waterSurface.id = 'water-surface';
        
        // Create underwater currents
        const currentLayer1 = document.createElement('div');
        currentLayer1.style.cssText = `
            position: absolute; top: 0; left: 0; width: 120%; height: 100%;
            background: linear-gradient(45deg, 
                transparent 0%, 
                rgba(0, 150, 255, 0.1) 30%, 
                transparent 60%);
            animation: underwater-current-1 30s linear infinite;
        `;
        
        const currentLayer2 = document.createElement('div');
        currentLayer2.style.cssText = `
            position: absolute; top: 0; left: 0; width: 120%; height: 100%;
            background: linear-gradient(-45deg, 
                transparent 0%, 
                rgba(0, 200, 255, 0.08) 40%, 
                transparent 80%);
            animation: underwater-current-2 40s linear infinite reverse;
        `;
        
        // Create wave background
        const waveBackground = document.createElement('div');
        waveBackground.className = 'wave-background';
        
        // Add depth particles
        this.createDepthParticles(waterContainer);
        
        waterContainer.appendChild(deepLayer);
        waterContainer.appendChild(currentLayer1);
        waterContainer.appendChild(currentLayer2);
        waterContainer.appendChild(waterSurface);
        waterContainer.appendChild(waveBackground);
        
        // Insert at the beginning of body
        document.body.insertBefore(waterContainer, document.body.firstChild);
        
        // Add dynamic styles
        this.addDynamicStyles();
    }
    
    addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes deep-current {
                0%, 100% { transform: translateX(0) scale(1); opacity: 0.3; }
                50% { transform: translateX(-20px) scale(1.1); opacity: 0.5; }
            }
            
            @keyframes underwater-current-1 {
                0% { transform: translateX(-20%); }
                100% { transform: translateX(100%); }
            }
            
            @keyframes underwater-current-2 {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-20%); }
            }
            
            @keyframes depth-particle {
                0% { transform: translateY(100vh) scale(0); opacity: 0; }
                10% { opacity: 0.6; transform: translateY(90vh) scale(1); }
                90% { opacity: 0.6; }
                100% { transform: translateY(-10vh) scale(0); opacity: 0; }
            }
            
            @keyframes floating-debris {
                0% { transform: translateY(100vh) translateX(0) rotate(0deg); opacity: 0; }
                10% { opacity: 0.8; }
                90% { opacity: 0.3; }
                100% { transform: translateY(-10vh) translateX(50px) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    createDepthParticles(container) {
        // Create various underwater particles
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: ${2 + Math.random() * 4}px;
                    height: ${2 + Math.random() * 4}px;
                    background: rgba(0, 150, 255, ${0.3 + Math.random() * 0.4});
                    border-radius: 50%;
                    left: ${Math.random() * 100}%;
                    animation: depth-particle ${15 + Math.random() * 10}s linear infinite;
                    animation-delay: ${Math.random() * 15}s;
                `;
                container.appendChild(particle);
                
                // Remove after animation cycle
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 25000);
            }, i * 1000);
        }
        
        // Create floating debris for realism
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const debris = document.createElement('div');
                debris.style.cssText = `
                    position: absolute;
                    width: ${8 + Math.random() * 6}px;
                    height: ${3 + Math.random() * 3}px;
                    background: rgba(0, 100, 150, 0.4);
                    border-radius: 2px;
                    left: ${Math.random() * 100}%;
                    animation: floating-debris ${20 + Math.random() * 15}s linear infinite;
                    animation-delay: ${Math.random() * 20}s;
                `;
                container.appendChild(debris);
                
                setTimeout(() => {
                    if (debris.parentNode) {
                        debris.parentNode.removeChild(debris);
                    }
                }, 35000);
            }, i * 3000);
        }
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