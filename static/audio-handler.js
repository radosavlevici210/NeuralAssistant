/**
 * AVA CORE™ Web Audio Handler
 * Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.
 * Watermark: radosavlevici210@icloud.com
 * 
 * Real-time microphone and speaker support for web deployment
 */

class AVAAudioHandler {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioContext = null;
        this.isRecording = false;
        this.isListening = false;
        this.audioChunks = [];
        this.voiceActivationThreshold = 0.01;
        this.silenceTimeout = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentVoice = null;
        
        this.initializeAudio();
    }
    
    async initializeAudio() {
        try {
            // Request microphone permission
            this.audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });
            
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecordedAudio();
            };
            
            // Initialize speech synthesis
            this.initializeSpeechSynthesis();
            
            console.log('[AVA CORE™] Audio system initialized successfully');
            return true;
            
        } catch (error) {
            console.error('[AVA CORE™] Audio initialization failed:', error);
            return false;
        }
    }
    
    initializeSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            // Wait for voices to load
            const loadVoices = () => {
                const voices = this.speechSynthesis.getVoices();
                
                // Prefer female voices for AVA
                this.currentVoice = voices.find(voice => 
                    voice.name.toLowerCase().includes('female') ||
                    voice.name.toLowerCase().includes('samantha') ||
                    voice.name.toLowerCase().includes('karen') ||
                    voice.name.toLowerCase().includes('susan')
                ) || voices.find(voice => voice.default) || voices[0];
                
                console.log('[AVA CORE™] Speech synthesis ready with voice:', this.currentVoice?.name);
            };
            
            if (this.speechSynthesis.getVoices().length > 0) {
                loadVoices();
            } else {
                this.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }
    
    async startListening() {
        if (!this.audioStream || !this.mediaRecorder) {
            console.error('[AVA CORE™] Audio not initialized');
            return false;
        }
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.isListening = true;
            this.audioChunks = [];
            
            // Start voice activity detection
            this.startVoiceActivityDetection();
            
            console.log('[AVA CORE™] Started listening for voice input');
            return true;
            
        } catch (error) {
            console.error('[AVA CORE™] Failed to start listening:', error);
            return false;
        }
    }
    
    stopListening() {
        this.isListening = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
        }
        
        console.log('[AVA CORE™] Stopped listening');
    }
    
    startVoiceActivityDetection() {
        if (!this.audioContext || !this.audioStream) return;
        
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const checkAudioLevel = () => {
            if (!this.isListening) return;
            
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate volume level
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength / 255;
            
            // Voice activity detected
            if (average > this.voiceActivationThreshold) {
                if (!this.isRecording) {
                    this.startRecording();
                }
                
                // Reset silence timeout
                if (this.silenceTimeout) {
                    clearTimeout(this.silenceTimeout);
                }
                
                // Set silence timeout
                this.silenceTimeout = setTimeout(() => {
                    if (this.isRecording) {
                        this.stopRecording();
                    }
                }, 2000); // Stop after 2 seconds of silence
            }
            
            // Continue monitoring
            requestAnimationFrame(checkAudioLevel);
        };
        
        checkAudioLevel();
    }
    
    startRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.audioChunks = [];
            this.mediaRecorder.start();
            this.isRecording = true;
            console.log('[AVA CORE™] Started recording');
            
            // Update UI
            this.updateRecordingStatus(true);
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            console.log('[AVA CORE™] Stopped recording');
            
            // Update UI
            this.updateRecordingStatus(false);
        }
    }
    
    async processRecordedAudio() {
        if (this.audioChunks.length === 0) return;
        
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
            
            // Convert to base64 for transmission
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Audio = reader.result.split(',')[1];
                this.sendAudioToServer(base64Audio);
            };
            reader.readAsDataURL(audioBlob);
            
        } catch (error) {
            console.error('[AVA CORE™] Audio processing failed:', error);
        }
    }
    
    async sendAudioToServer(audioData) {
        try {
            const response = await fetch('/api/process-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    audio: audioData,
                    format: 'webm'
                })
            });
            
            const result = await response.json();
            
            if (result.text) {
                console.log('[AVA CORE™] Speech recognized:', result.text);
                // Send recognized text for AI processing
                this.processUserInput(result.text);
            }
            
        } catch (error) {
            console.error('[AVA CORE™] Failed to process audio:', error);
        }
    }
    
    async processUserInput(text) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text
                })
            });
            
            const result = await response.json();
            
            if (result.response) {
                // Display response and speak it
                this.displayResponse(result.response);
                this.speak(result.response);
            }
            
        } catch (error) {
            console.error('[AVA CORE™] Failed to process user input:', error);
        }
    }
    
    speak(text) {
        if (!this.speechSynthesis || !text) return;
        
        // Cancel any ongoing speech
        this.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.currentVoice) {
            utterance.voice = this.currentVoice;
        }
        
        // Configure speech parameters
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;
        
        utterance.onstart = () => {
            console.log('[AVA CORE™] Started speaking');
            this.updateSpeakingStatus(true);
        };
        
        utterance.onend = () => {
            console.log('[AVA CORE™] Finished speaking');
            this.updateSpeakingStatus(false);
        };
        
        utterance.onerror = (error) => {
            console.error('[AVA CORE™] Speech synthesis error:', error);
            this.updateSpeakingStatus(false);
        };
        
        this.speechSynthesis.speak(utterance);
    }
    
    stopSpeaking() {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            this.updateSpeakingStatus(false);
        }
    }
    
    updateRecordingStatus(isRecording) {
        const indicator = document.getElementById('recording-indicator');
        if (indicator) {
            indicator.style.display = isRecording ? 'block' : 'none';
        }
        
        // Update status display
        if (window.updateStatus) {
            window.updateStatus(isRecording ? 'Recording...' : 'Listening...');
        }
    }
    
    updateSpeakingStatus(isSpeaking) {
        const indicator = document.getElementById('speaking-indicator');
        if (indicator) {
            indicator.style.display = isSpeaking ? 'block' : 'none';
        }
        
        // Update status display
        if (window.updateStatus) {
            window.updateStatus(isSpeaking ? 'Speaking...' : 'Ready');
        }
    }
    
    displayResponse(text) {
        // Add to conversation display
        if (window.addMessage) {
            window.addMessage('AVA', text);
        }
    }
    
    // Public API methods
    async enableVoiceMode() {
        const success = await this.startListening();
        return success;
    }
    
    disableVoiceMode() {
        this.stopListening();
    }
    
    getAudioCapabilities() {
        return {
            microphone: !!this.audioStream,
            speaker: !!this.speechSynthesis,
            webAudio: !!this.audioContext,
            mediaRecorder: !!this.mediaRecorder,
            voiceActivation: true,
            realTimeProcessing: true
        };
    }
}

// Initialize global audio handler
let avaAudioHandler = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    avaAudioHandler = new AVAAudioHandler();
    
    // Make available globally
    window.avaAudio = avaAudioHandler;
    
    console.log('[AVA CORE™] Web audio handler ready');
});