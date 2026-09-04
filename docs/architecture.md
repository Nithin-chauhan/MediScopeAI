# MediScopeAI: Enterprise Architecture Document

## 1. System Overview

MediScopeAI is structured as a decoupled, microservice-ready system. 
- **Frontend (Presentation Layer):** A Single Page Application (SPA) built with React 19. It communicates with the backend exclusively via RESTful JSON APIs over HTTP.
- **Backend (Business Logic Layer):** A FastAPI server handling routing, AI service orchestration, machine learning inference, and database transactions.
- **Data Layer:** A MySQL relational database.

## 2. Database Design (Entity-Relationship)

The database follows 3rd Normal Form (3NF) to ensure data integrity across the Hospital Management System.

### Core Tables
1. **Users (Authentication Base):** Stores `email`, `hashed_password`, and `role`. 
2. **Employees (HR Module):** `user_id` (FK), `department`, `designation`, `salary`.
3. **Patients:** Demographics, blood group, allergies.
4. **Appointments (OPD Module):** Links `patient_id` (FK) and `doctor_id` (FK) with an `appointment_date` and `status`.
5. **Wards, Rooms, & Beds (IPD Module):** Hierarchical relational tables representing physical hospital infrastructure.
6. **IPD Admissions:** Links a `Patient` to a `Bed` and `Doctor` over a specific date range.
7. **Billing (Finance Module):** Links to `Patient`. Stores line items, discounts, taxes, and payment status.
8. **Medicines (Pharmacy Module):** Tracks inventory stock, price, and expiration dates.
9. **Predictions (ML Module):** Archives historical AI predictions linked to a `Patient`.

## 3. Role-Based Access Control (RBAC)

MediScopeAI utilizes stateless JSON Web Tokens (JWT). When a user logs in, the backend encrypts their `email` and `role` into a JWT. 

### Middleware Security (`RequireRole`)
The FastAPI backend uses Dependency Injection to enforce security. 
For example, the Pharmacy API route uses:
```python
dependencies=[Depends(RequireRole([RoleEnum.PHARMACIST.value, RoleEnum.SUPER_ADMIN.value]))]
```
If a Receptionist attempts to call this API, the middleware intercepts the request before it reaches the controller, reads the JWT, notices the mismatch, and instantly returns a `403 Forbidden` error.

## 4. Artificial Intelligence Architecture

### Multimodal Extraction
When a PDF lab report is uploaded, it is sent to Google's `gemini-flash-lite-latest` vision model with a strict prompt forcing a structured JSON output matching our Pydantic schemas.

### Clinical AI Assistants
- **Drug Interaction Checker:** Takes arrays of medications and conditions, and generates warnings based on standard pharmacological data.
- **Clinical Guideline Assistant:** Inputs symptoms and outputs WHO/CDC standard first-line differential diagnoses.

### Machine Learning Inference
Scikit-Learn/XGBoost `.pkl` models are stored locally. To prevent I/O bottlenecks (reading large files from the hard drive on every request), `predict_helper.py` wraps the model loader in Python's `@lru_cache`. The model is loaded into RAM once, providing sub-millisecond inference times for all subsequent API requests.
