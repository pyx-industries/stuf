from flask import request, jsonify
from functools import wraps
import json
import requests
from urllib.parse import urljoin
import os

# Keycloak configuration
KEYCLOAK_URL = os.environ.get('KEYCLOAK_URL', 'http://keycloak:8080')
KEYCLOAK_REALM = os.environ.get('KEYCLOAK_REALM', 'stuf')
KEYCLOAK_CLIENT_ID = os.environ.get('KEYCLOAK_CLIENT_ID', 'stuf-api')
KEYCLOAK_CLIENT_SECRET = os.environ.get('KEYCLOAK_CLIENT_SECRET', 'some-secret-value')

# Keycloak endpoints
token_endpoint = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
userinfo_endpoint = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/userinfo"
introspect_endpoint = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token/introspect"

def get_token_headers():
    """Extract the token from the Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    return auth_header.split(' ')[1]

def validate_token(token):
    """Validate the token with Keycloak introspection endpoint"""
    data = {
        'token': token,
        'client_id': KEYCLOAK_CLIENT_ID,
        'client_secret': KEYCLOAK_CLIENT_SECRET
    }
    
    response = requests.post(introspect_endpoint, data=data)
    
    if response.status_code != 200:
        return None
    
    token_info = response.json()
    
    # Check if token is active
    if not token_info.get('active', False):
        return None
        
    return token_info

def get_userinfo(token):
    """Get user information from Keycloak userinfo endpoint"""
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.get(userinfo_endpoint, headers=headers)
    
    if response.status_code != 200:
        return None
        
    return response.json()

def require_auth(f):
    """Decorator to require authentication for API endpoints"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_headers()
        
        if not token:
            return jsonify({'error': 'Missing authorization token'}), 401
            
        token_info = validate_token(token)
        
        if not token_info:
            return jsonify({'error': 'Invalid or expired token'}), 401
            
        # Add token info to request context
        request.token_info = token_info
        
        return f(*args, **kwargs)
    return decorated

def require_role(role):
    """Decorator to require a specific role for API endpoints"""
    def decorator(f):
        @wraps(f)
        @require_auth
        def decorated(*args, **kwargs):
            token_info = request.token_info
            
            # Check if user has the required role
            realm_access = token_info.get('realm_access', {})
            roles = realm_access.get('roles', [])
            
            if role not in roles:
                return jsonify({'error': f'Requires role: {role}'}), 403
                
            return f(*args, **kwargs)
        return decorated
    return decorator

def get_client_token():
    """Get a token for the client using client credentials flow"""
    data = {
        'grant_type': 'client_credentials',
        'client_id': KEYCLOAK_CLIENT_ID,
        'client_secret': KEYCLOAK_CLIENT_SECRET
    }
    
    response = requests.post(token_endpoint, data=data)
    
    if response.status_code != 200:
        return None
        
    return response.json().get('access_token')
