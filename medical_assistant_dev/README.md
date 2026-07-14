# Project Brief

### Project Title
AI Medical Assistant

### Target User
Patients managing chronic illnesses (e.g., Asthma, Diabetes, Hypertension, Low BP) or tracking acute symptoms who need pre-consultation guidance and timeline organization.

### Business/User Problem
During brief (15-20 min) physician visits, patients frequently forget key symptoms or fail to report accurate timelines due to anxiety or cognitive load. Physicians waste valuable consultation minutes extracting basic history instead of discussing diagnosis and care. This application bridges the pre-consultation gap by allowing users to securely track health logs and query clinical guidelines.

### MVP Scope
An authenticated patient dashboard allowing users to manage their medical profiles, log and track chronic conditions (CRUD), query symptoms via a retrieval-augmented generation (RAG) assistant, view cited clinical sources, and log session-specific observations and reminders (CRUD).

### Authentication Approach
Stateless Bearer token verification with protected endpoints. User accounts are created and authenticated in Flask using secure bcrypt password hashing.

### Main Data Models
* **User (`users` table)**: Stores user credentials, date of birth, gender, and general medical history.
* **MedicalCondition (`medical_conditions` table)**: Belongs to a user; logs chronic conditions (e.g. Asthma, Diabetes) and related vitals/notes.
* **Consultation (`consultations` table)**: Belongs to a user; stores queries, AI responses, cited sources, and personal reminders/notes (CRUD target).

### AI/RAG Feature
Ingests local clinical guideline Markdown files, chunks them based on headers, filters out stopwords, and builds a custom TF-IDF vocabulary. Symptoms are matched against guidelines using Cosine Similarity. The engine coordinates context prompts sending user profile data and matching reference texts to Google's `gemini-1.5-flash` model, falling back to a rule-based Local Synthesizer offline.

### Knowledge Base
A directory of clinical reference guidelines in Markdown format covering:
* **Asthma** (Stepwise treatment tracks)
* **Diabetes** (Glycemic goals, metformin thresholds)
* **Hypertension** (First-line agents, diabetes renal protections)
* **Influenza** (Symptom progression, risk group warnings)

### Persistent AI Feature
Every consultation is persisted in the SQLite database, storing the user query, AI-generated response, JSON-serialized source citations, and user-editable observations.

### Stretch Goals
* Print-friendly PDF summary export for doctors
* Voice/audio symptom dictation
* Dedicated clinical portal for physicians
* Public health database API integrations

---

## Version 1 Project
**GitHub Repository:** [medical_assistant_dev](file:///c:/Users/flatironuser20/Desktop/PyAssignments/CapStoneProj/medical_assistant_dev)

### Current Status
**Working**
* User registration and login (Bcrypt, Bearer tokens)
* Patient profile and chronic conditions management (CRUD)
* RAG pipeline using custom TF-IDF & Cosine Similarity
* Empathetic AI responses using Gemini 1.5 Flash SDK
* Local Synthesizer fallback for offline operation
* Custom session observations and reminder logging (CRUD)
* Responsive glassmorphic UI dashboard

**Partially Working**
* Local development server is running locally on port 5173 (frontend) and port 5000 (backend). Preparing deployment configuration scripts.

**Needs Improvement**
* Advanced input validation for clinical terms
* UI styling edge cases on extra-small mobile devices
* Detailed unit test coverage for the custom TF-IDF vectorizer

---

### Strongest Feature
The **Personalized RAG Pipeline & Fallback System**. The engine dynamically queries the user's active conditions (e.g., matching a blood pressure query with a logged Diabetes condition to highlight renal protection guidelines) and gracefully falls back to a locally processed rule-based synthesiser if the Gemini API is offline, ensuring patient-facing safety at all times.

---

## Written Reflection

### Accomplishment
Successfully designing and implementing a dependency-free, pure Python tokenized TF-IDF vector search and retrieval engine. This avoided the overhead of heavy vector databases like ChromaDB, allowing the entire application to run seamlessly on a lightweight CPU sandbox.

### Opportunity for Growth
Deploying client-server architectures with stateless token handshakes was a challenge. In future projects, I want to explore automated pipeline testing using pytest frameworks and integrate PDF export formatting directly in the browser.