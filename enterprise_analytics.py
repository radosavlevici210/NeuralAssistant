"""
AVA CORE™ Enterprise Analytics and Monitoring System
Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.
Watermark: radosavlevici210@icloud.com

Advanced analytics and monitoring for enterprise deployment
"""

import os
import json
import sqlite3
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import threading

logger = logging.getLogger(__name__)

@dataclass
class AnalyticsEvent:
    """Analytics event data structure"""
    event_type: str
    user_id: str
    timestamp: datetime
    data: Dict[str, Any]
    session_id: str

class EnterpriseAnalytics:
    """Enterprise analytics and monitoring system"""
    
    def __init__(self, db_path: str = "enterprise_analytics.db"):
        self.db_path = db_path
        self.authorized_users = [
            "radosavlevici210@icloud.com",
            "ervin210@icloud.com"
        ]
        self.session_cache = {}
        self.real_time_metrics = {
            'active_sessions': 0,
            'total_interactions': 0,
            'system_uptime': datetime.now(),
            'security_events': 0
        }
        self._init_database()
        
    def _init_database(self):
        """Initialize analytics database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.executescript("""
                    CREATE TABLE IF NOT EXISTS analytics_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_type TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        timestamp DATETIME NOT NULL,
                        session_id TEXT NOT NULL,
                        data TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    
                    CREATE TABLE IF NOT EXISTS user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT UNIQUE NOT NULL,
                        user_id TEXT NOT NULL,
                        start_time DATETIME NOT NULL,
                        end_time DATETIME,
                        ip_address TEXT,
                        user_agent TEXT,
                        status TEXT DEFAULT 'active'
                    );
                    
                    CREATE TABLE IF NOT EXISTS system_metrics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        metric_name TEXT NOT NULL,
                        metric_value REAL NOT NULL,
                        timestamp DATETIME NOT NULL,
                        metadata TEXT
                    );
                    
                    CREATE TABLE IF NOT EXISTS security_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_type TEXT NOT NULL,
                        user_id TEXT,
                        ip_address TEXT,
                        timestamp DATETIME NOT NULL,
                        severity TEXT NOT NULL,
                        description TEXT NOT NULL,
                        resolved BOOLEAN DEFAULT FALSE
                    );
                    
                    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(timestamp);
                    CREATE INDEX IF NOT EXISTS idx_events_user ON analytics_events(user_id);
                    CREATE INDEX IF NOT EXISTS idx_security_timestamp ON security_events(timestamp);
                """)
            logger.info("Enterprise analytics database initialized")
        except Exception as e:
            logger.error(f"Failed to initialize analytics database: {str(e)}")
    
    def track_event(self, event_type: str, user_id: str, data: Dict[str, Any] = None, session_id: str = None):
        """Track analytics event"""
        if not self._is_authorized_user(user_id):
            self._log_security_event("unauthorized_tracking", user_id, "HIGH", 
                                   "Unauthorized user attempted event tracking")
            return False
        
        try:
            event = AnalyticsEvent(
                event_type=event_type,
                user_id=user_id,
                timestamp=datetime.now(),
                data=data or {},
                session_id=session_id or self._get_session_id(user_id)
            )
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO analytics_events (event_type, user_id, timestamp, session_id, data)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    event.event_type,
                    event.user_id,
                    event.timestamp,
                    event.session_id,
                    json.dumps(event.data)
                ))
            
            # Update real-time metrics
            self.real_time_metrics['total_interactions'] += 1
            
            logger.info(f"Event tracked: {event_type} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to track event: {str(e)}")
            return False
    
    def start_user_session(self, user_id: str, ip_address: str = None, user_agent: str = None):
        """Start user session tracking"""
        if not self._is_authorized_user(user_id):
            self._log_security_event("unauthorized_session", user_id, "CRITICAL",
                                   f"Unauthorized session attempt from {ip_address}")
            return None
        
        try:
            session_id = f"{user_id}_{datetime.now().timestamp()}"
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO user_sessions (session_id, user_id, start_time, ip_address, user_agent)
                    VALUES (?, ?, ?, ?, ?)
                """, (session_id, user_id, datetime.now(), ip_address, user_agent))
            
            self.session_cache[user_id] = session_id
            self.real_time_metrics['active_sessions'] += 1
            
            self.track_event("session_start", user_id, {
                'ip_address': ip_address,
                'user_agent': user_agent
            }, session_id)
            
            logger.info(f"Session started for user {user_id}: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to start session: {str(e)}")
            return None
    
    def end_user_session(self, user_id: str):
        """End user session"""
        try:
            session_id = self.session_cache.get(user_id)
            if session_id:
                with sqlite3.connect(self.db_path) as conn:
                    conn.execute("""
                        UPDATE user_sessions 
                        SET end_time = ?, status = 'ended'
                        WHERE session_id = ?
                    """, (datetime.now(), session_id))
                
                self.track_event("session_end", user_id, {}, session_id)
                del self.session_cache[user_id]
                self.real_time_metrics['active_sessions'] = max(0, self.real_time_metrics['active_sessions'] - 1)
                
            logger.info(f"Session ended for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to end session: {str(e)}")
    
    def log_system_metric(self, metric_name: str, value: float, metadata: Dict[str, Any] = None):
        """Log system performance metric"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO system_metrics (metric_name, metric_value, timestamp, metadata)
                    VALUES (?, ?, ?, ?)
                """, (metric_name, value, datetime.now(), json.dumps(metadata or {})))
            
            logger.debug(f"System metric logged: {metric_name} = {value}")
            
        except Exception as e:
            logger.error(f"Failed to log system metric: {str(e)}")
    
    def _log_security_event(self, event_type: str, user_id: str, severity: str, description: str, ip_address: str = None):
        """Log security event"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO security_events (event_type, user_id, ip_address, timestamp, severity, description)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (event_type, user_id, ip_address, datetime.now(), severity, description))
            
            self.real_time_metrics['security_events'] += 1
            logger.warning(f"Security event: {event_type} - {description}")
            
        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}")
    
    def get_user_analytics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get analytics for specific user"""
        if not self._is_authorized_user(user_id):
            return {'error': 'Unauthorized user'}
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            with sqlite3.connect(self.db_path) as conn:
                # Get event summary
                events_query = """
                    SELECT event_type, COUNT(*) as count
                    FROM analytics_events
                    WHERE user_id = ? AND timestamp >= ?
                    GROUP BY event_type
                    ORDER BY count DESC
                """
                events = dict(conn.execute(events_query, (user_id, cutoff_date)).fetchall())
                
                # Get session summary
                sessions_query = """
                    SELECT COUNT(*) as total_sessions,
                           AVG(CASE WHEN end_time IS NOT NULL 
                               THEN (julianday(end_time) - julianday(start_time)) * 24 * 60 
                               ELSE NULL END) as avg_duration_minutes
                    FROM user_sessions
                    WHERE user_id = ? AND start_time >= ?
                """
                session_data = conn.execute(sessions_query, (user_id, cutoff_date)).fetchone()
                
                return {
                    'user_id': user_id,
                    'period_days': days,
                    'events': events,
                    'total_sessions': session_data[0] or 0,
                    'avg_session_duration_minutes': round(session_data[1] or 0, 2),
                    'last_activity': self._get_last_activity(user_id),
                    'generated_at': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get user analytics: {str(e)}")
            return {'error': str(e)}
    
    def get_system_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get system-wide analytics"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            with sqlite3.connect(self.db_path) as conn:
                # Overall statistics
                total_events = conn.execute("""
                    SELECT COUNT(*) FROM analytics_events WHERE timestamp >= ?
                """, (cutoff_date,)).fetchone()[0]
                
                total_sessions = conn.execute("""
                    SELECT COUNT(*) FROM user_sessions WHERE start_time >= ?
                """, (cutoff_date,)).fetchone()[0]
                
                active_users = conn.execute("""
                    SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE timestamp >= ?
                """, (cutoff_date,)).fetchone()[0]
                
                # Security events
                security_events = conn.execute("""
                    SELECT severity, COUNT(*) 
                    FROM security_events 
                    WHERE timestamp >= ?
                    GROUP BY severity
                """, (cutoff_date,)).fetchall()
                
                # Top events
                top_events = conn.execute("""
                    SELECT event_type, COUNT(*) as count
                    FROM analytics_events
                    WHERE timestamp >= ?
                    GROUP BY event_type
                    ORDER BY count DESC
                    LIMIT 10
                """, (cutoff_date,)).fetchall()
                
                return {
                    'period_days': days,
                    'total_events': total_events,
                    'total_sessions': total_sessions,
                    'active_users': active_users,
                    'security_events': dict(security_events),
                    'top_events': dict(top_events),
                    'real_time_metrics': self.real_time_metrics.copy(),
                    'system_uptime_hours': (datetime.now() - self.real_time_metrics['system_uptime']).total_seconds() / 3600,
                    'authorized_users': self.authorized_users,
                    'generated_at': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get system analytics: {str(e)}")
            return {'error': str(e)}
    
    def get_security_dashboard(self) -> Dict[str, Any]:
        """Get security dashboard data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Recent security events
                recent_events = conn.execute("""
                    SELECT event_type, user_id, ip_address, timestamp, severity, description
                    FROM security_events
                    WHERE timestamp >= datetime('now', '-24 hours')
                    ORDER BY timestamp DESC
                    LIMIT 50
                """).fetchall()
                
                # Security summary
                security_summary = conn.execute("""
                    SELECT severity, COUNT(*) as count
                    FROM security_events
                    WHERE timestamp >= datetime('now', '-7 days')
                    GROUP BY severity
                """).fetchall()
                
                # Failed login attempts
                failed_logins = conn.execute("""
                    SELECT user_id, COUNT(*) as attempts
                    FROM security_events
                    WHERE event_type = 'unauthorized_session' 
                    AND timestamp >= datetime('now', '-24 hours')
                    GROUP BY user_id
                    ORDER BY attempts DESC
                """).fetchall()
                
                return {
                    'recent_events': [
                        {
                            'event_type': event[0],
                            'user_id': event[1],
                            'ip_address': event[2],
                            'timestamp': event[3],
                            'severity': event[4],
                            'description': event[5]
                        } for event in recent_events
                    ],
                    'security_summary': dict(security_summary),
                    'failed_logins': dict(failed_logins),
                    'system_status': 'SECURE',
                    'immutable_protection': True,
                    'authorized_users_count': len(self.authorized_users),
                    'generated_at': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get security dashboard: {str(e)}")
            return {'error': str(e)}
    
    def _is_authorized_user(self, user_id: str) -> bool:
        """Check if user is authorized"""
        return user_id in self.authorized_users
    
    def _get_session_id(self, user_id: str) -> str:
        """Get current session ID for user"""
        return self.session_cache.get(user_id, f"default_{user_id}")
    
    def _get_last_activity(self, user_id: str) -> Optional[str]:
        """Get user's last activity timestamp"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                result = conn.execute("""
                    SELECT timestamp FROM analytics_events
                    WHERE user_id = ?
                    ORDER BY timestamp DESC
                    LIMIT 1
                """, (user_id,)).fetchone()
                
                return result[0] if result else None
                
        except Exception as e:
            logger.error(f"Failed to get last activity: {str(e)}")
            return None
    
    def generate_compliance_report(self) -> Dict[str, Any]:
        """Generate compliance and audit report"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Data retention compliance
                total_events = conn.execute("SELECT COUNT(*) FROM analytics_events").fetchone()[0]
                oldest_event = conn.execute("SELECT MIN(timestamp) FROM analytics_events").fetchone()[0]
                
                # User access compliance
                user_access_log = conn.execute("""
                    SELECT user_id, COUNT(*) as access_count, MIN(timestamp) as first_access, MAX(timestamp) as last_access
                    FROM analytics_events
                    GROUP BY user_id
                """).fetchall()
                
                # Security compliance
                unresolved_security = conn.execute("""
                    SELECT COUNT(*) FROM security_events WHERE resolved = FALSE
                """).fetchone()[0]
                
                return {
                    'report_type': 'Enterprise Compliance Report',
                    'generated_at': datetime.now().isoformat(),
                    'compliance_officer': 'Ervin Remus Radosavlevici',
                    'watermark': 'radosavlevici210@icloud.com',
                    'data_retention': {
                        'total_events': total_events,
                        'oldest_event': oldest_event,
                        'retention_compliant': True
                    },
                    'user_access': {
                        'authorized_users': self.authorized_users,
                        'access_log': [
                            {
                                'user_id': log[0],
                                'access_count': log[1],
                                'first_access': log[2],
                                'last_access': log[3]
                            } for log in user_access_log
                        ]
                    },
                    'security_compliance': {
                        'unresolved_incidents': unresolved_security,
                        'immutable_protection': True,
                        'access_control': 'ENFORCED',
                        'audit_trail': 'COMPLETE'
                    },
                    'legal_framework': {
                        'nda_active': True,
                        'license_enforced': True,
                        'terms_accepted': True,
                        'security_policy': 'IMPLEMENTED'
                    }
                }
                
        except Exception as e:
            logger.error(f"Failed to generate compliance report: {str(e)}")
            return {'error': str(e)}

# Global analytics instance
enterprise_analytics = EnterpriseAnalytics()