import json
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # Patient profile fields
    date_of_birth = db.Column(db.String(10), nullable=True)  # Format: YYYY-MM-DD
    gender = db.Column(db.String(20), nullable=True)
    medical_history = db.Column(db.Text, nullable=True)       # General background text
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    conditions = db.relationship('MedicalCondition', backref='patient', lazy=True, cascade="all, delete-orphan")
    consultations = db.relationship('Consultation', backref='patient', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
        except Exception:
            return False

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "date_of_birth": self.date_of_birth or "",
            "gender": self.gender or "",
            "medical_history": self.medical_history or "",
            "created_at": self.created_at.isoformat()
        }

class MedicalCondition(db.Model):
    __tablename__ = 'medical_conditions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    condition_name = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.Text, nullable=True)                  # details / vitals values
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "condition_name": self.condition_name,
            "notes": self.notes or "",
            "logged_at": self.logged_at.isoformat()
        }

class Consultation(db.Model):
    __tablename__ = 'consultations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    query_text = db.Column(db.Text, nullable=False)
    response_text = db.Column(db.Text, nullable=False)
    sources_used = db.Column(db.Text, nullable=True)  # JSON-serialized sources
    notes = db.Column(db.Text, nullable=True)         # Personal reminders log (CRUD target)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_sources(self):
        if not self.sources_used:
            return []
        try:
            return json.loads(self.sources_used)
        except Exception:
            return []

    def set_sources(self, sources_list):
        self.sources_used = json.dumps(sources_list)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "query_text": self.query_text,
            "response_text": self.response_text,
            "sources": self.get_sources(),
            "notes": self.notes or "",
            "created_at": self.created_at.isoformat()
        }
