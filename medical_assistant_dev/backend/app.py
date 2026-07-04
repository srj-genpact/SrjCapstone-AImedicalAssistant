import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from models import db, User, MedicalCondition
from auth import auth_bp, login_required

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_12345')

# Database Path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
if not os.path.exists(INSTANCE_DIR):
    os.makedirs(INSTANCE_DIR) # creating dirrectory if not exitst.
db_path = os.path.join(INSTANCE_DIR, 'medical_assistant.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Enable CORS for React dev servers
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "http://localhost:5174", 
    "http://127.0.0.1:5174"
])

# Initialize database
db.init_app(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Create tables in the database if they do not exist
with app.app_context():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Testing the Endpoint to verify API connection."""
    return jsonify({
        "status": "healthy",
        "message": "AI Medical Assistant API is working & running.",
        "stage": 3
    }), 200
    
@app.route('/api/getTestdata', methods=['GET'])
def getTestdata():
    """Fetching test data from the database."""
    # Fetch the first user from the database as test data
    first_user = User.query.first()
    testdata = first_user.to_dict() if first_user else {"message": "No users found in database. Please run seed.py first."}
    return jsonify({
        "status": "ok",
        "message": "Successfully fetched sample user data.",
        "stage": 2,
        "testdata": testdata
    }), 200

@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Retrieve all users from the database."""
    all_users = User.query.all()
    return jsonify({
        "status": "ok",
        "stage": 2,
        "users": [u.to_dict() for u in all_users]
    }), 200

# --- Patient Profile Endpoint ---

@app.route('/api/profile', methods=['PUT'])
@login_required
def update_profile(current_user):
    """Allows patient to update their basic profile info (date_of_birth, gender, medical_history)."""
    data = request.get_json() or {}
    
    date_of_birth = data.get('date_of_birth')
    gender = data.get('gender')
    medical_history = data.get('medical_history')

    if date_of_birth is not None:
        current_user.date_of_birth = date_of_birth
    if gender is not None:
        current_user.gender = gender
    if medical_history is not None:
        current_user.medical_history = medical_history

    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully.",
            "user": current_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500


# --- Medical Conditions CRUD routes ---

@app.route('/api/conditions', methods=['GET'])
@login_required
def get_conditions(current_user):
    """List all medical conditions logged by the patient."""
    conditions = MedicalCondition.query.filter_by(user_id=current_user.id).order_by(MedicalCondition.logged_at.desc()).all()
    return jsonify([c.to_dict() for c in conditions]), 200

@app.route('/api/conditions', methods=['POST'])
@login_required
def create_condition(current_user):
    """Log a new medical condition."""
    data = request.get_json() or {}
    condition_name = data.get('condition_name')
    notes = data.get('notes', '')

    if not condition_name:
        return jsonify({"error": "Condition name is required."}), 400

    try:
        new_condition = MedicalCondition(
            user_id=current_user.id,
            condition_name=condition_name,
            notes=notes
        )
        db.session.add(new_condition)
        db.session.commit()
        return jsonify(new_condition.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create condition record: {str(e)}"}), 500

@app.route('/api/conditions/<int:condition_id>', methods=['PUT'])
@login_required
def update_condition(current_user, condition_id):
    """Update a logged medical condition."""
    condition = db.session.get(MedicalCondition, condition_id)
    if not condition:
        return jsonify({"error": "Condition record not found."}), 404
        
    # Verify ownership
    if condition.user_id != current_user.id:
        return jsonify({"error": "Access denied."}), 403

    data = request.get_json() or {}
    condition_name = data.get('condition_name')
    notes = data.get('notes')

    if condition_name:
        condition.condition_name = condition_name
    if notes is not None:
        condition.notes = notes

    try:
        db.session.commit()
        return jsonify(condition.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update condition: {str(e)}"}), 500

@app.route('/api/conditions/<int:condition_id>', methods=['DELETE'])
@login_required
def delete_condition(current_user, condition_id):
    """Delete a logged medical condition."""
    condition = db.session.get(MedicalCondition, condition_id)
    if not condition:
        return jsonify({"error": "Condition record not found."}), 404
        
    # Verify ownership
    if condition.user_id != current_user.id:
        return jsonify({"error": "Access denied."}), 403

    try:
        db.session.delete(condition)
        db.session.commit()
        return jsonify({"message": "Condition record deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete condition: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
