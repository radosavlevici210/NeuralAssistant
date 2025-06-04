"""
AVA CORE Security Manager
Copyright and Trademark: Ervin Radosavlevici

Enterprise-grade security and authentication system
"""

import os
import jwt
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import bcrypt

logger = logging.getLogger(__name__)

class SecurityManager:
    """Handles authentication, encryption, and security policies"""
    
    def __init__(self):
        self.jwt_secret = os.environ.get('JWT_SECRET', self._generate_jwt_secret())
        self.encryption_key = self._get_or_create_encryption_key()
        self.fernet = Fernet(self.encryption_key)
        self.session_timeout = 3600  # 1 hour
        self.active_sessions = {}
        self.security_policies = self._load_security_policies()
        logger.info("Security Manager initialized")
    
    def _generate_jwt_secret(self):
        """Generate secure JWT secret"""
        return secrets.token_urlsafe(64)
    
    def _get_or_create_encryption_key(self):
        """Get or create encryption key"""
        key_file = 'ava_encryption.key'
        try:
            if os.path.exists(key_file):
                with open(key_file, 'rb') as f:
                    return f.read()
            else:
                key = Fernet.generate_key()
                with open(key_file, 'wb') as f:
                    f.write(key)
                os.chmod(key_file, 0o600)  # Restrict permissions
                return key
        except Exception as e:
            logger.error(f"Encryption key error: {str(e)}")
            return Fernet.generate_key()  # Fallback to memory-only key
    
    def _load_security_policies(self):
        """Load security policies configuration"""
        return {
            'password_policy': {
                'min_length': 12,
                'require_uppercase': True,
                'require_lowercase': True,
                'require_numbers': True,
                'require_symbols': True,
                'max_age_days': 90
            },
            'access_control': {
                'max_failed_attempts': 5,
                'lockout_duration': 1800,  # 30 minutes
                'require_2fa': True,
                'session_timeout': 3600
            },
            'api_security': {
                'rate_limit_per_minute': 100,
                'require_api_key': True,
                'encrypt_api_responses': True,
                'audit_all_requests': True
            }
        }
    
    def authenticate_user(self, username, password, additional_factors=None):
        """Authenticate user with credentials and optional 2FA"""
        try:
            # Check if user is locked out
            if self._is_user_locked_out(username):
                return {
                    "success": False,
                    "message": "Account temporarily locked due to failed attempts",
                    "lockout_expires": self._get_lockout_expiry(username)
                }
            
            # Verify password
            if not self._verify_password(username, password):
                self._record_failed_attempt(username)
                return {"success": False, "message": "Invalid credentials"}
            
            # Check 2FA if required
            if self.security_policies['access_control']['require_2fa']:
                if not additional_factors or not self._verify_2fa(username, additional_factors):
                    return {"success": False, "message": "Two-factor authentication required"}
            
            # Generate session token
            session_token = self._create_session(username)
            self._clear_failed_attempts(username)
            
            return {
                "success": True,
                "message": "Authentication successful",
                "session_token": session_token,
                "expires": datetime.now() + timedelta(seconds=self.session_timeout)
            }
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return {"success": False, "message": "Authentication failed"}
    
    def _verify_password(self, username, password):
        """Verify user password against stored hash"""
        try:
            # This would typically check against a secure database
            # For demonstration, using environment variable
            stored_hash = os.environ.get(f'USER_HASH_{username.upper()}')
            if not stored_hash:
                return False
            
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        except Exception:
            return False
    
    def _verify_2fa(self, username, factors):
        """Verify two-factor authentication"""
        try:
            # Support multiple 2FA methods
            if 'totp_code' in factors:
                return self._verify_totp(username, factors['totp_code'])
            elif 'sms_code' in factors:
                return self._verify_sms_code(username, factors['sms_code'])
            elif 'backup_code' in factors:
                return self._verify_backup_code(username, factors['backup_code'])
            return False
        except Exception:
            return False
    
    def _verify_totp(self, username, totp_code):
        """Verify TOTP (Time-based One-Time Password)"""
        try:
            import pyotp
            secret = os.environ.get(f'TOTP_SECRET_{username.upper()}')
            if not secret:
                return False
            
            totp = pyotp.TOTP(secret)
            return totp.verify(totp_code, valid_window=1)
        except Exception:
            return False
    
    def _verify_sms_code(self, username, sms_code):
        """Verify SMS verification code"""
        # This would integrate with SMS service
        stored_code = os.environ.get(f'SMS_CODE_{username.upper()}')
        return stored_code == sms_code if stored_code else False
    
    def _verify_backup_code(self, username, backup_code):
        """Verify backup recovery code"""
        # This would check against stored backup codes
        backup_codes = os.environ.get(f'BACKUP_CODES_{username.upper()}', '').split(',')
        return backup_code in backup_codes
    
    def _create_session(self, username):
        """Create authenticated session"""
        try:
            session_id = secrets.token_urlsafe(32)
            expires_at = datetime.now() + timedelta(seconds=self.session_timeout)
            
            payload = {
                'session_id': session_id,
                'username': username,
                'created': datetime.now().isoformat(),
                'expires': expires_at.isoformat(),
                'permissions': self._get_user_permissions(username)
            }
            
            token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
            
            self.active_sessions[session_id] = {
                'username': username,
                'created': datetime.now(),
                'expires': expires_at,
                'last_activity': datetime.now()
            }
            
            return token
            
        except Exception as e:
            logger.error(f"Session creation error: {str(e)}")
            return None
    
    def validate_session(self, token):
        """Validate session token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            session_id = payload.get('session_id')
            
            if session_id not in self.active_sessions:
                return {"valid": False, "reason": "Session not found"}
            
            session = self.active_sessions[session_id]
            
            if datetime.now() > session['expires']:
                del self.active_sessions[session_id]
                return {"valid": False, "reason": "Session expired"}
            
            # Update last activity
            session['last_activity'] = datetime.now()
            
            return {
                "valid": True,
                "username": session['username'],
                "permissions": payload.get('permissions', []),
                "session_id": session_id
            }
            
        except jwt.ExpiredSignatureError:
            return {"valid": False, "reason": "Token expired"}
        except jwt.InvalidTokenError:
            return {"valid": False, "reason": "Invalid token"}
        except Exception as e:
            logger.error(f"Session validation error: {str(e)}")
            return {"valid": False, "reason": "Validation failed"}
    
    def encrypt_data(self, data):
        """Encrypt sensitive data"""
        try:
            if isinstance(data, str):
                data = data.encode('utf-8')
            elif isinstance(data, dict):
                import json
                data = json.dumps(data).encode('utf-8')
            
            encrypted = self.fernet.encrypt(data)
            return encrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            return None
    
    def decrypt_data(self, encrypted_data):
        """Decrypt sensitive data"""
        try:
            if isinstance(encrypted_data, str):
                encrypted_data = encrypted_data.encode('utf-8')
            
            decrypted = self.fernet.decrypt(encrypted_data)
            return decrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            return None
    
    def generate_api_key(self, username, permissions=None):
        """Generate API key for programmatic access"""
        try:
            api_key = f"ava_{secrets.token_urlsafe(32)}"
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            
            key_data = {
                'username': username,
                'permissions': permissions or [],
                'created': datetime.now().isoformat(),
                'hash': key_hash,
                'active': True
            }
            
            # Store API key data (encrypted)
            encrypted_data = self.encrypt_data(key_data)
            api_key_file = f"api_key_{key_hash[:16]}.enc"
            
            with open(api_key_file, 'w') as f:
                f.write(encrypted_data)
            
            return {
                "success": True,
                "api_key": api_key,
                "key_id": key_hash[:16],
                "permissions": permissions or []
            }
            
        except Exception as e:
            logger.error(f"API key generation error: {str(e)}")
            return {"success": False, "message": "API key generation failed"}
    
    def validate_api_key(self, api_key):
        """Validate API key"""
        try:
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            key_id = key_hash[:16]
            api_key_file = f"api_key_{key_id}.enc"
            
            if not os.path.exists(api_key_file):
                return {"valid": False, "reason": "API key not found"}
            
            with open(api_key_file, 'r') as f:
                encrypted_data = f.read()
            
            key_data = self.decrypt_data(encrypted_data)
            if not key_data:
                return {"valid": False, "reason": "Invalid key data"}
            
            import json
            key_info = json.loads(key_data)
            
            if not key_info.get('active', False):
                return {"valid": False, "reason": "API key deactivated"}
            
            return {
                "valid": True,
                "username": key_info['username'],
                "permissions": key_info.get('permissions', []),
                "key_id": key_id
            }
            
        except Exception as e:
            logger.error(f"API key validation error: {str(e)}")
            return {"valid": False, "reason": "Validation failed"}
    
    def _is_user_locked_out(self, username):
        """Check if user is locked out due to failed attempts"""
        lockout_file = f"lockout_{hashlib.md5(username.encode()).hexdigest()}.tmp"
        if not os.path.exists(lockout_file):
            return False
        
        try:
            with open(lockout_file, 'r') as f:
                lockout_data = f.read().strip()
            
            lockout_time = datetime.fromisoformat(lockout_data)
            lockout_duration = self.security_policies['access_control']['lockout_duration']
            
            if datetime.now() < lockout_time + timedelta(seconds=lockout_duration):
                return True
            else:
                os.remove(lockout_file)  # Lockout expired
                return False
        except Exception:
            return False
    
    def _record_failed_attempt(self, username):
        """Record failed authentication attempt"""
        attempts_file = f"attempts_{hashlib.md5(username.encode()).hexdigest()}.tmp"
        
        try:
            attempts = 0
            if os.path.exists(attempts_file):
                with open(attempts_file, 'r') as f:
                    attempts = int(f.read().strip())
            
            attempts += 1
            
            with open(attempts_file, 'w') as f:
                f.write(str(attempts))
            
            max_attempts = self.security_policies['access_control']['max_failed_attempts']
            if attempts >= max_attempts:
                self._lockout_user(username)
                
        except Exception as e:
            logger.error(f"Failed attempt recording error: {str(e)}")
    
    def _lockout_user(self, username):
        """Lock out user due to excessive failed attempts"""
        lockout_file = f"lockout_{hashlib.md5(username.encode()).hexdigest()}.tmp"
        
        try:
            with open(lockout_file, 'w') as f:
                f.write(datetime.now().isoformat())
            
            logger.warning(f"User {username} locked out due to failed attempts")
        except Exception as e:
            logger.error(f"Lockout error: {str(e)}")
    
    def _clear_failed_attempts(self, username):
        """Clear failed attempt records for user"""
        attempts_file = f"attempts_{hashlib.md5(username.encode()).hexdigest()}.tmp"
        try:
            if os.path.exists(attempts_file):
                os.remove(attempts_file)
        except Exception:
            pass
    
    def _get_user_permissions(self, username):
        """Get user permissions"""
        # This would typically query a user database
        default_permissions = ['chat', 'speak', 'device_control']
        admin_users = os.environ.get('ADMIN_USERS', '').split(',')
        
        if username in admin_users:
            return default_permissions + ['admin', 'user_management', 'system_config']
        
        return default_permissions
    
    def audit_log(self, action, username=None, details=None):
        """Log security-relevant actions"""
        try:
            audit_entry = {
                'timestamp': datetime.now().isoformat(),
                'action': action,
                'username': username,
                'details': details,
                'ip_address': os.environ.get('REQUEST_IP', 'unknown'),
                'user_agent': os.environ.get('REQUEST_USER_AGENT', 'unknown')
            }
            
            import json
            audit_file = f"audit_{datetime.now().strftime('%Y%m%d')}.log"
            
            with open(audit_file, 'a') as f:
                f.write(json.dumps(audit_entry) + '\n')
                
        except Exception as e:
            logger.error(f"Audit logging error: {str(e)}")
    
    def get_security_status(self):
        """Get current security status"""
        return {
            'active_sessions': len(self.active_sessions),
            'security_policies': self.security_policies,
            'encryption_enabled': True,
            'audit_logging': True,
            'session_timeout': self.session_timeout,
            'lockout_policy': {
                'max_attempts': self.security_policies['access_control']['max_failed_attempts'],
                'lockout_duration': self.security_policies['access_control']['lockout_duration']
            }
        }