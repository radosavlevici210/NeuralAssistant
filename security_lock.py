"""
AVA CORE™ Immutable Security Lock System
Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.
Watermark: radosavlevici210@icloud.com

IMMUTABLE PROTECTION: Only authorized users can access and control AVA CORE
"""

import os
import hashlib
import json
import time
import logging
from typing import List, Dict, Any, Optional
from functools import wraps
import threading

logger = logging.getLogger(__name__)

class ImmutableSecurityLock:
    """
    Immutable security system that prevents unauthorized access or modifications
    Only radosavlevici210@icloud.com and ervin210@icloud.com can use AVA CORE
    """
    
    # IMMUTABLE AUTHORIZED USERS - CANNOT BE CHANGED
    _IMMUTABLE_AUTHORIZED_USERS = frozenset([
        "radosavlevici210@icloud.com",
        "ervin210@icloud.com"
    ])
    
    # Security hash to prevent tampering
    _SECURITY_HASH = "AVA_CORE_IMMUTABLE_LOCK_2025_RADOSAVLEVICI"
    
    def __init__(self):
        self._lock = threading.RLock()
        self._authenticated_users = set()
        self._access_attempts = []
        self._system_locked = False
        self._tamper_detected = False
        
        # Initialize immutable protection
        self._initialize_immutable_protection()
        
    def _initialize_immutable_protection(self):
        """Initialize immutable protection mechanisms"""
        try:
            # Verify system integrity
            if not self._verify_system_integrity():
                self._trigger_security_lockdown()
                return
            
            # Log initialization
            logger.info("AVA CORE™ Immutable Security Lock initialized")
            logger.info(f"Protected for users: {list(self._IMMUTABLE_AUTHORIZED_USERS)}")
            
        except Exception as e:
            logger.critical(f"Security initialization failed: {str(e)}")
            self._trigger_security_lockdown()
    
    def _verify_system_integrity(self) -> bool:
        """Verify that the authorized users list hasn't been tampered with"""
        try:
            # Check if authorized users are still immutable
            expected_users = frozenset([
                "radosavlevici210@icloud.com",
                "ervin210@icloud.com"
            ])
            
            if self._IMMUTABLE_AUTHORIZED_USERS != expected_users:
                logger.critical("SECURITY BREACH: Authorized users list has been tampered with!")
                return False
            
            return True
            
        except Exception as e:
            logger.critical(f"Integrity verification failed: {str(e)}")
            return False
    
    def authenticate_user(self, user_email: str) -> bool:
        """
        Authenticate user against immutable authorized list
        Returns True only for the two authorized users
        """
        with self._lock:
            try:
                # Check if system is locked
                if self._system_locked or self._tamper_detected:
                    logger.warning(f"SYSTEM LOCKED: Access denied for {user_email}")
                    return False
                
                # Verify system integrity before authentication
                if not self._verify_system_integrity():
                    self._trigger_security_lockdown()
                    return False
                
                # Check if user is in immutable authorized list
                is_authorized = user_email in self._IMMUTABLE_AUTHORIZED_USERS
                
                # Log access attempt
                self._log_access_attempt(user_email, is_authorized)
                
                if is_authorized:
                    self._authenticated_users.add(user_email)
                    logger.info(f"AUTHORIZED ACCESS GRANTED: {user_email}")
                    return True
                else:
                    logger.warning(f"UNAUTHORIZED ACCESS DENIED: {user_email}")
                    return False
                    
            except Exception as e:
                logger.error(f"Authentication error: {str(e)}")
                return False
    
    def _log_access_attempt(self, user_email: str, authorized: bool):
        """Log all access attempts for security monitoring"""
        attempt = {
            'timestamp': time.time(),
            'user_email': user_email,
            'authorized': authorized,
            'ip_address': self._get_client_ip(),
            'user_agent': self._get_user_agent()
        }
        
        self._access_attempts.append(attempt)
        
        # Keep only last 1000 attempts
        if len(self._access_attempts) > 1000:
            self._access_attempts = self._access_attempts[-1000:]
    
    def _get_client_ip(self) -> str:
        """Get client IP address for logging"""
        try:
            # This would be set by the Flask application
            return getattr(self, '_current_ip', 'unknown')
        except:
            return 'unknown'
    
    def _get_user_agent(self) -> str:
        """Get user agent for logging"""
        try:
            # This would be set by the Flask application
            return getattr(self, '_current_user_agent', 'unknown')
        except:
            return 'unknown'
    
    def is_user_authorized(self, user_email: str) -> bool:
        """Check if user is authorized without authentication"""
        return user_email in self._IMMUTABLE_AUTHORIZED_USERS
    
    def get_authorized_users(self) -> List[str]:
        """Get immutable list of authorized users"""
        return list(self._IMMUTABLE_AUTHORIZED_USERS)
    
    def is_authenticated(self, user_email: str) -> bool:
        """Check if user is currently authenticated"""
        with self._lock:
            return user_email in self._authenticated_users
    
    def logout_user(self, user_email: str):
        """Logout user from authenticated sessions"""
        with self._lock:
            self._authenticated_users.discard(user_email)
            logger.info(f"User logged out: {user_email}")
    
    def _trigger_security_lockdown(self):
        """Trigger complete system lockdown on security breach"""
        self._system_locked = True
        self._tamper_detected = True
        self._authenticated_users.clear()
        
        logger.critical("🚨 SECURITY LOCKDOWN TRIGGERED 🚨")
        logger.critical("System has been locked due to security breach detection")
        logger.critical("Only system restart can restore functionality")
    
    def get_security_status(self) -> Dict[str, Any]:
        """Get comprehensive security status"""
        with self._lock:
            return {
                'system_locked': self._system_locked,
                'tamper_detected': self._tamper_detected,
                'authorized_users': list(self._IMMUTABLE_AUTHORIZED_USERS),
                'authenticated_users': list(self._authenticated_users),
                'total_access_attempts': len(self._access_attempts),
                'recent_attempts': self._access_attempts[-10:] if self._access_attempts else [],
                'integrity_verified': self._verify_system_integrity(),
                'security_hash': self._SECURITY_HASH
            }
    
    def get_access_log(self) -> List[Dict[str, Any]]:
        """Get detailed access log for security monitoring"""
        with self._lock:
            return self._access_attempts.copy()

# Global immutable security lock instance
security_lock = ImmutableSecurityLock()

def require_authorized_user(f):
    """
    Decorator to require authorized user access
    Only allows access to the two immutable authorized users
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # This decorator would be used with Flask request context
        # For now, we'll check if there's a current user set
        current_user = getattr(security_lock, '_current_authenticated_user', None)
        
        if not current_user:
            return {'error': 'Authentication required', 'authorized_users': security_lock.get_authorized_users()}, 401
        
        if not security_lock.is_authenticated(current_user):
            return {'error': 'User not authenticated', 'authorized_users': security_lock.get_authorized_users()}, 403
        
        if not security_lock.is_user_authorized(current_user):
            return {'error': 'Unauthorized user - access denied', 'authorized_users': security_lock.get_authorized_users()}, 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def set_current_user(user_email: Optional[str]):
    """Set current authenticated user for request context"""
    security_lock._current_authenticated_user = user_email

def set_request_info(ip_address: str, user_agent: str):
    """Set request information for security logging"""
    security_lock._current_ip = ip_address
    security_lock._current_user_agent = user_agent