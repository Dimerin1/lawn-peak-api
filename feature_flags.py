import os
from functools import wraps
from flask import jsonify

class FeatureFlags:
    REFERRAL_SYSTEM = 'ENABLE_REFERRAL_SYSTEM'
    
    @staticmethod
    def is_enabled(feature_flag):
        """Check if a feature flag is enabled."""
        return os.getenv(feature_flag, 'false').lower() == 'true'

def feature_flag_required(feature_flag):
    """Decorator to check if a feature flag is enabled before executing the route."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not FeatureFlags.is_enabled(feature_flag):
                return jsonify({
                    'error': 'This feature is not available in your environment'
                }), 404
            return f(*args, **kwargs)
        return decorated_function
    return decorator
