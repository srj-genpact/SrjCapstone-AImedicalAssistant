import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from models import db

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_12345')

# Database path
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

# Create tables in the database if they do not exist
with app.app_context():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Testing the Endpoint to verify API connection."""
    return jsonify({
        "status": "healthy",
        "message": "AI Medical Assistant API is working & running.",
        "stage": 2
    }), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
