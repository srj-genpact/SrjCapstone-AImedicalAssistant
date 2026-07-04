import os
from app import app, db
from models import User, MedicalCondition, Consultation

def seed_database():
    print("Seeding database (medical_assistant_dev)...")
    
    # Reset/Create tables
    db.drop_all()
    db.create_all()
    
    # 1. Seed Patient Users
    priya = User(
        username="Priya_Sharma", 
        email="priya.sharma1997@gmail.com",
        date_of_birth="2002-11-10",
        gender="Female",
        medical_history="Allergic to Penicillin. Diagnosed with seasonal asthma."
    )
    priya.set_password("priya123")
    
    ravi = User(
        username="Ravi", 
        email="ravi.kumar@gmail.com",
        date_of_birth="1990-08-15",
        gender="Male",
        medical_history="Overweight. General stage 1 hypertension readings."
    )
    ravi.set_password("ravi123")

    suraj = User(
        username="Srjrocks", 
        email="srjrocks@genpact.com",
        date_of_birth="1995-03-01",
        gender="Male",
        medical_history="Overslim. Have a low BP issue."
    )
    suraj.set_password("suraj123")
    
    db.session.add_all([priya,ravi,suraj])
    db.session.commit()
    print("Created patient profiles (Priya_Sharima, Ravi, Srjrocks)")
    
    # 2. Seed chronic conditions logs
    c_priya = MedicalCondition(
        user_id=priya.id,
        condition_name="Asthma",
        notes="Mild seasonal asthma. Triggered by cold air and pollen."
    )
    
    c_ravi = MedicalCondition(
        user_id=ravi.id,
        condition_name="Diabetes",
        notes="Type 2 Diabetes Mellitus. Diagnostic HbA1c was 7.2%. Prescribed Metformin."
    )

    c_suraj = MedicalCondition(
        user_id=suraj.id,
        condition_name="BP",
        notes="Low BP ."
    )
    
    db.session.add_all([c_priya, c_ravi,c_suraj])
    db.session.commit()
    print("Created medical conditions profiles (Asthma for Priya, Diabetes for Ravi, BP for Suraj)")

    # 3. Seed baseline consultation record
    c1 = Consultation(
        user_id=priya.id,
        query_text="What is the recommended medicine for asthma symptom relief?",
        response_text=(
            "### Clinical Assessment & Guidance\n\n"
            "Personalized for: **priya_sharma** (Female, DOB: 2002-11-10)\n"
            "*Logged conditions:* Asthma\n\n"
            "### Clinical Guideline Recommendations\n"
            "#### Guidelines from Asthma (Section: 3. Stepwise Treatment):\n"
            "- Preferred Rescue (GINA Track 1): Formoterol combined with an Inhaled Corticosteroid (ICS), "
            "such as Budesonide-Formoterol, used as-needed for symptom relief."
        )
    )
    c1.set_sources([
        {
            "score": 0.384,
            "source_file": "asthma.md",
            "source_title": "Asthma",
            "section": "3. Stepwise Treatment",
            "text": "Preferred Rescue/Controller: Formoterol combined with Inhaled Corticosteroid..."
        }
    ])
    
    db.session.add(c1)
    db.session.commit()
    print("Created mock consultation chat log for Priya only.")
    print("Congrats!, Database seeding completed successfully!")

if __name__ == "__main__":
    with app.app_context():
        seed_database()
