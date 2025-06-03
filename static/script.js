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
        this.updateUI();
        
        // Load initial data
        this.loadStatus();
        this.loadConversation();
        
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
        this.showNotification('Data refreshed', 'info');
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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AVAInterface;
}
