// AVA CORE Production Interface
// Copyright and Trademark: Ervin Remus Radosavlevici (© ervin210@icloud.com)
// Timestamp: 2025-06-04 21:40:00 UTC
// Watermark: radosavlevici210@icloud.com
// Modern, Clean, No Development Restrictions

class AVAProductionInterface {
    constructor() {
        this.expandedFeatures = new Set();
        this.systemStatus = {
            ai: true,
            network: true,
            api: true,
            dev: true
        };
        this.init();
    }

    init() {
        this.updateSystemStatus();
        this.setupEventListeners();
        this.initializeAnimations();
        setInterval(() => this.updateSystemStatus(), 5000);
    }

    setupEventListeners() {
        // Chat input handling
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Responsive design handling
        window.addEventListener('resize', () => {
            this.handleResponsiveLayout();
        });
    }

    initializeAnimations() {
        // Add smooth entrance animations
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    toggleMainInterface() {
        const featureGrid = document.getElementById('featureGrid');
        if (featureGrid.style.display === 'none') {
            featureGrid.style.display = 'grid';
            this.animateGridIn();
        } else {
            this.animateGridOut();
            setTimeout(() => {
                featureGrid.style.display = 'none';
            }, 300);
        }
    }

    animateGridIn() {
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8) translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'scale(1) translateY(0)';
            }, index * 50);
        });
    }

    animateGridOut() {
        const cards = document.querySelectorAll('.feature-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8) translateY(-20px)';
            }, index * 30);
        });
    }

    toggleFeature(featureId) {
        const content = document.getElementById(`${featureId}-content`);
        const card = document.querySelector(`[data-feature="${featureId}"]`);
        
        if (!content || !card) {
            console.warn(`Feature elements not found for: ${featureId}`);
            return;
        }
        
        const expandBtn = card.querySelector('.expand-btn i');
        
        if (this.expandedFeatures.has(featureId)) {
            // Collapse
            content.classList.remove('open');
            card.classList.remove('expanded');
            if (expandBtn) {
                expandBtn.style.transform = 'rotate(0deg)';
            }
            this.expandedFeatures.delete(featureId);
        } else {
            // Expand
            content.classList.add('open');
            card.classList.add('expanded');
            if (expandBtn) {
                expandBtn.style.transform = 'rotate(180deg)';
            }
            this.expandedFeatures.add(featureId);
            
            // Scroll to card
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    async browseWebsite() {
        const url = document.getElementById('browser-url').value;
        const extractType = document.getElementById('browser-extract').value;
        
        if (!url) {
            this.showNotification('Please enter a URL', 'warning');
            return;
        }

        this.showLoading('Browsing website...');
        
        try {
            const response = await fetch('/api/advanced/browse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    extract_info: extractType
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('Website Browse Results', result);
            } else {
                this.showNotification(result.error || 'Browse failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    async callAPI() {
        const url = document.getElementById('api-url').value;
        const method = document.getElementById('api-method').value;
        const headersText = document.getElementById('api-headers').value;
        const dataText = document.getElementById('api-data').value;
        
        if (!url) {
            this.showNotification('Please enter an API URL', 'warning');
            return;
        }

        let headers = {};
        let data = {};
        
        try {
            if (headersText) headers = JSON.parse(headersText);
            if (dataText) data = JSON.parse(dataText);
        } catch (e) {
            this.showNotification('Invalid JSON format', 'error');
            return;
        }

        this.showLoading('Calling API...');
        
        try {
            const response = await fetch('/api/advanced/api/call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    method: method,
                    headers: headers,
                    data: data
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('API Call Results', result);
            } else {
                this.showNotification(result.error || 'API call failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    async executeCode() {
        const language = document.getElementById('code-language').value;
        const code = document.getElementById('code-input').value;
        
        if (!code.trim()) {
            this.showNotification('Please enter code to execute', 'warning');
            return;
        }

        this.showLoading('Executing code...');
        
        try {
            const response = await fetch('/api/advanced/code/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language,
                    code: code
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('Code Execution Results', result);
            } else {
                this.showNotification(result.error || 'Code execution failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    async callAIService() {
        const service = document.getElementById('ai-service').value;
        const apiKey = document.getElementById('ai-key').value;
        const prompt = document.getElementById('ai-prompt').value;
        
        if (!prompt.trim()) {
            this.showNotification('Please enter a prompt', 'warning');
            return;
        }

        if (!apiKey && service !== 'openai') {
            this.showNotification('Please enter an API key', 'warning');
            return;
        }

        this.showLoading('Generating AI response...');
        
        try {
            // Configure service first
            await fetch('/api/enhanced/ai-integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'configure_service',
                    service: service,
                    api_key: apiKey || 'default'
                })
            });

            // Call service
            const response = await fetch('/api/enhanced/ai-integration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'call_service',
                    service: service,
                    prompt: prompt
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('AI Response', result);
            } else {
                this.showNotification(result.error || 'AI service call failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    async createProject() {
        const projectName = document.getElementById('dev-project').value;
        const technology = document.getElementById('dev-tech').value;
        const githubToken = document.getElementById('dev-github').value;
        
        if (!projectName.trim()) {
            this.showNotification('Please enter a project name', 'warning');
            return;
        }

        this.showLoading('Creating project...');
        
        try {
            const response = await fetch('/api/development/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: projectName,
                    technology: technology,
                    github_token: githubToken
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('Project Creation Results', result);
            } else {
                this.showNotification(result.error || 'Project creation failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    async createTask() {
        const title = document.getElementById('task-title').value;
        const priority = parseInt(document.getElementById('task-priority').value);
        const dueDate = document.getElementById('task-due').value;
        
        if (!title.trim()) {
            this.showNotification('Please enter a task title', 'warning');
            return;
        }

        this.showLoading('Creating task...');
        
        try {
            const response = await fetch('/api/enhanced/productivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_task',
                    title: title,
                    priority: priority,
                    due_date: dueDate
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('Task Created', result);
                // Clear form
                document.getElementById('task-title').value = '';
                document.getElementById('task-due').value = '';
            } else {
                this.showNotification(result.error || 'Task creation failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    async testConnection() {
        const connectionType = document.getElementById('connection-type').value;
        const connectionData = this.getConnectionData(connectionType);
        
        this.showLoading('Testing connection...');
        
        try {
            const response = await fetch('/api/production/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_type: connectionType,
                    connection_data: connectionData
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.showNotification('Connection successful', 'success');
                this.displayResults('Connection Test Results', result);
            } else {
                this.showNotification(result.error || 'Connection failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    getConnectionData(connectionType) {
        const fields = document.getElementById('connection-fields');
        const data = {};
        
        fields.querySelectorAll('.control-input').forEach(input => {
            data[input.id.replace('conn-', '')] = input.value;
        });
        
        return data;
    }

    updateConnectionFields() {
        const connectionType = document.getElementById('connection-type').value;
        const fieldsContainer = document.getElementById('connection-fields');
        
        let fieldsHTML = '';
        
        switch (connectionType) {
            case 'database':
                fieldsHTML = `
                    <div class="control-group">
                        <div class="control-label">Database Type</div>
                        <select class="control-input" id="conn-type">
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="mongodb">MongoDB</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <div class="control-label">Host</div>
                        <input type="text" class="control-input" id="conn-host" placeholder="localhost">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Port</div>
                        <input type="number" class="control-input" id="conn-port" placeholder="5432">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Database Name</div>
                        <input type="text" class="control-input" id="conn-database" placeholder="myapp">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Username</div>
                        <input type="text" class="control-input" id="conn-username" placeholder="admin">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Password</div>
                        <input type="password" class="control-input" id="conn-password">
                    </div>
                `;
                break;
            case 'cloud_service':
                fieldsHTML = `
                    <div class="control-group">
                        <div class="control-label">Provider</div>
                        <select class="control-input" id="conn-provider">
                            <option value="aws">Amazon AWS</option>
                            <option value="gcp">Google Cloud</option>
                            <option value="azure">Microsoft Azure</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <div class="control-label">Access Key</div>
                        <input type="password" class="control-input" id="conn-access_key">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Secret Key</div>
                        <input type="password" class="control-input" id="conn-secret_key">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Region</div>
                        <input type="text" class="control-input" id="conn-region" placeholder="us-east-1">
                    </div>
                `;
                break;
            case 'api_service':
                fieldsHTML = `
                    <div class="control-group">
                        <div class="control-label">API URL</div>
                        <input type="url" class="control-input" id="conn-url" placeholder="https://api.example.com">
                    </div>
                    <div class="control-group">
                        <div class="control-label">API Key</div>
                        <input type="password" class="control-input" id="conn-api_key">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Headers (JSON)</div>
                        <textarea class="control-input" id="conn-headers" placeholder='{"Content-Type": "application/json"}'></textarea>
                    </div>
                `;
                break;
            case 'webhook':
                fieldsHTML = `
                    <div class="control-group">
                        <div class="control-label">Webhook URL</div>
                        <input type="url" class="control-input" id="conn-url" placeholder="https://yourapp.com/webhook">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Secret Token</div>
                        <input type="password" class="control-input" id="conn-secret">
                    </div>
                    <div class="control-group">
                        <div class="control-label">Events</div>
                        <input type="text" class="control-input" id="conn-events" placeholder="push,pull_request">
                    </div>
                `;
                break;
        }
        
        fieldsContainer.innerHTML = fieldsHTML;
    }

    async refreshMetrics() {
        this.showLoading('Refreshing metrics...');
        
        try {
            const response = await fetch('/api/production/monitor');
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                const data = result.data;
                document.getElementById('system-health').textContent = `${100 - data.system_health.cpu_percent}%`;
                document.getElementById('active-connections').textContent = data.active_connections.total_connections;
                document.getElementById('response-time').textContent = `${data.performance_metrics.response_time_avg * 1000}ms`;
                document.getElementById('uptime').textContent = `${data.uptime.uptime_hours.toFixed(1)}h`;
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to refresh metrics', 'error');
        }
    }

    async processData() {
        const inputData = document.getElementById('data-input').value;
        const operation = document.getElementById('data-operation').value;
        const query = document.getElementById('data-query').value;
        
        if (!inputData.trim()) {
            this.showNotification('Please enter data to process', 'warning');
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(inputData);
        } catch (e) {
            this.showNotification('Invalid JSON format', 'error');
            return;
        }

        this.showLoading('Processing data...');
        
        try {
            const response = await fetch('/api/advanced/data/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: parsedData,
                    operation: operation,
                    query: query
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('Data Processing Results', result);
            } else {
                this.showNotification(result.error || 'Data processing failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    async createWorkflow() {
        const name = document.getElementById('workflow-name').value;
        const trigger = document.getElementById('workflow-trigger').value;
        const actionsText = document.getElementById('workflow-actions').value;
        
        if (!name.trim()) {
            this.showNotification('Please enter a workflow name', 'warning');
            return;
        }

        let actions;
        try {
            actions = JSON.parse(actionsText || '[]');
        } catch (e) {
            this.showNotification('Invalid JSON format for actions', 'error');
            return;
        }

        this.showLoading('Creating workflow...');
        
        try {
            const response = await fetch('/api/enhanced/productivity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'schedule_automation',
                    name: name,
                    cron_expression: '0 9 * * *',
                    action_type: trigger,
                    action_data: { actions: actions }
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                this.displayResults('Workflow Created', result);
                document.getElementById('workflow-name').value = '';
                document.getElementById('workflow-actions').value = '';
            } else {
                this.showNotification(result.error || 'Workflow creation failed', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Network error: ' + error.message, 'error');
        }
    }

    toggleChat() {
        const chatInterface = document.getElementById('chatInterface');
        if (chatInterface.style.display === 'none' || !chatInterface.style.display) {
            chatInterface.style.display = 'flex';
            this.animateIn(chatInterface);
        } else {
            this.animateOut(chatInterface);
            setTimeout(() => {
                chatInterface.style.display = 'none';
            }, 300);
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addChatMessage('user', message);
        input.value = '';
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.addChatMessage('assistant', result.response);
            } else {
                this.addChatMessage('assistant', 'Sorry, I encountered an error processing your request.');
            }
        } catch (error) {
            this.addChatMessage('assistant', 'Network error. Please try again.');
        }
    }

    addChatMessage(sender, message) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 10px;
            ${sender === 'user' ? 
                'background: linear-gradient(135deg, #667eea, #764ba2); margin-left: 20px;' : 
                'background: rgba(255,255,255,0.1); margin-right: 20px;'
            }
        `;
        messageDiv.innerHTML = `<strong>${sender === 'user' ? 'You' : 'AVA'}:</strong> ${message}`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    startVoiceAssistant() {
        fetch('/api/start', { method: 'POST' })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    this.showNotification('Voice assistant started', 'success');
                } else {
                    this.showNotification('Voice assistant not available', 'warning');
                }
            });
    }

    showNetworkDevices() {
        fetch('/api/network/status')
            .then(response => response.json())
            .then(result => {
                this.displayResults('Network Devices', result);
            });
    }

    updateSystemStatus() {
        // Update status indicators
        this.updateStatusIndicator('ai-status', this.systemStatus.ai);
        this.updateStatusIndicator('network-status', this.systemStatus.network);
        this.updateStatusIndicator('api-status', this.systemStatus.api);
        this.updateStatusIndicator('dev-status', this.systemStatus.dev);
    }

    updateStatusIndicator(id, status) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.className = `status-indicator ${status ? '' : 'error'}`;
        }
    }

    showLoading(message) {
        this.showNotification(message, 'info', 0);
    }

    hideLoading() {
        this.hideNotifications();
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            backdrop-filter: blur(20px);
            animation: slideDown 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideUp 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
        
        this.currentNotification = notification;
    }

    hideNotifications() {
        if (this.currentNotification && this.currentNotification.parentNode) {
            this.currentNotification.remove();
        }
    }

    displayResults(title, data) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: rgba(0,0,0,0.9);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            padding: 30px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            color: white;
        `;
        
        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: #667eea;">${title}</h2>
                <button onclick="this.closest('.modal').remove()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            </div>
            <pre style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; overflow-x: auto; white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>
        `;
        
        modal.className = 'modal';
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    animateIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '1';
            element.style.transform = 'scale(1) translateY(0)';
        }, 10);
    }

    animateOut(element) {
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'scale(0.8) translateY(-20px)';
    }

    handleResponsiveLayout() {
        const width = window.innerWidth;
        const featureGrid = document.getElementById('featureGrid');
        
        if (width < 768) {
            featureGrid.style.gridTemplateColumns = '1fr';
        } else if (width < 1200) {
            featureGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            featureGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        }
    }
}

// Global functions for HTML onclick handlers
function toggleMainInterface() {
    window.avaInterface.toggleMainInterface();
}

function toggleFeature(featureId) {
    window.avaInterface.toggleFeature(featureId);
}

function browseWebsite() {
    window.avaInterface.browseWebsite();
}

function callAPI() {
    window.avaInterface.callAPI();
}

function executeCode() {
    window.avaInterface.executeCode();
}

function callAIService() {
    window.avaInterface.callAIService();
}

function createProject() {
    window.avaInterface.createProject();
}

function createTask() {
    window.avaInterface.createTask();
}

function toggleChat() {
    window.avaInterface.toggleChat();
}

function sendMessage() {
    window.avaInterface.sendMessage();
}

function startVoiceAssistant() {
    window.avaInterface.startVoiceAssistant();
}

function showNetworkDevices() {
    window.avaInterface.showNetworkDevices();
}

function testIntegration() {
    window.avaInterface.testIntegration();
}

function saveIntegration() {
    window.avaInterface.saveIntegration();
}

function createWorkflow() {
    window.avaInterface.createWorkflow();
}

function testWorkflow() {
    window.avaInterface.testWorkflow();
}

function analyzeData() {
    window.avaInterface.analyzeData();
}

function generateReport() {
    window.avaInterface.generateReport();
}

function startSecurityScan() {
    window.avaInterface.startSecurityScan();
}

function enableMonitoring() {
    window.avaInterface.enableMonitoring();
}

function trainModel() {
    window.avaInterface.trainModel();
}

function makePrediction() {
    window.avaInterface.makePrediction();
}

function testConnection() {
    window.avaInterface.testConnection();
}

function updateConnectionFields() {
    window.avaInterface.updateConnectionFields();
}

function refreshMetrics() {
    window.avaInterface.refreshMetrics();
}

function processData() {
    window.avaInterface.processData();
}

function testConnection() {
    window.avaInterface.testConnection();
}

function updateConnectionFields() {
    window.avaInterface.updateConnectionFields();
}

function refreshMetrics() {
    window.avaInterface.refreshMetrics();
}

function processData() {
    window.avaInterface.processData();
}

// Initialize interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.avaInterface = new AVAProductionInterface();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);