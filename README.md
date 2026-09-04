# MediScopeAI: Enterprise Hospital Management System

![MediScopeAI](https://img.shields.io/badge/Status-Production%20Ready-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688) ![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB)

MediScopeAI is a next-generation, AI-powered Enterprise Hospital Management System (HMS). Originally a machine-learning diagnostic tool, it has been aggressively scaled into a comprehensive SaaS platform supporting Multi-Specialty Clinics, Wards, Pharmacy, Billing, HR, and automated Medical AI Assistants.

## 🚀 Core Features

- **Role-Based Access Control (RBAC):** Strict JWT-based security supporting 12 roles (Super Admin, Doctor, Nurse, Pharmacist, HR, etc.).
- **Multimodal AI Medical Scribe:** Upload physical PDF lab reports, and Google Gemini Multimodal AI will instantly extract clinical metrics to auto-fill patient dashboards.
- **Enterprise Modules:** Complete workflows for OPD (Outpatient), IPD (Inpatient/Wards), Pharmacy Inventory, Billing & Finance, and Human Resources.
- **Clinical AI Assistants:** Features a Drug Interaction Checker and a Clinical Guideline Assistant powered by `gemini-flash-lite-latest`.
- **Machine Learning Diagnostics:** Plug-and-play XGBoost/Scikit-Learn models predicting Diabetes, Heart, Kidney, and Liver disease with hardcoded clinical sanity-checks.

## 🏗️ Architecture

MediScopeAI utilizes a decoupled, microservice-ready architecture:

- **Frontend:** React 19 + Vite. Utilizes `Zustand` for global state (JWTs), `TanStack Query` for server state/caching, and Material UI with a custom Medical Blue Glassmorphism theme.
- **Backend:** FastAPI (Python). Highly asynchronous for fast network I/O with AI services.
- **Database:** Normalized MySQL database accessed via SQLAlchemy ORM.
- **ML Pipeline:** Tabular models are pre-trained, serialized with `joblib`, and loaded into RAM using Python's `@lru_cache` for ultra-low latency inference.

## 🐳 Docker Setup (Recommended)

The entire application is containerized. You do not need Node.js or Python installed locally.

1. **Clone the repository.**
2. **Set up your environment variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=mysql+pymysql://root:admin123@db:3306/mediscope_db
   SECRET_KEY=your_secure_random_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   GEMINI_API_KEY=your_google_ai_studio_api_key
   ```
3. **Run Docker Compose:**
   ```bash
   docker compose up --build
   ```
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:8000
   - **Swagger API Docs:** http://localhost:8000/docs
   - **MySQL Database:** Port 3307 (External), 3306 (Internal)

## ☁️ Cloud Deployment (Render & Vercel)

The repository is pre-configured for automated CI/CD deployments.

### 1. Backend (Render)
Render automatically detects the `render.yaml` configuration in this repository.
1. Connect this GitHub repository to Render as a **Blueprint**.
2. Render will spin up the FastAPI server, install dependencies (including XGBoost models), and provide a public URL.
3. *Note: If using Render's free tier, you may need to switch the environment to Docker using the provided `backend/Dockerfile` to bypass memory limits during `pip install`.*

### 2. Frontend (Vercel)
Vercel handles the React + Vite frontend SPA.
1. Import this GitHub repository into Vercel.
2. Set the **Framework Preset** to `Vite` and **Root Directory** to `frontend`.
3. Add an Environment Variable: `VITE_API_URL = <Your_Render_Backend_URL>/api`.
4. Deploy!

## 📂 Folder Structure

```text
MediScope-AI/
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client with JWT interceptors
│   │   ├── components/     # Reusable UI (Sidebar, Topbar)
│   │   ├── pages/          # Role-based Dashboard Views
│   │   ├── routes/         # ProtectedRoute logic
│   │   ├── store/          # Zustand State Management
│   │   └── theme/          # MUI Glassmorphism Theme
│   └── Dockerfile
├── backend/
│   ├── api/                # FastAPI Routers (opd, hr, pharmacy, ai)
│   ├── ml/                 # .pkl models, scalers, and model_loader.py
│   ├── orm/                # SQLAlchemy Models (models.py)
│   ├── schemas/            # Pydantic Validation Schemas
│   ├── services/           # Business Logic (doctor_allocator, etc.)
│   ├── utils/              # Security (auth.py)
│   └── Dockerfile
└── docker-compose.yml
```

## 🔐 Security Standards

- **Passwords:** Hashed using `bcrypt` via `passlib`. Plain text is never stored.
- **Sessions:** Stateless JSON Web Tokens (JWT) signed with `HS256`.
- **CORS:** Strictly configured via FastAPI middleware to prevent unauthorized cross-origin requests.
- **SQL Injection:** Prevented natively via SQLAlchemy ORM abstraction.
