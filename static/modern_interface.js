/**
 * AVA CORE: Modern Enhanced Interface
 * Copyright and Trademark: Ervin Radosavlevici
 * 
 * Advanced modern interface with glassmorphism design and comprehensive features
 */

class ModernAVAInterface {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.panelVisible = false;
        this.activeFeatures = new Set();
        this.notifications = [];
        
        this.init();
    }
    
    init() {
        this.setupWebSocket();
        this.createModernInterface();
        this.bindEvents();
        this.loadInitialData();
        this.startPeriodicUpdates();
    }
    
    setupWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus('connected');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus('disconnected');
        });
        
        this.socket.on('conversation_update', (data) => {
            this.addConversationMessage(data);
        });
        
        this.socket.on('status_update', (data) => {
            this.updateStatus(data);
        });
    }
    
    createModernInterface() {
        // Remove existing control elements
        const existingControl = document.querySelector('.modern-control-wrapper');
        if (existingControl) {
            existingControl.remove();
        }
        
        // Create new modern control system
        const controlWrapper = document.createElement('div');
        controlWrapper.className = 'ultra-modern-control';
        
        controlWrapper.innerHTML = `
            <div class="floating-orb" id="mainOrb">
                <div class="orb-core">
                    <i data-feather="cpu"></i>
                </div>
                <div class="orb-rings">
                    <div class="ring ring-1"></div>
                    <div class="ring ring-2"></div>
                    <div class="ring ring-3"></div>
                </div>
                <div class="pulse-effect"></div>
            </div>
            
            <div class="ultra-panel hidden" id="ultraPanel">
                <div class="panel-header">
                    <div class="header-content">
                        <div class="status-indicator" id="statusIndicator"></div>
                        <h3>AVA CORE</h3>
                        <div class="connection-status" id="connectionStatus">●</div>
                    </div>
                    <button class="close-btn" id="closePanel">×</button>
                </div>
                
                <div class="panel-body">
                    <div class="feature-grid">
                        <div class="feature-card voice-card" data-feature="voice">
                            <div class="card-icon">
                                <i data-feather="mic"></i>
                            </div>
                            <h4>Voice Assistant</h4>
                            <p>Start/Stop Voice Recognition</p>
                            <div class="card-actions">
                                <button class="action-btn start-btn" id="startVoice">Start</button>
                                <button class="action-btn stop-btn" id="stopVoice">Stop</button>
                            </div>
                        </div>
                        
                        <div class="feature-card dev-card" data-feature="development">
                            <div class="card-icon">
                                <i data-feather="code"></i>
                            </div>
                            <h4>Development Suite</h4>
                            <p>Secret Management & Workflows</p>
                            <div class="card-actions">
                                <button class="action-btn dev-btn" id="openDev">Open Suite</button>
                            </div>
                        </div>
                        
                        <div class="feature-card security-card" data-feature="security">
                            <div class="card-icon">
                                <i data-feather="shield"></i>
                            </div>
                            <h4>Security & Defense</h4>
                            <p>Self-Defense Systems</p>
                            <div class="card-actions">
                                <button class="action-btn security-btn" id="checkSecurity">Status</button>
                            </div>
                        </div>
                        
                        <div class="feature-card memory-card" data-feature="memory">
                            <div class="card-icon">
                                <i data-feather="database"></i>
                            </div>
                            <h4>Persistent Memory</h4>
                            <p>Cross-Device Memory</p>
                            <div class="card-actions">
                                <button class="action-btn memory-btn" id="checkMemory">Check</button>
                            </div>
                        </div>
                        
                        <div class="feature-card upgrade-card" data-feature="upgrade">
                            <div class="card-icon">
                                <i data-feather="download"></i>
                            </div>
                            <h4>Self-Upgrade</h4>
                            <p>System Updates</p>
                            <div class="card-actions">
                                <button class="action-btn upgrade-btn" id="performUpgrade">Upgrade</button>
                            </div>
                        </div>
                        
                        <div class="feature-card network-card" data-feature="network">
                            <div class="card-icon">
                                <i data-feather="wifi"></i>
                            </div>
                            <h4>Network Discovery</h4>
                            <p>Device Discovery</p>
                            <div class="card-actions">
                                <button class="action-btn network-btn" id="startNetwork">Discover</button>
                            </div>
                        </div>
                        
                        <div class="feature-card automation-card" data-feature="automation">
                            <div class="card-icon">
                                <i data-feather="zap"></i>
                            </div>
                            <h4>Automation</h4>
                            <p>Computer Control</p>
                            <div class="card-actions">
                                <button class="action-btn automation-btn" id="openAutomation">Control</button>
                            </div>
                        </div>
                        
                        <div class="feature-card chat-card" data-feature="chat">
                            <div class="card-icon">
                                <i data-feather="message-circle"></i>
                            </div>
                            <h4>Secure Chat</h4>
                            <p>Private Conversations</p>
                            <div class="card-actions">
                                <button class="action-btn chat-btn" id="openChat">Chat</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="panel-footer">
                    <div class="system-stats" id="systemStats">
                        <span class="stat">CPU: --</span>
                        <span class="stat">Memory: --</span>
                        <span class="stat">Active: --</span>
                    </div>
                </div>
            </div>
            
            <div class="notification-container" id="notificationContainer"></div>
        `;
        
        // Insert after the main content
        const main = document.querySelector('.main');
        if (main) {
            main.appendChild(controlWrapper);
        }
        
        // Add enhanced styles
        this.addEnhancedStyles();
        
        // Initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    addEnhancedStyles() {
        const style = document.createElement('style');
        style.id = 'ultra-modern-styles';
        style.textContent = `
            .ultra-modern-control {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 10000;
            }
            
            .floating-orb {
                position: relative;
                width: 80px;
                height: 80px;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .orb-core {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
                z-index: 10;
            }
            
            .orb-rings {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            
            .ring {
                position: absolute;
                border: 2px solid rgba(102, 126, 234, 0.3);
                border-radius: 50%;
                animation: pulse-ring 3s infinite;
            }
            
            .ring-1 {
                width: 70px;
                height: 70px;
                top: -35px;
                left: -35px;
                animation-delay: 0s;
            }
            
            .ring-2 {
                width: 85px;
                height: 85px;
                top: -42.5px;
                left: -42.5px;
                animation-delay: 1s;
            }
            
            .ring-3 {
                width: 100px;
                height: 100px;
                top: -50px;
                left: -50px;
                animation-delay: 2s;
            }
            
            @keyframes pulse-ring {
                0% {
                    opacity: 0.6;
                    transform: scale(0.8);
                }
                50% {
                    opacity: 0.3;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(1.2);
                }
            }
            
            .pulse-effect {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 60px;
                background: radial-gradient(circle, rgba(102, 126, 234, 0.4) 0%, transparent 70%);
                border-radius: 50%;
                animation: pulse-glow 2s ease-in-out infinite;
            }
            
            @keyframes pulse-glow {
                0%, 100% {
                    opacity: 0.4;
                    transform: translate(-50%, -50%) scale(1);
                }
                50% {
                    opacity: 0.8;
                    transform: translate(-50%, -50%) scale(1.1);
                }
            }
            
            .floating-orb:hover {
                transform: translateY(-5px) scale(1.05);
            }
            
            .floating-orb:hover .orb-core {
                box-shadow: 0 15px 50px rgba(102, 126, 234, 0.6);
            }
            
            .ultra-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90vw;
                max-width: 1200px;
                max-height: 90vh;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(30px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                box-shadow: 0 25px 100px rgba(0, 0, 0, 0.8);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
                z-index: 9999;
            }
            
            .ultra-panel.hidden {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
                pointer-events: none;
            }
            
            .panel-header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 20px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 24px 24px 0 0;
            }
            
            .header-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .header-content h3 {
                color: white;
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                letter-spacing: 1px;
            }
            
            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #10b981;
                animation: status-pulse 2s infinite;
            }
            
            @keyframes status-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .connection-status {
                color: #10b981;
                font-size: 18px;
                font-weight: bold;
            }
            
            .close-btn {
                background: rgba(255, 255, 255, 0.15);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.1);
            }
            
            .panel-body {
                padding: 30px;
                overflow-y: auto;
                max-height: calc(90vh - 140px);
            }
            
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }
            
            .feature-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 24px;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            
            .feature-card:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
            }
            
            .card-icon {
                width: 50px;
                height: 50px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 15px;
                font-size: 24px;
                color: white;
            }
            
            .voice-card .card-icon { background: linear-gradient(135deg, #10b981, #059669); }
            .dev-card .card-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
            .security-card .card-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .memory-card .card-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            .upgrade-card .card-icon { background: linear-gradient(135deg, #06d6a0, #05a082); }
            .network-card .card-icon { background: linear-gradient(135deg, #06b6d4, #0891b2); }
            .automation-card .card-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .chat-card .card-icon { background: linear-gradient(135deg, #6b7280, #4b5563); }
            
            .feature-card h4 {
                color: white;
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .feature-card p {
                color: rgba(255, 255, 255, 0.7);
                margin: 0 0 20px 0;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .card-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .action-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
                color: white;
                flex: 1;
                min-width: 70px;
            }
            
            .start-btn { background: linear-gradient(135deg, #10b981, #059669); }
            .stop-btn { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .dev-btn { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
            .security-btn { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .memory-btn { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            .upgrade-btn { background: linear-gradient(135deg, #06d6a0, #05a082); }
            .network-btn { background: linear-gradient(135deg, #06b6d4, #0891b2); }
            .automation-btn { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .chat-btn { background: linear-gradient(135deg, #6b7280, #4b5563); }
            
            .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .panel-footer {
                background: rgba(255, 255, 255, 0.05);
                padding: 15px 30px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .system-stats {
                display: flex;
                gap: 20px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
            }
            
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 11000;
                max-width: 400px;
            }
            
            .notification {
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(20px);
                color: white;
                padding: 15px 20px;
                border-radius: 12px;
                margin-bottom: 10px;
                border-left: 4px solid;
                animation: slideInRight 0.3s ease;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            
            .notification.success { border-left-color: #10b981; }
            .notification.error { border-left-color: #ef4444; }
            .notification.warning { border-left-color: #f59e0b; }
            .notification.info { border-left-color: #3b82f6; }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @media (max-width: 768px) {
                .ultra-panel {
                    width: 95vw;
                    max-height: 95vh;
                }
                
                .feature-grid {
                    grid-template-columns: 1fr;
                }
                
                .panel-header {
                    padding: 15px 20px;
                }
                
                .panel-body {
                    padding: 20px;
                }
                
                .floating-orb {
                    width: 70px;
                    height: 70px;
                }
                
                .orb-core {
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    bindEvents() {
        const mainOrb = document.getElementById('mainOrb');
        const ultraPanel = document.getElementById('ultraPanel');
        const closePanel = document.getElementById('closePanel');
        
        mainOrb?.addEventListener('click', () => {
            this.togglePanel();
        });
        
        closePanel?.addEventListener('click', () => {
            this.hidePanel();
        });
        
        // Bind feature buttons
        this.bindFeatureButtons();
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!ultraPanel?.contains(e.target) && !mainOrb?.contains(e.target) && this.panelVisible) {
                this.hidePanel();
            }
        });
    }
    
    bindFeatureButtons() {
        // Voice controls
        document.getElementById('startVoice')?.addEventListener('click', () => {
            this.startAssistant();
        });
        
        document.getElementById('stopVoice')?.addEventListener('click', () => {
            this.stopAssistant();
        });
        
        // Development suite
        document.getElementById('openDev')?.addEventListener('click', () => {
            this.openDevelopmentSuite();
        });
        
        // Security
        document.getElementById('checkSecurity')?.addEventListener('click', () => {
            this.checkSecurityStatus();
        });
        
        // Memory
        document.getElementById('checkMemory')?.addEventListener('click', () => {
            this.checkMemoryStatus();
        });
        
        // Upgrade
        document.getElementById('performUpgrade')?.addEventListener('click', () => {
            this.performSystemUpgrade();
        });
        
        // Network
        document.getElementById('startNetwork')?.addEventListener('click', () => {
            this.startNetworkDiscovery();
        });
        
        // Automation
        document.getElementById('openAutomation')?.addEventListener('click', () => {
            this.openAutomation();
        });
        
        // Chat
        document.getElementById('openChat')?.addEventListener('click', () => {
            this.openSecureChat();
        });
    }
    
    togglePanel() {
        if (this.panelVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    showPanel() {
        const panel = document.getElementById('ultraPanel');
        if (panel) {
            panel.classList.remove('hidden');
            this.panelVisible = true;
            this.updateSystemStats();
        }
    }
    
    hidePanel() {
        const panel = document.getElementById('ultraPanel');
        if (panel) {
            panel.classList.add('hidden');
            this.panelVisible = false;
        }
    }
    
    updateSystemStats() {
        const statsElement = document.getElementById('systemStats');
        if (statsElement) {
            // Get basic system info
            const activeFeatures = this.activeFeatures.size;
            const connectionStatus = this.isConnected ? 'Connected' : 'Disconnected';
            
            statsElement.innerHTML = `
                <span class="stat">Connection: ${connectionStatus}</span>
                <span class="stat">Active Features: ${activeFeatures}</span>
                <span class="stat">Notifications: ${this.notifications.length}</span>
            `;
        }
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        this.notifications.push({ message, type, timestamp: Date.now() });
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                this.notifications = this.notifications.filter(n => n.timestamp !== notification.timestamp);
            }
        }, duration);
    }
    
    updateConnectionStatus(status) {
        const indicator = document.getElementById('connectionStatus');
        if (indicator) {
            indicator.textContent = status === 'connected' ? '●' : '○';
            indicator.style.color = status === 'connected' ? '#10b981' : '#ef4444';
        }
    }
    
    // Feature implementations
    async startAssistant() {
        try {
            const response = await fetch('/api/start', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Voice assistant started successfully', 'success');
                this.activeFeatures.add('voice');
            } else {
                this.showNotification('Failed to start voice assistant', 'error');
            }
        } catch (error) {
            this.showNotification('Error starting assistant', 'error');
        }
    }
    
    async stopAssistant() {
        try {
            const response = await fetch('/api/stop', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Voice assistant stopped', 'success');
                this.activeFeatures.delete('voice');
            } else {
                this.showNotification('Failed to stop voice assistant', 'error');
            }
        } catch (error) {
            this.showNotification('Error stopping assistant', 'error');
        }
    }
    
    openDevelopmentSuite() {
        const options = [
            'Start Development Session',
            'Create New Project', 
            'Manage Secrets',
            'View Development Stats',
            'Git Operations',
            'Run Tests',
            'Deploy Project'
        ];
        
        const choice = prompt(`Development Suite Options:\n${options.map((opt, i) => `${i+1}. ${opt}`).join('\n')}\n\nEnter number (1-${options.length}):`);
        
        if (choice) {
            const index = parseInt(choice) - 1;
            if (index >= 0 && index < options.length) {
                switch(index) {
                    case 0: this.startDevSession(); break;
                    case 1: this.createProject(); break;
                    case 2: this.manageSecrets(); break;
                    case 3: this.viewDevStats(); break;
                    case 4: this.gitOperations(); break;
                    case 5: this.runTests(); break;
                    case 6: this.deployProject(); break;
                }
            }
        }
    }
    
    async startDevSession() {
        try {
            const response = await fetch('/api/development/session/start', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Development session started - ${data.tools_available?.length || 0} tools available`, 'success');
                this.activeFeatures.add('development');
            } else {
                this.showNotification('Failed to start development session', 'error');
            }
        } catch (error) {
            this.showNotification('Error starting development session', 'error');
        }
    }
    
    async createProject() {
        const projectName = prompt('Enter project name:');
        if (!projectName) return;
        
        const projectType = prompt('Enter project type (python/javascript/web/generic):') || 'generic';
        
        try {
            const response = await fetch('/api/development/project/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_name: projectName,
                    project_type: projectType
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Project "${projectName}" created successfully`, 'success');
            } else {
                this.showNotification(`Failed to create project: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Error creating project', 'error');
        }
    }
    
    manageSecrets() {
        const actions = ['List Secrets', 'Add Secret', 'Delete Secret'];
        const action = prompt(`Secret Management:\n${actions.map((a, i) => `${i+1}. ${a}`).join('\n')}\n\nEnter number:`);
        
        if (!action) return;
        
        const index = parseInt(action) - 1;
        switch(index) {
            case 0: this.listSecrets(); break;
            case 1: this.addSecret(); break;
            case 2: this.deleteSecret(); break;
        }
    }
    
    async listSecrets() {
        try {
            const response = await fetch('/api/development/secrets');
            const data = await response.json();
            
            if (data.success) {
                const secrets = data.secrets;
                if (secrets.length === 0) {
                    this.showNotification('No secrets stored', 'info');
                } else {
                    const secretList = secrets.map(s => `${s.service_name} (${s.category})`).join('\n');
                    alert(`Stored Secrets:\n\n${secretList}`);
                }
            } else {
                this.showNotification('Failed to list secrets', 'error');
            }
        } catch (error) {
            this.showNotification('Error listing secrets', 'error');
        }
    }
    
    async addSecret() {
        const serviceName = prompt('Enter service name (e.g., GITHUB_TOKEN):');
        if (!serviceName) return;
        
        const secretValue = prompt('Enter secret value:');
        if (!secretValue) return;
        
        const description = prompt('Enter description (optional):') || '';
        const category = prompt('Enter category (git/deployment/ai/cloud):') || 'general';
        
        try {
            const response = await fetch('/api/development/secrets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_name: serviceName,
                    secret_value: secretValue,
                    description: description,
                    category: category
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Secret "${serviceName}" stored securely`, 'success');
            } else {
                this.showNotification(`Failed to store secret: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Error storing secret', 'error');
        }
    }
    
    async deleteSecret() {
        await this.listSecrets();
        const serviceName = prompt('Enter service name to delete:');
        if (!serviceName) return;
        
        if (confirm(`Delete secret "${serviceName}"? This cannot be undone.`)) {
            try {
                const response = await fetch(`/api/development/secrets/${serviceName}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    this.showNotification(`Secret "${serviceName}" deleted`, 'success');
                } else {
                    this.showNotification(`Failed to delete secret: ${data.error}`, 'error');
                }
            } catch (error) {
                this.showNotification('Error deleting secret', 'error');
            }
        }
    }
    
    async viewDevStats() {
        const days = prompt('Enter number of days (default 30):') || '30';
        
        try {
            const response = await fetch(`/api/development/stats?days=${days}`);
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                const summary = `Development Stats (${days} days):
                
Sessions: ${stats.total_sessions}
Hours: ${stats.total_hours}
Commits: ${stats.total_commits}
Avg Productivity: ${stats.average_productivity}%`;
                
                alert(summary);
            } else {
                this.showNotification('Failed to get development stats', 'error');
            }
        } catch (error) {
            this.showNotification('Error getting development stats', 'error');
        }
    }
    
    async gitOperations() {
        const message = prompt('Enter commit message:') || 'AVA CORE development update';
        const projectPath = prompt('Enter project path (default current):') || '.';
        
        try {
            const response = await fetch('/api/development/git/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    project_path: projectPath
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Changes committed: ${data.commit_hash}`, 'success');
            } else {
                this.showNotification(`Commit failed: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Error committing changes', 'error');
        }
    }
    
    async runTests() {
        const projectPath = prompt('Enter project path (default current):') || '.';
        
        this.showNotification('Running tests...', 'info');
        
        try {
            const response = await fetch('/api/development/test/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ project_path: projectPath })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Tests completed successfully with ${data.command}`, 'success');
            } else {
                this.showNotification(`Tests failed: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Error running tests', 'error');
        }
    }
    
    async deployProject() {
        const targets = ['heroku', 'vercel', 'github_pages'];
        const target = prompt(`Deploy to:\n${targets.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\nEnter number:`);
        
        if (!target) return;
        
        const targetIndex = parseInt(target) - 1;
        if (targetIndex < 0 || targetIndex >= targets.length) return;
        
        const deploymentTarget = targets[targetIndex];
        const projectPath = prompt('Enter project path (default current):') || '.';
        
        this.showNotification(`Deploying to ${deploymentTarget}...`, 'info');
        
        try {
            const response = await fetch('/api/development/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_path: projectPath,
                    target: deploymentTarget
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.next_steps) {
                    alert(`Deployment configured!\n\nNext steps:\n${data.next_steps.join('\n')}`);
                } else {
                    this.showNotification(`Deployment to ${deploymentTarget} successful`, 'success');
                }
            } else {
                if (data.action_required) {
                    this.showNotification(`${data.error} - ${data.action_required}`, 'warning');
                } else {
                    this.showNotification(`Deployment failed: ${data.error}`, 'error');
                }
            }
        } catch (error) {
            this.showNotification('Error deploying project', 'error');
        }
    }
    
    async checkSecurityStatus() {
        try {
            const response = await fetch('/api/self-management/defense/status');
            const data = await response.json();
            
            if (data.success) {
                const status = data.security_status;
                this.showNotification(`Security Level: ${status.security_level || 'Normal'} - ${status.defensive_measures?.length || 0} measures active`, 'info');
                this.activeFeatures.add('security');
            } else {
                this.showNotification('Failed to check security status', 'error');
            }
        } catch (error) {
            this.showNotification('Security check failed', 'error');
        }
    }
    
    async checkMemoryStatus() {
        try {
            const response = await fetch('/api/self-management/memory/history?limit=10');
            const data = await response.json();
            
            if (data.success) {
                const count = data.history?.length || 0;
                this.showNotification(`Persistent Memory: ${count} recent conversations stored across devices`, 'success');
                this.activeFeatures.add('memory');
            } else {
                this.showNotification('Failed to check memory status', 'error');
            }
        } catch (error) {
            this.showNotification('Memory check failed', 'error');
        }
    }
    
    async performSystemUpgrade() {
        if (confirm('Perform system self-upgrade? This will check for and install available updates.')) {
            this.showNotification('Starting system upgrade...', 'info');
            
            try {
                const response = await fetch('/api/self-management/upgrade/perform', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    const result = data.upgrade_result;
                    const count = result.upgrades_performed?.length || 0;
                    this.showNotification(`Upgrade complete: ${count} packages updated`, 'success');
                    this.activeFeatures.add('upgrade');
                } else {
                    this.showNotification('Upgrade failed', 'error');
                }
            } catch (error) {
                this.showNotification('Upgrade request failed', 'error');
            }
        }
    }
    
    async startNetworkDiscovery() {
        try {
            const response = await fetch('/api/network/start', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Network discovery started', 'success');
                this.activeFeatures.add('network');
            } else {
                this.showNotification('Failed to start network discovery', 'error');
            }
        } catch (error) {
            this.showNotification('Network discovery failed', 'error');
        }
    }
    
    openAutomation() {
        const taskDescription = prompt('Enter automation task description (e.g., "open browser and navigate to google.com"):');
        if (taskDescription && taskDescription.trim()) {
            this.executeAutomationTask(taskDescription.trim());
        }
    }
    
    async executeAutomationTask(description) {
        this.showNotification('Processing automation task...', 'info');
        
        try {
            const response = await fetch('/api/automation/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_description: description,
                    user_id: 'web_user'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Automation task completed: ${data.result.message}`, 'success');
                this.activeFeatures.add('automation');
            } else {
                this.showNotification(`Automation failed: ${data.error}`, 'error');
            }
        } catch (error) {
            this.showNotification('Automation request failed', 'error');
        }
    }
    
    openSecureChat() {
        // Create or get chat session
        this.createChatSession();
    }
    
    async createChatSession() {
        try {
            const response = await fetch('/api/chat/session/create', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Secure chat session created: ${data.session_id}`, 'success');
                this.activeFeatures.add('chat');
                
                // Open chat interface
                const message = prompt('Enter your message to AVA:');
                if (message) {
                    this.sendChatMessage(data.session_id, message);
                }
            } else {
                this.showNotification('Failed to create chat session', 'error');
            }
        } catch (error) {
            this.showNotification('Chat session creation failed', 'error');
        }
    }
    
    async sendChatMessage(sessionId, message) {
        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: message
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(`AVA: ${data.response}`);
            } else {
                this.showNotification('Failed to send message', 'error');
            }
        } catch (error) {
            this.showNotification('Message send failed', 'error');
        }
    }
    
    loadInitialData() {
        // Load system status and update UI
        this.updateSystemStats();
    }
    
    startPeriodicUpdates() {
        // Update system stats every 30 seconds
        setInterval(() => {
            if (this.panelVisible) {
                this.updateSystemStats();
            }
        }, 30000);
    }
    
    // Event handlers for original interface compatibility
    addConversationMessage(data) {
        // Handle conversation updates from WebSocket
        console.log('Conversation update:', data);
    }
    
    updateStatus(data) {
        // Handle status updates from WebSocket
        console.log('Status update:', data);
    }
}

// Initialize the modern interface when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.modernAVA = new ModernAVAInterface();
});

// Export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModernAVAInterface;
}