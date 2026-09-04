from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.database import engine, Base
from backend.api import auth_api, doctor_api, patient_api, prediction_api, analytics_api
from backend.api import opd_ipd_api, billing_finance_api, pharmacy_inventory_api, hr_api, ai_services
from backend.create_admin import create_admin

# Create DB Tables
Base.metadata.create_all(bind=engine)
create_admin()

app = FastAPI(title="MediScope AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_api.router)
app.include_router(doctor_api.router)
app.include_router(patient_api.router)
app.include_router(prediction_api.router)
app.include_router(analytics_api.router)
app.include_router(opd_ipd_api.router)
app.include_router(billing_finance_api.router)
app.include_router(pharmacy_inventory_api.router)
app.include_router(hr_api.router)
app.include_router(ai_services.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MediScope AI API"}
