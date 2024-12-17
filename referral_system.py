import sqlite3
import string
import random
import time
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def init_db():
    """Initialize the referral system database tables."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    
    # Create referral_codes table
    c.execute('''
        CREATE TABLE IF NOT EXISTS referral_codes (
            code TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER,
            usage_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Create referral_uses table
    c.execute('''
        CREATE TABLE IF NOT EXISTS referral_uses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referral_code TEXT NOT NULL,
            referee_id TEXT NOT NULL,
            used_at INTEGER NOT NULL,
            order_id TEXT NOT NULL,
            reward_status TEXT DEFAULT 'PENDING',
            FOREIGN KEY (referral_code) REFERENCES referral_codes (code)
        )
    ''')
    
    # Create referral_rewards table
    c.execute('''
        CREATE TABLE IF NOT EXISTS referral_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            amount REAL NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            referral_use_id INTEGER,
            FOREIGN KEY (referral_use_id) REFERENCES referral_uses (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def generate_referral_code(length=8):
    """Generate a unique referral code."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choice(chars) for _ in range(length))
        conn = sqlite3.connect('payments.db')
        c = conn.cursor()
        existing = c.execute('SELECT 1 FROM referral_codes WHERE code = ?', (code,)).fetchone()
        conn.close()
        if not existing:
            return code

def create_referral_code(user_id, expiration_days=None):
    """Create a new referral code for a user."""
    code = generate_referral_code()
    created_at = int(time.time())
    expires_at = None
    if expiration_days:
        expires_at = created_at + (expiration_days * 24 * 60 * 60)
    
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO referral_codes (code, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (code, user_id, created_at, expires_at))
        conn.commit()
        return code
    except Exception as e:
        logger.error(f"Error creating referral code: {str(e)}")
        return None
    finally:
        conn.close()

def validate_referral_code(code):
    """Validate a referral code and return user_id if valid."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        result = c.execute('''
            SELECT user_id, expires_at, is_active 
            FROM referral_codes 
            WHERE code = ?
        ''', (code,)).fetchone()
        
        if not result:
            return None
            
        user_id, expires_at, is_active = result
        
        if not is_active:
            return None
            
        if expires_at and int(time.time()) > expires_at:
            return None
            
        return user_id
    finally:
        conn.close()

def record_referral_use(code, referee_id, order_id):
    """Record the use of a referral code."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        # Check if this referee has already used a referral code
        existing_use = c.execute('''
            SELECT 1 FROM referral_uses WHERE referee_id = ?
        ''', (referee_id,)).fetchone()
        
        if existing_use:
            return False, "Referee has already used a referral code"
        
        # Record the use
        c.execute('''
            INSERT INTO referral_uses (referral_code, referee_id, used_at, order_id)
            VALUES (?, ?, ?, ?)
        ''', (code, referee_id, int(time.time()), order_id))
        
        # Update usage count
        c.execute('''
            UPDATE referral_codes 
            SET usage_count = usage_count + 1 
            WHERE code = ?
        ''', (code,))
        
        conn.commit()
        return True, None
    except Exception as e:
        logger.error(f"Error recording referral use: {str(e)}")
        return False, str(e)
    finally:
        conn.close()

def create_reward(user_id, amount, referral_use_id, validity_days=180):
    """Create a reward for a successful referral."""
    created_at = int(time.time())
    expires_at = created_at + (validity_days * 24 * 60 * 60)
    
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO referral_rewards 
            (user_id, amount, created_at, expires_at, referral_use_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, amount, created_at, expires_at, referral_use_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error creating reward: {str(e)}")
        return False
    finally:
        conn.close()

def get_user_rewards(user_id):
    """Get all active rewards for a user."""
    current_time = int(time.time())
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        rewards = c.execute('''
            SELECT id, amount, created_at, expires_at 
            FROM referral_rewards 
            WHERE user_id = ? 
            AND status = 'ACTIVE' 
            AND expires_at > ?
        ''', (user_id, current_time)).fetchall()
        
        return [
            {
                'id': r[0],
                'amount': r[1],
                'created_at': datetime.fromtimestamp(r[2]).isoformat(),
                'expires_at': datetime.fromtimestamp(r[3]).isoformat()
            }
            for r in rewards
        ]
    finally:
        conn.close()

def get_referral_statistics(user_id):
    """Get referral statistics for a user."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        # Get total referrals
        total_referrals = c.execute('''
            SELECT COUNT(*) FROM referral_uses ru
            JOIN referral_codes rc ON ru.referral_code = rc.code
            WHERE rc.user_id = ?
        ''', (user_id,)).fetchone()[0]
        
        # Get total rewards
        total_rewards = c.execute('''
            SELECT COALESCE(SUM(amount), 0) FROM referral_rewards
            WHERE user_id = ? AND status = 'ACTIVE'
        ''', (user_id,)).fetchone()[0]
        
        # Get active referral codes
        active_codes = c.execute('''
            SELECT code, created_at, expires_at, usage_count
            FROM referral_codes
            WHERE user_id = ? AND is_active = 1
        ''', (user_id,)).fetchall()
        
        return {
            'total_referrals': total_referrals,
            'total_rewards': total_rewards,
            'active_codes': [
                {
                    'code': code,
                    'created_at': datetime.fromtimestamp(created_at).isoformat(),
                    'expires_at': datetime.fromtimestamp(expires_at).isoformat() if expires_at else None,
                    'usage_count': usage_count
                }
                for code, created_at, expires_at, usage_count in active_codes
            ]
        }
    finally:
        conn.close()
