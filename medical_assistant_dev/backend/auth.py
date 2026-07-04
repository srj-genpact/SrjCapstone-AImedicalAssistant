from flask import Blueprint, request, jsonify
from functools import wraps
from models import db, User

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    """Decorator to protect routes. Checks if user is authenticated via Authorization header."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        user_id = None
        if auth_header and auth_header.startswith('Bearer '):
            try:
                user_id = auth_header.split('Bearer ')[1].strip()
            except IndexError:
                pass
                
        if not user_id:
            return jsonify({"error": "Unauthorized. Please log in."}), 401
        
        # Verify user exists in SQLite
        try:
            user = db.session.get(User, int(user_id))
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid authorization token."}), 401
            
        if not user:
            return jsonify({"error": "Invalid session. Please log in again."}), 401
            
        return f(user, *args, **kwargs)
    return decorated_function

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new patient account with profile parameters."""
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Profile parameters
    date_of_birth = data.get('date_of_birth')
    gender = data.get('gender')
    medical_history = data.get('medical_history', '')
# username,email and password validation
    if not username or not email or not password:
        return jsonify({"error": "Missing required fields (username, email, password)."}), 400
# Username already exist
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists."}), 400
# email already exist
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists."}), 400

    try:
        new_user = User(
            username=username, 
            email=email,
            date_of_birth=date_of_birth,
            gender=gender,
            medical_history=medical_history
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()
        
        # Return user ID as the token
        token = str(new_user.id)
        
        return jsonify({
            "message": "Patient registered successfully.",
            "token": token,
            "user": new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate and login user, returning token payload."""
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password."}), 401

    token = str(user.id)
    
    return jsonify({
        "message": "Logged in successfully.",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Stateless logout endpoints (frontend removes token)."""
    return jsonify({"message": "Logged out successfully."}), 200

@auth_bp.route('/me', methods=['GET'])
def check_session():
    """Verify session validity from Bearer token."""
    auth_header = request.headers.get('Authorization')
    user_id = None
    if auth_header and auth_header.startswith('Bearer '):
        try:
            user_id = auth_header.split('Bearer ')[1].strip()
        except IndexError:
            pass
            
    if not user_id:
        return jsonify({"authenticated": False}), 200
        
    try:
        user = db.session.get(User, int(user_id))
    except (ValueError, TypeError):
        return jsonify({"authenticated": False}), 200
        
    if not user:
        return jsonify({"authenticated": False}), 200
        
    return jsonify({
        "authenticated": True,
        "user": user.to_dict()
    }), 200
