/**
 * AVA CORE: Neural AI Voice Assistant - Frontend JavaScript
 * Copyright and Trademark: Ervin Radosavlevici
 * 
 * Handles real-time WebSocket communication, UI updates, and user interactions
 */

class AVAInterface {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isListening = false;
        this.activityLog = [];
        this.maxLogEntries = 100;
        
        this.init();
    }
    
    init() {
        this.initWebSocket();
        this.bindEvents();
        this.initAutomationControls();
        this.initCompactControls();
        this.addWaterEffects();
        this.updateUI();
        
        // Load initial data
        this.loadStatus();
        this.loadConversation();
        this.loadAutomationCapabilities();
        
        console.log('AVA Interface initialized');
    }
    
    initWebSocket() {
        try {
            // Connect to WebSocket server using the correct protocol and path
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.socket = io(wsUrl, {
                path: '/ws',
                transports: ['websocket', 'polling']
            });
            
            // Connection events
            this.socket.on('connect', () => {
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                this.logActivity('system', 'Connected to AVA CORE');
                console.log('WebSocket connected');
            });
            
            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');
                this.logActivity('system', 'Disconnected from AVA CORE');
                console.log('WebSocket disconnected');
            });
            
            // Data events
            this.socket.on('conversation_update', (data) => {
                this.addConversationMessage(data);
            });
            
            this.socket.on('status_update', (data) => {
                this.updateStatus(data);
                this.logActivity(data.status, data.details || '');
            });
            
            this.socket.on('connection_status', (data) => {
                console.log('Connection status:', data);
            });
            
        } catch (error) {
            console.error('WebSocket initialization error:', error);
            this.updateConnectionStatus('disconnected');
        }
    }
    
    bindEvents() {
        // Control buttons
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const speakBtn = document.getElementById('speakBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startAssistant());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopAssistant());
        }
        
        if (speakBtn) {
            speakBtn.addEventListener('click', () => this.manualSpeak());
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
        
        // Manual speak form
        const speakForm = document.getElementById('speakForm');
        if (speakForm) {
            speakForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.manualSpeak();
            });
        }
        
        // Chat form
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatMessage();
            });
        }
        
        // Clear chat button
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChat());
        }
        
        // Periodic status updates
        setInterval(() => {
            if (this.isConnected) {
                this.loadStatus();
            }
        }, 5000);
    }
    
    async startAssistant() {
        try {
            this.setButtonLoading('startBtn', true);
            
            const response = await fetch('/api/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.isListening = true;
                this.showNotification('AVA CORE started successfully', 'success');
                this.logActivity('started', 'Voice assistant activated');
            } else {
                this.showNotification(result.error || 'Failed to start assistant', 'error');
            }
            
        } catch (error) {
            console.error('Start assistant error:', error);
            this.showNotification('Failed to start assistant', 'error');
        } finally {
            this.setButtonLoading('startBtn', false);
            this.updateUI();
        }
    }
    
    async stopAssistant() {
        try {
            this.setButtonLoading('stopBtn', true);
            
            const response = await fetch('/api/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.isListening = false;
                this.showNotification('AVA CORE stopped successfully', 'success');
                this.logActivity('stopped', 'Voice assistant deactivated');
            } else {
                this.showNotification(result.error || 'Failed to stop assistant', 'error');
            }
            
        } catch (error) {
            console.error('Stop assistant error:', error);
            this.showNotification('Failed to stop assistant', 'error');
        } finally {
            this.setButtonLoading('stopBtn', false);
            this.updateUI();
        }
    }
    
    async manualSpeak() {
        try {
            const textInput = document.getElementById('speakText');
            const text = textInput?.value?.trim();
            
            if (!text) {
                this.showNotification('Please enter text to speak', 'warning');
                return;
            }
            
            this.setButtonLoading('speakBtn', true);
            
            const response = await fetch('/api/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('Text spoken successfully', 'success');
                textInput.value = '';
            } else {
                this.showNotification(result.error || 'Failed to speak text', 'error');
            }
            
        } catch (error) {
            console.error('Manual speak error:', error);
            this.showNotification('Failed to speak text', 'error');
        } finally {
            this.setButtonLoading('speakBtn', false);
        }
    }
    
    async loadStatus() {
        try {
            const response = await fetch('/api/status');
            const status = await response.json();
            
            this.isListening = status.is_listening;
            this.updateStatusDisplay(status);
            this.updateUI();
            
        } catch (error) {
            console.error('Load status error:', error);
        }
    }
    
    async loadConversation() {
        try {
            const response = await fetch('/api/conversation');
            const conversation = await response.json();
            
            this.displayConversation(conversation);
            
        } catch (error) {
            console.error('Load conversation error:', error);
        }
    }
    
    async sendChatMessage() {
        try {
            const chatInput = document.getElementById('chatInput');
            const message = chatInput?.value?.trim();
            
            if (!message) {
                this.showNotification('Please enter a message', 'warning');
                return;
            }
            
            this.setButtonLoading('chatBtn', true);
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showNotification('Message sent successfully', 'success');
                chatInput.value = '';
                // Conversation will be updated via WebSocket or we can refresh
                this.loadConversation();
            } else {
                this.showNotification(result.error || 'Failed to send message', 'error');
            }
            
        } catch (error) {
            console.error('Chat error:', error);
            this.showNotification('Failed to send message', 'error');
        } finally {
            this.setButtonLoading('chatBtn', false);
        }
    }
    
    clearChat() {
        const conversationDiv = document.getElementById('conversation');
        if (conversationDiv) {
            conversationDiv.innerHTML = '<div class="conversation-empty">Conversation cleared. Start chatting with AVA above.</div>';
        }
        this.showNotification('Conversation cleared', 'info');
    }
    
    refreshData() {
        this.loadStatus();
        this.loadConversation();
        this.loadNetworkStatus();
        this.showNotification('Data refreshed', 'info');
    }

    async loadNetworkStatus() {
        try {
            const response = await fetch('/api/network/status');
            const status = await response.json();
            
            this.updateNetworkStatus(status);
            this.updateConnectionUrl(status.local_ip);
        } catch (error) {
            console.error('Failed to load network status:', error);
        }
    }

    updateNetworkStatus(status) {
        const networkStatusEl = document.getElementById('networkStatus');
        const devicesListEl = document.getElementById('devicesList');
        const discoveredDevicesEl = document.getElementById('discoveredDevices');
        
        if (networkStatusEl) {
            const statusText = status.discovery_active ? 
                `Active - Found ${status.discovered_devices} devices` : 
                'Network discovery inactive';
            networkStatusEl.innerHTML = `<span class="status-text">${statusText}</span>`;
        }
        
        if (devicesListEl && status.devices && status.devices.discovered) {
            const devices = Object.values(status.devices.discovered);
            
            if (devices.length > 0) {
                devicesListEl.innerHTML = devices.map(device => `
                    <div class="device-item">
                        <div class="device-info">
                            <strong>${device.hostname || device.ip}</strong>
                            <span class="device-type">${device.type}</span>
                            <span class="device-ip">${device.ip}</span>
                        </div>
                        <button class="btn btn-small" onclick="ava.connectToDevice('${device.ip}')">
                            Connect
                        </button>
                    </div>
                `).join('');
                
                if (discoveredDevicesEl) {
                    discoveredDevicesEl.style.display = 'block';
                }
            } else if (discoveredDevicesEl) {
                discoveredDevicesEl.style.display = 'none';
            }
        }
    }

    updateConnectionUrl(localIp) {
        const connectionUrlEl = document.getElementById('connectionUrl');
        if (connectionUrlEl && localIp) {
            connectionUrlEl.textContent = `http://${localIp}:5000`;
        }
    }

    async startNetworkDiscovery() {
        try {
            const response = await fetch('/api/network/discovery/start', {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Network discovery started - scanning for devices', 'success');
                await this.loadNetworkStatus();
            } else {
                this.showNotification(`Failed to start discovery: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Network discovery start error:', error);
            this.showNotification('Failed to start network discovery', 'error');
        }
    }

    async connectToDevice(ipAddress) {
        try {
            const response = await fetch('/api/network/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip_address: ipAddress })
            });
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Connected to device at ${ipAddress}`, 'success');
            } else {
                this.showNotification(`Connection failed: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Device connection error:', error);
            this.showNotification('Failed to connect to device', 'error');
        }
    }
    
    updateUI() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (startBtn) {
            startBtn.disabled = this.isListening;
        }
        
        if (stopBtn) {
            stopBtn.disabled = !this.isListening;
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status ${this.isListening ? 'listening' : 'offline'}`;
            statusIndicator.innerHTML = `
                <span class="status-dot"></span>
                ${this.isListening ? 'Listening' : 'Offline'}
            `;
        }
    }
    
    updateStatus(data) {
        const currentStatus = document.getElementById('currentStatus');
        if (currentStatus) {
            currentStatus.textContent = data.details || data.status;
        }
        
        // Update status indicator based on activity
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator && data.status) {
            let statusClass = 'offline';
            
            switch (data.status) {
                case 'listening':
                case 'ready':
                    statusClass = 'listening';
                    break;
                case 'processing':
                case 'speaking':
                    statusClass = 'online';
                    break;
                case 'error':
                    statusClass = 'error';
                    break;
                case 'started':
                    statusClass = 'online';
                    this.isListening = true;
                    break;
                case 'stopped':
                    statusClass = 'offline';
                    this.isListening = false;
                    break;
            }
            
            statusIndicator.className = `status ${statusClass}`;
            this.updateUI();
        }
    }
    
    updateStatusDisplay(status) {
        // Update conversation count
        const conversationCount = document.getElementById('conversationCount');
        if (conversationCount) {
            conversationCount.textContent = status.conversation_count || 0;
        }
        
        // Update last activity
        const lastActivity = document.getElementById('lastActivity');
        if (lastActivity) {
            lastActivity.textContent = status.last_activity || 'Never';
        }
    }
    
    addConversationMessage(message) {
        const conversationDiv = document.getElementById('conversation');
        if (!conversationDiv) return;
        
        // Remove empty state if present
        const emptyState = conversationDiv.querySelector('.conversation-empty');
        if (emptyState) {
            emptyState.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.speaker.toLowerCase()}`;
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-speaker">${message.speaker}</span>
                <span class="message-time">${message.timestamp}</span>
            </div>
            <div class="message-text">${this.escapeHtml(message.message)}</div>
        `;
        
        conversationDiv.appendChild(messageDiv);
        
        // Scroll to bottom
        conversationDiv.scrollTop = conversationDiv.scrollHeight;
        
        // Limit number of messages displayed
        const messages = conversationDiv.querySelectorAll('.message');
        if (messages.length > 50) {
            messages[0].remove();
        }
    }
    
    displayConversation(conversation) {
        const conversationDiv = document.getElementById('conversation');
        if (!conversationDiv) return;
        
        conversationDiv.innerHTML = '';
        
        if (conversation.length === 0) {
            conversationDiv.innerHTML = '<div class="conversation-empty">No conversation history available</div>';
        } else {
            conversation.forEach(message => {
                this.addConversationMessage(message);
            });
        }
    }
    
    logActivity(status, message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = { timestamp, status, message };
        
        this.activityLog.unshift(entry);
        
        // Limit log size
        if (this.activityLog.length > this.maxLogEntries) {
            this.activityLog = this.activityLog.slice(0, this.maxLogEntries);
        }
        
        this.updateActivityLog();
    }
    
    updateActivityLog() {
        const logDiv = document.getElementById('activityLog');
        if (!logDiv) return;
        
        logDiv.innerHTML = this.activityLog.map(entry => `
            <div class="log-entry">
                <span class="log-time">${entry.timestamp}</span>
                <span class="log-status ${entry.status}">${entry.status.toUpperCase()}</span>
                <span class="log-message">${this.escapeHtml(entry.message)}</span>
            </div>
        `).join('');
    }
    
    updateConnectionStatus(status) {
        let statusDiv = document.getElementById('connectionStatus');
        
        if (!statusDiv) {
            statusDiv = document.createElement('div');
            statusDiv.id = 'connectionStatus';
            statusDiv.className = 'connection-status';
            document.body.appendChild(statusDiv);
        }
        
        statusDiv.className = `connection-status ${status}`;
        statusDiv.textContent = status === 'connected' ? 'Connected' : 'Disconnected';
        
        // Auto-hide connection status after a few seconds if connected
        if (status === 'connected') {
            setTimeout(() => {
                if (statusDiv.textContent === 'Connected') {
                    statusDiv.style.display = 'none';
                }
            }, 3000);
        } else {
            statusDiv.style.display = 'block';
        }
    }
    
    setButtonLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        if (loading) {
            button.disabled = true;
            const originalText = button.innerHTML;
            button.dataset.originalText = originalText;
            button.innerHTML = '<span class="loading"></span> Loading...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;
        
        // Set background color based on type
        const colors = {
            success: 'hsl(120 60% 50%)',
            error: 'hsl(0 65% 55%)',
            warning: 'hsl(45 90% 55%)',
            info: 'hsl(200 70% 50%)'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.avaInterface = new AVAInterface();
});

    initAutomationControls() {
        // Automation task execution
        const executeTaskBtn = document.getElementById('executeTaskBtn');
        if (executeTaskBtn) {
            executeTaskBtn.addEventListener('click', () => {
                const taskInput = document.getElementById('automationTask');
                if (taskInput && taskInput.value.trim()) {
                    this.executeAutomationTask(taskInput.value.trim());
                    taskInput.value = '';
                }
            });
        }
        
        // Task input enter key handler
        const taskInput = document.getElementById('automationTask');
        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const task = taskInput.value.trim();
                    if (task) {
                        this.executeAutomationTask(task);
                        taskInput.value = '';
                    }
                }
            });
        }
    }
    
    initCompactControls() {
        const modernBtn = document.getElementById('modernControlBtn');
        const modernPanel = document.getElementById('modernPanel');
        const closeBtn = document.getElementById('closeModernBtn');
        
        if (modernBtn) {
            modernBtn.addEventListener('click', () => {
                modernPanel.classList.remove('hidden');
                modernPanel.classList.add('visible');
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modernPanel.classList.add('hidden');
                modernPanel.classList.remove('visible');
            });
        }
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (modernPanel && !modernPanel.contains(e.target) && !modernBtn.contains(e.target)) {
                modernPanel.classList.add('hidden');
                modernPanel.classList.remove('visible');
            }
        });
        
        // Network button
        const networkBtn = document.getElementById('networkBtn');
        if (networkBtn) {
            networkBtn.addEventListener('click', () => {
                fetch('/start_network_discovery', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        this.showNotification('Network discovery started', 'success');
                    });
            });
        }
        
        // Dev button
        const devBtn = document.getElementById('devBtn');
        if (devBtn) {
            devBtn.addEventListener('click', () => {
                window.open('/monitor', '_blank');
            });
        }
        
        // Security button
        const securityBtn = document.getElementById('securityBtn');
        if (securityBtn) {
            securityBtn.addEventListener('click', () => {
                this.checkSecurityStatus();
            });
        }
        
        // Memory button
        const memoryBtn = document.getElementById('memoryBtn');
        if (memoryBtn) {
            memoryBtn.addEventListener('click', () => {
                this.checkMemoryStatus();
            });
        }
        
        // Upgrade button
        const upgradeBtn = document.getElementById('upgradeBtn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                this.performSystemUpgrade();
            });
        }
        
        // Repair button
        const repairBtn = document.getElementById('repairBtn');
        if (repairBtn) {
            repairBtn.addEventListener('click', () => {
                this.performSystemRepair();
            });
        }
        
        // Work button
        const workBtn = document.getElementById('workBtn');
        if (workBtn) {
            workBtn.addEventListener('click', () => {
                this.handleExternalWork();
            });
        }
        
        // Dev button - enhanced with development suite
        const devBtnEnhanced = document.getElementById('devBtn');
        if (devBtnEnhanced) {
            devBtnEnhanced.addEventListener('click', () => {
                this.openDevelopmentSuite();
            });
        }
    }
    
    addWaterEffects() {
        // Add water effect CSS if not already present
        if (!document.querySelector('#waterEffects')) {
            const style = document.createElement('style');
            style.id = 'waterEffects';
            style.textContent = `
                body::before {
                    content: '';
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 200%;
                    height: 60px;
                    background: linear-gradient(90deg, rgba(0, 170, 255, 0.2), rgba(0, 140, 255, 0.4), rgba(0, 170, 255, 0.2));
                    border-radius: 50% 50% 0 0;
                    animation: wave 6s ease-in-out infinite;
                    z-index: -1;
                    pointer-events: none;
                }
                
                body::after {
                    content: '';
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 200%;
                    height: 40px;
                    background: linear-gradient(90deg, rgba(0, 170, 255, 0.15), rgba(0, 200, 255, 0.3), rgba(0, 170, 255, 0.15));
                    border-radius: 50% 50% 0 0;
                    animation: wave 4s ease-in-out infinite reverse;
                    z-index: -1;
                    pointer-events: none;
                }
                
                @keyframes wave {
                    0%, 100% { transform: translateX(-50%) translateY(0px); }
                    50% { transform: translateX(-50%) translateY(-15px); }
                }
                
                /* Modern Control System */
                .modern-control-wrapper {
                    display: flex;
                    justify-content: center;
                    margin-top: 15px;
                }
                
                .modern-control-btn {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    font-size: 22px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
                    position: relative;
                    z-index: 100;
                }
                
                .modern-control-btn:hover {
                    transform: translateY(-3px) scale(1.08);
                    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
                }
                
                .modern-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    width: 380px;
                    max-width: 90vw;
                    max-height: 85vh;
                    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
                    z-index: 1000;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                }
                
                .modern-panel.hidden {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                    pointer-events: none;
                }
                
                .modern-panel.visible {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                    pointer-events: all;
                }
                
                .modern-panel-header {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 24px 24px 0 0;
                }
                
                .panel-title {
                    color: white;
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                
                .modern-close-btn {
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }
                
                .modern-close-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: scale(1.1);
                }
                
                .modern-panel-grid {
                    padding: 24px;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
                
                .modern-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 16px 12px;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 500;
                    min-height: 70px;
                    text-align: center;
                    backdrop-filter: blur(10px);
                }
                
                .modern-btn:hover {
                    transform: translateY(-2px);
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
                }
                
                .modern-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .start-btn { 
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1)); 
                    border-color: rgba(34, 197, 94, 0.3); 
                }
                .start-btn:hover { 
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.2));
                    box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3); 
                }
                
                .stop-btn { 
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1)); 
                    border-color: rgba(239, 68, 68, 0.3); 
                }
                .stop-btn:hover { 
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.2));
                    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3); 
                }
                
                .security-btn { 
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 127, 0.1)); 
                    border-color: rgba(239, 68, 68, 0.3); 
                }
                .security-btn:hover { 
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 127, 0.2));
                    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3); 
                }
                
                .memory-btn { 
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.1)); 
                    border-color: rgba(59, 130, 246, 0.3); 
                }
                .memory-btn:hover { 
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.2));
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3); 
                }
                
                .upgrade-btn { 
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1)); 
                    border-color: rgba(16, 185, 129, 0.3); 
                }
                .upgrade-btn:hover { 
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2));
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3); 
                }
                
                .repair-btn { 
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1)); 
                    border-color: rgba(245, 158, 11, 0.3); 
                }
                .repair-btn:hover { 
                    background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.2));
                    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3); 
                }
                
                .network-btn { 
                    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.1)); 
                    border-color: rgba(6, 182, 212, 0.3); 
                }
                .network-btn:hover { 
                    background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(14, 165, 233, 0.2));
                    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3); 
                }
                
                .dev-btn { 
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.1)); 
                    border-color: rgba(139, 92, 246, 0.3); 
                }
                .dev-btn:hover { 
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.2));
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3); 
                }
                
                .work-btn { 
                    background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.1)); 
                    border-color: rgba(107, 114, 128, 0.3); 
                }
                .work-btn:hover { 
                    background: linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(75, 85, 99, 0.2));
                    box-shadow: 0 8px 25px rgba(107, 114, 128, 0.3); 
                }
                
                .refresh-btn { 
                    background: linear-gradient(135deg, rgba(156, 163, 175, 0.2), rgba(107, 114, 128, 0.1)); 
                    border-color: rgba(156, 163, 175, 0.3); 
                }
                .refresh-btn:hover { 
                    background: linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(107, 114, 128, 0.2));
                    box-shadow: 0 8px 25px rgba(156, 163, 175, 0.3); 
                }
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    checkSecurityStatus() {
        fetch('/api/self-management/defense/status')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const status = data.security_status;
                    this.showNotification(`Security Level: ${status.security_level || 'Normal'} - ${status.defensive_measures?.length || 0} measures active`, 'info');
                } else {
                    this.showNotification('Failed to check security status', 'error');
                }
            })
            .catch(error => {
                this.showNotification('Security check failed', 'error');
            });
    }
    
    checkMemoryStatus() {
        fetch('/api/self-management/memory/history?limit=10')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const count = data.history?.length || 0;
                    this.showNotification(`Persistent Memory: ${count} recent conversations stored across devices`, 'success');
                } else {
                    this.showNotification('Failed to check memory status', 'error');
                }
            })
            .catch(error => {
                this.showNotification('Memory check failed', 'error');
            });
    }
    
    performSystemUpgrade() {
        if (confirm('Perform system self-upgrade? This will check for and install available updates.')) {
            this.showNotification('Starting system upgrade...', 'info');
            
            fetch('/api/self-management/upgrade/perform', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const result = data.upgrade_result;
                        const count = result.upgrades_performed?.length || 0;
                        this.showNotification(`Upgrade complete: ${count} packages updated`, 'success');
                    } else {
                        this.showNotification('Upgrade failed', 'error');
                    }
                })
                .catch(error => {
                    this.showNotification('Upgrade request failed', 'error');
                });
        }
    }
    
    performSystemRepair() {
        this.showNotification('Running system health check and repair...', 'info');
        
        fetch('/api/self-management/repair/status')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const health = data.health_status;
                    const issues = health.issues_detected?.length || 0;
                    const repairs = health.repairs_attempted?.length || 0;
                    
                    if (issues > 0) {
                        this.showNotification(`Health check: ${issues} issues detected, ${repairs} repairs attempted`, 'warning');
                    } else {
                        this.showNotification('System health: All systems operating normally', 'success');
                    }
                } else {
                    this.showNotification('Health check failed', 'error');
                }
            })
            .catch(error => {
                this.showNotification('System repair check failed', 'error');
            });
    }
    
    handleExternalWork() {
        const taskDescription = prompt('Enter external work task description:');
        if (taskDescription && taskDescription.trim()) {
            this.showNotification('Processing external work request...', 'info');
            
            fetch('/api/self-management/work/external', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_description: taskDescription.trim(),
                    task_type: 'general'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const result = data.result;
                    this.showNotification(`Work accepted: Task #${result.work_id} - ${result.status}`, 'success');
                } else {
                    this.showNotification('Failed to process work request', 'error');
                }
            })
            .catch(error => {
                this.showNotification('Work request failed', 'error');
            });
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
    
    startDevSession() {
        fetch('/api/development/session/start', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.showNotification(`Development session started - ${data.tools_available?.length || 0} tools available`, 'success');
                } else {
                    this.showNotification('Failed to start development session', 'error');
                }
            });
    }
    
    createProject() {
        const projectName = prompt('Enter project name:');
        if (!projectName) return;
        
        const projectType = prompt('Enter project type (python/javascript/web/generic):') || 'generic';
        
        fetch('/api/development/project/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_name: projectName,
                project_type: projectType
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification(`Project "${projectName}" created successfully`, 'success');
            } else {
                this.showNotification(`Failed to create project: ${data.error}`, 'error');
            }
        });
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
    
    listSecrets() {
        fetch('/api/development/secrets')
            .then(response => response.json())
            .then(data => {
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
            });
    }
    
    addSecret() {
        const serviceName = prompt('Enter service name (e.g., GITHUB_TOKEN):');
        if (!serviceName) return;
        
        const secretValue = prompt('Enter secret value:');
        if (!secretValue) return;
        
        const description = prompt('Enter description (optional):') || '';
        const category = prompt('Enter category (git/deployment/ai/cloud):') || 'general';
        
        fetch('/api/development/secrets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_name: serviceName,
                secret_value: secretValue,
                description: description,
                category: category
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification(`Secret "${serviceName}" stored securely`, 'success');
            } else {
                this.showNotification(`Failed to store secret: ${data.error}`, 'error');
            }
        });
    }
    
    deleteSecret() {
        this.listSecrets();
        const serviceName = prompt('Enter service name to delete:');
        if (!serviceName) return;
        
        if (confirm(`Delete secret "${serviceName}"? This cannot be undone.`)) {
            fetch(`/api/development/secrets/${serviceName}`, { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.showNotification(`Secret "${serviceName}" deleted`, 'success');
                    } else {
                        this.showNotification(`Failed to delete secret: ${data.error}`, 'error');
                    }
                });
        }
    }
    
    viewDevStats() {
        const days = prompt('Enter number of days (default 30):') || '30';
        
        fetch(`/api/development/stats?days=${days}`)
            .then(response => response.json())
            .then(data => {
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
            });
    }
    
    gitOperations() {
        const message = prompt('Enter commit message:') || 'AVA CORE development update';
        const projectPath = prompt('Enter project path (default current):') || '.';
        
        fetch('/api/development/git/commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                project_path: projectPath
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification(`Changes committed: ${data.commit_hash}`, 'success');
            } else {
                this.showNotification(`Commit failed: ${data.error}`, 'error');
            }
        });
    }
    
    runTests() {
        const projectPath = prompt('Enter project path (default current):') || '.';
        
        this.showNotification('Running tests...', 'info');
        
        fetch('/api/development/test/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_path: projectPath })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification(`Tests completed successfully with ${data.command}`, 'success');
            } else {
                this.showNotification(`Tests failed: ${data.error}`, 'error');
            }
        });
    }
    
    deployProject() {
        const targets = ['heroku', 'vercel', 'github_pages'];
        const target = prompt(`Deploy to:\n${targets.map((t, i) => `${i+1}. ${t}`).join('\n')}\n\nEnter number:`);
        
        if (!target) return;
        
        const targetIndex = parseInt(target) - 1;
        if (targetIndex < 0 || targetIndex >= targets.length) return;
        
        const deploymentTarget = targets[targetIndex];
        const projectPath = prompt('Enter project path (default current):') || '.';
        
        this.showNotification(`Deploying to ${deploymentTarget}...`, 'info');
        
        fetch('/api/development/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_path: projectPath,
                target: deploymentTarget
            })
        })
        .then(response => response.json())
        .then(data => {
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
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AVAInterface;
}
