import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load configurations from env
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_12345')

# Enable CORS for standard React dev server ports
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "http://localhost:5174", 
    "http://127.0.0.1:5174"
])

@app.route('/api/health', methods=['GET'])
def health_check():
    """Sanity endpoint to verify API connection."""
    return jsonify({
        "status": "healthy",
        "message": "AI Medical Assistant API is running.",
        "stage": 1
    }), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
