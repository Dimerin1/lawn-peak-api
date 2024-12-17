import sqlite3
import logging
import time
from datetime import datetime, timedelta
import string
import random

logger = logging.getLogger(__name__)

def init_referral_tables():
    """Initialize the referral system database tables."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    
    try:
        # Create referral_codes table
        c.execute('''
            CREATE TABLE IF NOT EXISTS referral_codes (
                code TEXT PRIMARY KEY,
                customer_email TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER,
                usage_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (customer_email) REFERENCES customers (email)
            )
        ''')
        
        # Create referral_uses table
        c.execute('''
            CREATE TABLE IF NOT EXISTS referral_uses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                referral_code TEXT NOT NULL,
                referee_email TEXT NOT NULL,
                used_at INTEGER NOT NULL,
                order_id TEXT NOT NULL,
                reward_status TEXT DEFAULT 'PENDING',
                reward_amount REAL NOT NULL,
                FOREIGN KEY (referral_code) REFERENCES referral_codes (code),
                FOREIGN KEY (referee_email) REFERENCES customers (email)
            )
        ''')
        
        # Create referral_rewards table
        c.execute('''
            CREATE TABLE IF NOT EXISTS referral_rewards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_email TEXT NOT NULL,
                amount REAL NOT NULL,
                created_at INTEGER NOT NULL,
                expires_at INTEGER NOT NULL,
                status TEXT DEFAULT 'ACTIVE',
                referral_use_id INTEGER,
                stripe_credit_id TEXT,
                FOREIGN KEY (customer_email) REFERENCES customers (email),
                FOREIGN KEY (referral_use_id) REFERENCES referral_uses (id)
            )
        ''')
        
        conn.commit()
        logger.info("Referral tables created successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error creating referral tables: {str(e)}")
        return False
    finally:
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

def create_referral_code(customer_email, expiration_days=None):
    """Create a new referral code for a customer."""
    code = generate_referral_code()
    created_at = int(time.time())
    expires_at = None
    if expiration_days:
        expires_at = created_at + (expiration_days * 24 * 60 * 60)
    
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        # Verify customer exists
        customer = c.execute('SELECT 1 FROM customers WHERE email = ?', (customer_email,)).fetchone()
        if not customer:
            logger.error(f"Customer with email {customer_email} not found")
            return None

        c.execute('''
            INSERT INTO referral_codes (code, customer_email, created_at, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (code, customer_email, created_at, expires_at))
        conn.commit()
        return code
    except Exception as e:
        logger.error(f"Error creating referral code: {str(e)}")
        return None
    finally:
        conn.close()

def validate_referral_code(code, referee_email):
    """Validate a referral code and check if it can be used by the referee."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        # Check if code exists and is valid
        result = c.execute('''
            SELECT rc.customer_email, rc.expires_at, rc.is_active 
            FROM referral_codes rc
            WHERE rc.code = ?
        ''', (code,)).fetchone()
        
        if not result:
            return None, "Invalid referral code"
            
        referrer_email, expires_at, is_active = result
        
        # Check if code is active
        if not is_active:
            return None, "Referral code is no longer active"
            
        # Check if code has expired
        if expires_at and int(time.time()) > expires_at:
            return None, "Referral code has expired"
            
        # Check if referee is trying to use their own code
        if referrer_email == referee_email:
            return None, "Cannot use your own referral code"
            
        # Check if referee has already used any referral code
        existing_use = c.execute('''
            SELECT 1 FROM referral_uses 
            WHERE referee_email = ?
        ''', (referee_email,)).fetchone()
        
        if existing_use:
            return None, "You have already used a referral code"
            
        return referrer_email, None
    finally:
        conn.close()

def record_referral_use(code, referee_email, order_id, reward_amount):
    """Record the use of a referral code."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        # Record the use
        c.execute('''
            INSERT INTO referral_uses 
            (referral_code, referee_email, used_at, order_id, reward_amount)
            VALUES (?, ?, ?, ?, ?)
        ''', (code, referee_email, int(time.time()), order_id, reward_amount))
        
        # Update usage count
        c.execute('''
            UPDATE referral_codes 
            SET usage_count = usage_count + 1 
            WHERE code = ?
        ''', (code,))
        
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error recording referral use: {str(e)}")
        return False
    finally:
        conn.close()

def create_reward(customer_email, amount, referral_use_id, stripe_credit_id=None, validity_days=180):
    """Create a reward for a successful referral."""
    created_at = int(time.time())
    expires_at = created_at + (validity_days * 24 * 60 * 60)
    
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        c.execute('''
            INSERT INTO referral_rewards 
            (customer_email, amount, created_at, expires_at, referral_use_id, stripe_credit_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (customer_email, amount, created_at, expires_at, referral_use_id, stripe_credit_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error creating reward: {str(e)}")
        return False
    finally:
        conn.close()

def get_customer_rewards(customer_email):
    """Get all active rewards for a customer."""
    current_time = int(time.time())
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        rewards = c.execute('''
            SELECT id, amount, created_at, expires_at, status, stripe_credit_id
            FROM referral_rewards 
            WHERE customer_email = ? 
            AND status = 'ACTIVE' 
            AND expires_at > ?
        ''', (customer_email, current_time)).fetchall()
        
        return [{
            'id': r[0],
            'amount': r[1],
            'created_at': datetime.fromtimestamp(r[2]).isoformat(),
            'expires_at': datetime.fromtimestamp(r[3]).isoformat(),
            'status': r[4],
            'stripe_credit_id': r[5]
        } for r in rewards]
    finally:
        conn.close()

def get_referral_statistics(customer_email):
    """Get referral statistics for a customer."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        # Get total referrals and earnings
        stats = c.execute('''
            SELECT 
                COUNT(ru.id) as total_referrals,
                COALESCE(SUM(ru.reward_amount), 0) as total_earnings,
                COUNT(CASE WHEN ru.reward_status = 'PENDING' THEN 1 END) as pending_rewards
            FROM referral_codes rc
            LEFT JOIN referral_uses ru ON rc.code = ru.referral_code
            WHERE rc.customer_email = ?
        ''', (customer_email,)).fetchone()
        
        # Get active referral codes
        codes = c.execute('''
            SELECT code, created_at, expires_at, usage_count
            FROM referral_codes
            WHERE customer_email = ? AND is_active = 1
        ''', (customer_email,)).fetchall()
        
        return {
            'total_referrals': stats[0],
            'total_earnings': stats[1],
            'pending_rewards': stats[2],
            'active_codes': [{
                'code': code,
                'created_at': datetime.fromtimestamp(created_at).isoformat(),
                'expires_at': datetime.fromtimestamp(expires_at).isoformat() if expires_at else None,
                'usage_count': usage_count
            } for code, created_at, expires_at, usage_count in codes]
        }
    finally:
        conn.close()

def update_reward_status(referral_use_id, status):
    """Update the status of a referral reward."""
    conn = sqlite3.connect('payments.db')
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE referral_uses 
            SET reward_status = ? 
            WHERE id = ?
        ''', (status, referral_use_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error updating reward status: {str(e)}")
        return False
    finally:
        conn.close()
