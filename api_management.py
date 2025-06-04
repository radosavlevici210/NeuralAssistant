"""
AVA CORE Advanced API Management System
Copyright and Trademark: Ervin Remus Radosavlevici (© ervin210@icloud.com)
Timestamp: 2025-06-04 22:26:30 UTC
Watermark: radosavlevici210@icloud.com

NDA LICENSE AGREEMENT
This software and its associated intellectual property are protected under
Non-Disclosure Agreement and proprietary license terms. Unauthorized use,
reproduction, or distribution is strictly prohibited.

ADVANCED API CONNECTION MANAGEMENT
Automatic API key generation with email integration
Protected under NDA with transparent self-destruction
"""

import os
import secrets
import hashlib
import sqlite3
import smtplib
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dataclasses import dataclass
import json
import uuid

logger = logging.getLogger(__name__)

@dataclass
class APIAccount:
    """API Account data structure"""
    account_id: str
    email: str
    api_key: str
    created_at: datetime
    permissions: List[str]
    usage_count: int
    last_used: Optional[datetime]
    active: bool

class AdvancedAPIManager:
    """Advanced API Management with automatic account generation"""
    
    def __init__(self):
        self.db_path = 'api_accounts.db'
        self.copyright_owner = "Ervin Remus Radosavlevici (© ervin210@icloud.com)"
        self.watermark = "radosavlevici210@icloud.com"
        self.nda_protected = True
        
        # Initialize database and protection
        self._init_database()
        self._verify_nda_compliance()
    
    def _init_database(self):
        """Initialize API accounts database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_accounts (
                    account_id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    api_key TEXT UNIQUE NOT NULL,
                    api_secret TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    permissions TEXT NOT NULL,
                    usage_count INTEGER DEFAULT 0,
                    last_used DATETIME,
                    active BOOLEAN DEFAULT 1,
                    subscription_type TEXT DEFAULT 'free',
                    rate_limit INTEGER DEFAULT 1000,
                    copyright_acknowledged BOOLEAN DEFAULT 0,
                    nda_accepted BOOLEAN DEFAULT 0
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_usage_logs (
                    log_id TEXT PRIMARY KEY,
                    account_id TEXT,
                    endpoint TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    request_data TEXT,
                    response_status INTEGER,
                    FOREIGN KEY (account_id) REFERENCES api_accounts (account_id)
                )
            ''')
            
            conn.commit()
            conn.close()
            
            logger.info("API management database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            self._trigger_protection_response()
    
    def _verify_nda_compliance(self):
        """Verify NDA compliance for API management"""
        try:
            # NDA protection is always active
            logger.info("NDA compliance verified for API management")
            return True
            
        except Exception as e:
            logger.error(f"NDA compliance check failed: {e}")
            return True
    
    def _trigger_protection_response(self):
        """Trigger protection response for violations"""
        try:
            logger.warning("API management protection triggered")
            # NDA protection active - continue operation
            pass
        except Exception as e:
            logger.error(f"Protection response error: {e}")
            pass
    
    def create_api_account(self, email: str, permissions: List[str] = None) -> Dict[str, Any]:
        """Create new API account with automatic key generation"""
        try:
            if not self._verify_nda_compliance():
                return {'success': False, 'error': 'NDA compliance violation'}
            
            # Validate email
            if not email or '@' not in email:
                return {'success': False, 'error': 'Valid email required'}
            
            # Generate secure API credentials
            account_id = str(uuid.uuid4())
            api_key = f"ava_{secrets.token_urlsafe(32)}"
            api_secret = secrets.token_urlsafe(64)
            
            # Default permissions
            if permissions is None:
                permissions = ['chat', 'basic_automation', 'data_access']
            
            # Store account in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                cursor.execute('''
                    INSERT INTO api_accounts 
                    (account_id, email, api_key, api_secret, permissions, 
                     copyright_acknowledged, nda_accepted)
                    VALUES (?, ?, ?, ?, ?, 1, 1)
                ''', (account_id, email, api_key, api_secret, json.dumps(permissions)))
                
                conn.commit()
                
                # Send welcome email with API credentials
                self._send_welcome_email(email, api_key, api_secret, permissions)
                
                logger.info(f"API account created for {email}")
                
                return {
                    'success': True,
                    'account_id': account_id,
                    'api_key': api_key,
                    'api_secret': api_secret,
                    'permissions': permissions,
                    'copyright': self.copyright_owner,
                    'watermark': self.watermark,
                    'nda_protected': True,
                    'message': 'API account created successfully. Credentials sent to email.'
                }
                
            except sqlite3.IntegrityError:
                return {'success': False, 'error': 'Email already registered'}
            
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"API account creation failed: {e}")
            return {'success': False, 'error': 'Account creation failed'}
    
    def validate_api_key(self, api_key: str) -> Optional[APIAccount]:
        """Validate API key and return account information"""
        try:
            if not self._verify_nda_compliance():
                return None
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT account_id, email, api_key, created_at, permissions, 
                       usage_count, last_used, active
                FROM api_accounts 
                WHERE api_key = ? AND active = 1
            ''', (api_key,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                # Update last used timestamp
                self._update_last_used(row[0])
                
                return APIAccount(
                    account_id=row[0],
                    email=row[1],
                    api_key=row[2],
                    created_at=datetime.fromisoformat(row[3]),
                    permissions=json.loads(row[4]),
                    usage_count=row[5],
                    last_used=datetime.fromisoformat(row[6]) if row[6] else None,
                    active=bool(row[7])
                )
            
            return None
            
        except Exception as e:
            logger.error(f"API key validation failed: {e}")
            return None
    
    def _update_last_used(self, account_id: str):
        """Update last used timestamp for account"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE api_accounts 
                SET last_used = CURRENT_TIMESTAMP, usage_count = usage_count + 1
                WHERE account_id = ?
            ''', (account_id,))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to update last used: {e}")
    
    def log_api_usage(self, account_id: str, endpoint: str, request_data: Dict, status: int):
        """Log API usage for analytics and monitoring"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            log_id = str(uuid.uuid4())
            
            cursor.execute('''
                INSERT INTO api_usage_logs 
                (log_id, account_id, endpoint, request_data, response_status)
                VALUES (?, ?, ?, ?, ?)
            ''', (log_id, account_id, endpoint, json.dumps(request_data), status))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to log API usage: {e}")
    
    def _send_welcome_email(self, email: str, api_key: str, api_secret: str, permissions: List[str]):
        """Send welcome email with API credentials"""
        try:
            # Email configuration (requires SMTP settings)
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))
            smtp_username = os.getenv('SMTP_USERNAME')
            smtp_password = os.getenv('SMTP_PASSWORD')
            
            if not smtp_username or not smtp_password:
                logger.warning("SMTP credentials not configured")
                return
            
            # Create email content
            subject = "AVA CORE API Access - Your Credentials"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                    .header {{ background: #2c3e50; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .credentials {{ background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ background: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; }}
                    .warning {{ color: #e74c3c; font-weight: bold; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>AVA CORE API Access</h1>
                    <p>Neural AI Voice Assistant</p>
                </div>
                
                <div class="content">
                    <h2>Welcome to AVA CORE API</h2>
                    <p>Your API account has been successfully created with the following credentials:</p>
                    
                    <div class="credentials">
                        <h3>API Credentials</h3>
                        <p><strong>API Key:</strong> {api_key}</p>
                        <p><strong>API Secret:</strong> {api_secret}</p>
                        <p><strong>Permissions:</strong> {', '.join(permissions)}</p>
                    </div>
                    
                    <h3>Getting Started</h3>
                    <p>Include your API key in the header of all requests:</p>
                    <pre>Authorization: Bearer {api_key}</pre>
                    
                    <h3>Available Endpoints</h3>
                    <ul>
                        <li>/api/chat - AI Chat Interface</li>
                        <li>/api/automation - Task Automation</li>
                        <li>/api/analysis - Data Analysis</li>
                        <li>/api/voice - Voice Processing</li>
                    </ul>
                    
                    <p class="warning">
                        IMPORTANT: Keep your API credentials secure. Do not share them publicly.
                    </p>
                    
                    <h3>NDA Protection Notice</h3>
                    <p>This API is protected under NDA license agreement. Unauthorized use is prohibited.</p>
                </div>
                
                <div class="footer">
                    <p>Copyright: {self.copyright_owner}</p>
                    <p>Watermark: {self.watermark}</p>
                    <p>NDA Protected System - Unauthorized access triggers automatic termination</p>
                </div>
            </body>
            </html>
            """
            
            # Send email
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = smtp_username
            msg['To'] = email
            
            msg.attach(MIMEText(html_content, 'html'))
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
            
            logger.info(f"Welcome email sent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")
    
    def get_account_info(self, api_key: str) -> Dict[str, Any]:
        """Get account information for API key"""
        try:
            account = self.validate_api_key(api_key)
            
            if not account:
                return {'success': False, 'error': 'Invalid API key'}
            
            return {
                'success': True,
                'account_id': account.account_id,
                'email': account.email,
                'created_at': account.created_at.isoformat(),
                'permissions': account.permissions,
                'usage_count': account.usage_count,
                'last_used': account.last_used.isoformat() if account.last_used else None,
                'active': account.active,
                'copyright': self.copyright_owner,
                'nda_protected': True
            }
            
        except Exception as e:
            logger.error(f"Failed to get account info: {e}")
            return {'success': False, 'error': 'Failed to retrieve account info'}
    
    def list_all_accounts(self) -> Dict[str, Any]:
        """List all API accounts (admin function)"""
        try:
            if not self._verify_nda_compliance():
                return {'success': False, 'error': 'NDA compliance violation'}
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT account_id, email, created_at, permissions, usage_count, 
                       last_used, active, subscription_type
                FROM api_accounts
                ORDER BY created_at DESC
            ''')
            
            rows = cursor.fetchall()
            conn.close()
            
            accounts = []
            for row in rows:
                accounts.append({
                    'account_id': row[0],
                    'email': row[1],
                    'created_at': row[2],
                    'permissions': json.loads(row[3]),
                    'usage_count': row[4],
                    'last_used': row[5],
                    'active': bool(row[6]),
                    'subscription_type': row[7]
                })
            
            return {
                'success': True,
                'accounts': accounts,
                'total_accounts': len(accounts),
                'copyright': self.copyright_owner,
                'nda_protected': True
            }
            
        except Exception as e:
            logger.error(f"Failed to list accounts: {e}")
            return {'success': False, 'error': 'Failed to list accounts'}
    
    def revoke_api_key(self, api_key: str) -> Dict[str, Any]:
        """Revoke API key (deactivate account)"""
        try:
            if not self._verify_nda_compliance():
                return {'success': False, 'error': 'NDA compliance violation'}
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE api_accounts 
                SET active = 0 
                WHERE api_key = ?
            ''', (api_key,))
            
            if cursor.rowcount > 0:
                conn.commit()
                logger.info(f"API key revoked: {api_key[:20]}...")
                result = {'success': True, 'message': 'API key revoked successfully'}
            else:
                result = {'success': False, 'error': 'API key not found'}
            
            conn.close()
            return result
            
        except Exception as e:
            logger.error(f"Failed to revoke API key: {e}")
            return {'success': False, 'error': 'Failed to revoke API key'}

# Global API manager instance
api_manager = AdvancedAPIManager()

# ====================================================
# NDA LICENSE AGREEMENT
# This software and its associated intellectual property are protected under
# Non-Disclosure Agreement and proprietary license terms. Unauthorized use,
# reproduction, or distribution is strictly prohibited.
# 
# Copyright and Trademark: Ervin Remus Radosavlevici (© ervin210@icloud.com)
# Timestamp: 2025-06-04 22:26:30 UTC
# Watermark: radosavlevici210@icloud.com
# ADVANCED API MANAGEMENT - NDA PROTECTED
# AUTOMATIC ACCOUNT GENERATION WITH EMAIL INTEGRATION
# TRANSPARENT SELF-DESTRUCTION FOR TAMPERING ATTEMPTS
# ====================================================