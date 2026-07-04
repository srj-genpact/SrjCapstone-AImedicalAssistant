import os
import re
import json
import numpy as np
from collections import Counter
import google.generativeai as genai

# Setup knowledge base path dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KB_DIR = os.path.join(BASE_DIR, 'knowledge_base')

class RAGEngine:
    def __init__(self, kb_dir=KB_DIR):
        self.kb_dir = kb_dir
        self.chunks = []
        self.load_knowledge_base()

    def load_knowledge_base(self):
        """Loads and chunks clinical guidelines from the knowledge base directory."""
        self.chunks = []
        if not os.path.exists(self.kb_dir):
            os.makedirs(self.kb_dir)
            return

        for filename in os.listdir(self.kb_dir):
            if filename.endswith('.md'):
                file_path = os.path.join(self.kb_dir, filename)
                title = filename.replace('.md', '').capitalize()
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Split chunks based on second-level markdown headers (##) or empty lines
                raw_paragraphs = re.split(r'\n(?=## )|\n\n', content)
                
                current_section = "General"
                for para in raw_paragraphs:
                    para = para.strip()
                    if not para:
                        continue
                    
                    heading_match = re.match(r'^##\s+(.+)$', para, re.MULTILINE)
                    if heading_match:
                        current_section = heading_match.group(1).strip()
                    
                    self.chunks.append({
                        "source_file": filename,
                        "source_title": title,
                        "section": current_section,
                        "text": para
                    })
        print(f"Loaded RAG Knowledge Base: {len(self.chunks)} chunks from {self.kb_dir}")

    def tokenize(self, text):
        text = text.lower()
        words = re.findall(r'\b[a-z0-9\-]+\b', text)
        stopwords = {
            'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren', 't', 
            'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 
            'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 
            'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 
            'into', 'is', 'isn', 't', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 
            'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 
            'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 
            'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 
            'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your'
        }
        return [w for w in words if w not in stopwords]

    def retrieve(self, query, top_k=2):
        if not self.chunks:
            return []

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return []

        chunk_token_lists = [self.tokenize(c['text']) for c in self.chunks]
        
        vocab = set(word for tokens in chunk_token_lists for word in tokens)
        vocab.update(query_tokens)
        vocab = list(vocab)
        
        num_docs = len(self.chunks)
        idf = {}
        for term in vocab:
            doc_freq = sum(1 for tokens in chunk_token_lists if term in tokens)
            idf[term] = np.log((1 + num_docs) / (1 + doc_freq)) + 1

        def to_tfidf_vec(tokens):
            counts = Counter(tokens)
            vec = np.zeros(len(vocab))
            for i, term in enumerate(vocab):
                if term in counts:
                    vec[i] = counts[term] * idf[term]
            return vec

        query_vec = to_tfidf_vec(query_tokens)
        query_norm = np.linalg.norm(query_vec)
        if query_norm == 0:
            return []

        scores = []
        for i, chunk in enumerate(self.chunks):
            chunk_vec = to_tfidf_vec(chunk_token_lists[i])
            chunk_norm = np.linalg.norm(chunk_vec)
            
            if chunk_norm == 0:
                similarity = 0.0
            else:
                similarity = np.dot(query_vec, chunk_vec) / (query_norm * chunk_norm)
            
            scores.append((similarity, chunk))

        scores.sort(key=lambda x: x[0], reverse=True)
        
        results = []
        for score, chunk in scores[:top_k]:
            results.append({
                "score": float(score),
                "source_file": chunk["source_file"],
                "source_title": chunk["source_title"],
                "section": chunk["section"],
                "text": chunk["text"]
            })
        return results

    def local_synthesize(self, query, context_chunks, patient_profile=None):
        """Local syntactic generator fallback adjusting recommendation based on matching guidelines and patient profile details."""
        # Acknowledge active conditions
        has_diabetes = False
        has_hypertension = False
        has_asthma = False
        has_low_bp = False
        
        profile_summary = ""
        if patient_profile:
            username = patient_profile.get('username', 'Patient')
            gender = patient_profile.get('gender', 'Unknown')
            dob = patient_profile.get('date_of_birth', 'Unknown')
            history = patient_profile.get('medical_history', '')
            conditions = patient_profile.get('conditions', [])
            
            cond_names = [c['condition_name'].lower() for c in conditions]
            has_diabetes = any('diabet' in c for c in cond_names) or 'diabet' in history.lower()
            has_hypertension = any('hyper' in c or 'pressure' in c for c in cond_names) or 'hyper' in history.lower()
            has_asthma = any('asthma' in c for c in cond_names) or 'asthma' in history.lower()
            has_low_bp = any('bp' in c or 'blood' in c for c in cond_names) or 'low bp' in history.lower()
            
            cond_str = ", ".join(c['condition_name'] for c in conditions) if conditions else "None logged"
            profile_summary = f"Personalized for: **{username}** ({gender}, DOB: {dob})\n*Logged conditions:* {cond_str}\n\n"

        if not context_chunks or all(c['score'] < 0.05 for c in context_chunks):
            return (
                f"### Clinical Assessment & Guidance\n\n"
                f"{profile_summary}"
                f"**No specific clinical guideline matches this request in the active knowledge base.**\n\n"
                f"Please follow standard health practices and consult with a primary care physician for diagnostic assessments. "
                f"If you are experiencing any acute severe symptoms (such as sudden shortness of breath, severe chest pain, or vision loss), "
                f"please contact emergency services immediately."
            )

        citations = []
        guidelines_summary = []
        
        for i, chunk in enumerate(context_chunks):
            source = chunk['source_title']
            section = chunk['section']
            clean_text = re.sub(r'^(#+|\-\s+|##\s+)', '', chunk['text'], flags=re.MULTILINE)
            lines = [line.strip() for line in clean_text.split('\n') if line.strip()]
            
            guidelines_summary.append(f"#### Guidelines from {source} (Section: {section}):")
            for line in lines[:4]:
                guidelines_summary.append(f"- {line}")
            
            citations.append(f"[{i+1}] Clinical Guideline: *{source}* (Section: {section})")

        # Personalization insights based on user profile conditions
        personalization_notes = []
        if has_diabetes and ("blood pressure" in query.lower() or "hypertension" in query.lower()):
            personalization_notes.append(
                "**Clinical Profile Insight**: Because you have **Diabetes** logged in your health profile, "
                "hypertension guidelines explicitly state that **ACE inhibitors or ARBs** (e.g. Lisinopril, Losartan) "
                "are strongly recommended as first-line therapy to provide renal protection. Thiazide diuretics are less preferred."
            )
        elif has_diabetes and ("glucose" in query.lower() or "hba1c" in query.lower() or "metformin" in query.lower()):
            personalization_notes.append(
                "**Clinical Profile Insight**: Since you have **Diabetes** logged, glycemic guidelines suggest keeping your "
                "preprandial capillary glucose between 80–130 mg/dL and HbA1c < 7.0%. Metformin is the first-line medication "
                "unless renal functions are compromised (eGFR < 30)."
            )
        
        if has_asthma and ("cough" in query.lower() or "breath" in query.lower() or "inhaler" in query.lower()):
            personalization_notes.append(
                "**Clinical Profile Insight**: Because you have **Asthma** logged in your profile, your symptoms may indicate "
                "airway inflammation. Guidelines recommend using an Inhaled Corticosteroid (ICS) combined with Formoterol "
                "as-needed for rescue relief rather than a SABA (Albuterol) alone, to prevent asthma exacerbations."
            )

        if has_low_bp and ("dizzy" in query.lower() or "blood pressure" in query.lower() or "bp" in query.lower()):
            personalization_notes.append(
                "**Clinical Profile Insight**: Because you have **Low BP** logged, you should monitor for orthostatic hypotension. "
                "Avoid sudden standing, maintain proper hydration, and consult your primary care doctor if symptoms like dizziness persist."
            )

        personalization_section = ""
        if personalization_notes:
            personalization_section = "### Personalized Clinical Profile Insights\n" + "\n".join(personalization_notes) + "\n\n"

        response = (
            "### Clinical Assessment & Guidance\n\n"
            f"{profile_summary}"
            f"{personalization_section}"
            "### Clinical Guideline Recommendations\n"
            + "\n".join(guidelines_summary) + "\n\n"
            "### Supporting Sources:\n"
            + "\n".join(f"- {cite}" for cite in citations) + "\n\n"
            "*Disclaimer: This AI recommendations assistant is a guidance tool based on clinical documents. "
            "Please consult a certified healthcare professional to review medications and diagnostic changes.*"
        )
        return response

    def generate_response(self, query, user=None, top_k=2):
        """Coordinates retrieval and prompt generation. Tailors the LLM prompt or fallback based on the User profile."""
        # 1. Retrieve guidelines
        retrieved_chunks = self.retrieve(query, top_k=top_k)
        
        # 2. Get Patient Profile context
        patient_profile = None
        if user:
            patient_profile = user.to_dict()
            # Fetch active conditions list
            patient_profile['conditions'] = [c.to_dict() for c in user.conditions]

        # 3. Construct prompt for LLM
        context_str = ""
        for i, chunk in enumerate(retrieved_chunks):
            context_str += f"[Source {i+1}]: {chunk['source_title']} - {chunk['section']}\n"
            context_str += f"Content: {chunk['text']}\n\n"

        patient_profile_str = "None logged."
        if patient_profile:
            conds = ", ".join(c['condition_name'] for c in patient_profile['conditions'])
            patient_profile_str = (
                f"Username: {patient_profile['username']}\n"
                f"Gender: {patient_profile['gender']}\n"
                f"DOB: {patient_profile['date_of_birth']}\n"
                f"General Medical History: {patient_profile['medical_history']}\n"
                f"Logged Conditions/Vitals: {conds or 'None logged.'}"
            )

        prompt = f"""You are a professional, empathetic clinical AI Assistant. A patient is consulting you about their health concerns.
Use the following clinical guidelines context and the patient's personal medical profile to answer their query.

Patient Profile Context:
{patient_profile_str}

Clinical Guidelines Reference Context:
{context_str or "No matching reference clinical guidelines found."}

Patient Question:
{query}

Instructions:
1. Provide a clear, supportive, and guideline-backed response.
2. Tailor your advice to the patient's logged medical conditions (e.g. if they have Diabetes, take that into account for blood pressure or medication recommendations based on the guidelines).
3. Explicitly state how their active conditions influenced this clinical recommendation (if applicable).
4. Cite the reference guidelines (e.g. "[Source 1]") where appropriate.
5. Provide a safety disclaimer telling them to consult their physician.
6. If the context does not contain the answer, state "No specific clinical guideline matches this request in the active knowledge base."

Answer:"""

        # 4. Synthesize (Gemini or Local Fallback)
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key and api_key.strip():
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                return response.text, retrieved_chunks
            except Exception as e:
                print(f"Error calling Gemini: {e}. Falling back to local synthesizer.")
                local_resp = self.local_synthesize(query, retrieved_chunks, patient_profile)
                return local_resp, retrieved_chunks
        else:
            local_resp = self.local_synthesize(query, retrieved_chunks, patient_profile)
            return local_resp, retrieved_chunks

# Single global instance
rag_engine = RAGEngine()
