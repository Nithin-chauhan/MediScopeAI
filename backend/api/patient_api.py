from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils import auth, logger

router = APIRouter(prefix="/api/patient", tags=["patient"])

@router.post("/add", response_model=schemas.PatientResponse)
def add_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    new_patient = models.Patient(**patient.dict())
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    logger.log_activity(db, current_user.email, "Add Patient", f"Added patient {patient.name}")
    return new_patient

@router.get("/all", response_model=List[schemas.PatientResponse])
def get_all_patients(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    return db.query(models.Patient).all()

@router.get("/{id}", response_model=schemas.PatientResponse)
def get_patient(id: int, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.patch("/{id}", response_model=schemas.PatientResponse)
def update_patient(id: int, patient_update: dict, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    for key, value in patient_update.items():
        if hasattr(patient, key) and key != "id":
            setattr(patient, key, value)
            
    db.commit()
    db.refresh(patient)
    logger.log_activity(db, current_user.email, "Update Patient", f"Updated patient ID {id}")
    return patient

@router.get("/{id}/history")
def get_patient_history(id: int, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all predictions for this patient, ordered by date
    preds = db.query(models.Prediction).filter(models.Prediction.patient_id == id).order_by(models.Prediction.created_at.asc()).all()
    return preds

@router.get("/{id}/details")
def get_patient_full_details(id: int, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get recent appointments
    appts = db.query(models.Appointment).filter(models.Appointment.patient_id == id).order_by(models.Appointment.appointment_date.desc()).all()
    
    # Get recent lab reports
    if hasattr(models, 'LabReport'):
        reports = db.query(models.LabReport).filter(models.LabReport.patient_id == id).order_by(models.LabReport.created_at.desc()).all()
    else:
        reports = []

    # Mock timeline
    timeline = []
    for a in appts:
        timeline.append({
            "date": a.appointment_date.strftime("%d %b %Y"),
            "time": a.time_slot or a.appointment_date.strftime("%I:%M %p"),
            "title": "Consultation",
            "desc": f"Visited {a.department or 'General'} department",
            "type": "consultation"
        })
    if not timeline:
        timeline = [
            { "date": '15 May 2024', "time": '10:30 AM', "title": 'Cardiology Consultation', "desc": 'Routine checkup with Dr. Sarah Jenkins. Blood pressure elevated.', "type": 'consultation' },
            { "date": '12 May 2024', "time": '02:15 PM', "title": 'Blood Test Report', "desc": 'Complete Blood Count (CBC) and Lipid Profile results uploaded.', "type": 'lab' },
            { "date": '01 Apr 2024', "time": '09:00 AM', "title": 'Initial Registration', "desc": 'Patient registered at Outpatient Department.', "type": 'general' }
        ]

    return {
        "patient": patient,
        "vitals": {
            "bloodPressure": patient.blood_pressure or "120/80",
            "heartRate": patient.pulse or 72,
            "weight": patient.weight or 75.5,
            "bloodSugar": "95 mg/dL",
            "temperature": "98.6°F"
        },
        "timeline": timeline
    }

@router.delete("/delete/{id}")
def delete_patient(id: int, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    db.delete(patient)
    db.commit()
    logger.log_activity(db, current_user.email, "Delete Patient", f"Deleted patient ID {id}")
    return {"msg": "Patient deleted successfully"}
