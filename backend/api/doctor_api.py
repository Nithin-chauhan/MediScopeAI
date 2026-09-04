from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils import auth, logger

router = APIRouter(prefix="/api/doctor", tags=["doctor"])

@router.post("/add", response_model=schemas.DoctorResponse)
def add_doctor(doctor: schemas.DoctorCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_doctor = db.query(models.Doctor).filter(models.Doctor.email == doctor.email).first()
    if db_doctor:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(doctor.password)
    new_doc = models.Doctor(
        name=doctor.name, email=doctor.email, password=hashed_password,
        specialization=doctor.specialization, phone=doctor.phone,
        experience=doctor.experience, availability=doctor.availability
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    logger.log_activity(db, current_user.email, "Add Doctor", f"Added doctor {doctor.name}")
    return new_doc

@router.get("/all", response_model=List[schemas.DoctorResponse])
def get_all_doctors(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    return db.query(models.Doctor).all()

@router.put("/update/{id}", response_model=schemas.DoctorResponse)
def update_doctor(id: int, doctor: schemas.DoctorUpdate, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_doc = db.query(models.Doctor).filter(models.Doctor.id == id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    for key, value in doctor.dict(exclude_unset=True).items():
        setattr(db_doc, key, value)
        
    db.commit()
    db.refresh(db_doc)
    logger.log_activity(db, current_user.email, "Update Doctor", f"Updated doctor ID {id}")
    return db_doc

@router.delete("/delete/{id}")
def delete_doctor(id: int, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_doc = db.query(models.Doctor).filter(models.Doctor.id == id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    db.delete(db_doc)
    db.commit()
    logger.log_activity(db, current_user.email, "Delete Doctor", f"Deleted doctor ID {id}")
    return {"msg": "Doctor deleted successfully"}

@router.put("/toggle/{id}")
def toggle_availability(id: int, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if getattr(current_user, 'role', '') != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_doc = db.query(models.Doctor).filter(models.Doctor.id == id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    db_doc.availability = not db_doc.availability
    db.commit()
    logger.log_activity(db, current_user.email, "Toggle Doctor Availability", f"Toggled availability for doctor ID {id}")
    return {"msg": "Availability toggled", "availability": db_doc.availability}

@router.get("/dashboard")
def doctor_dashboard(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    # In a real app, we'd filter by current_user.id if they are a doctor
    # For now, we aggregate some mock metrics or global metrics
    
    todays_appointments = db.query(models.Appointment).count() # mock for today
    patients_seen = db.query(models.Appointment).filter(models.Appointment.status == 'Completed').count()
    pending_reports = db.query(models.LabReport).filter(models.LabReport.status == 'Pending').count() if hasattr(models, 'LabReport') else 7
    opd_revenue = db.query(func.sum(models.Billing.total)).filter(models.Billing.status == 'Paid', models.Billing.type == 'OPD').scalar() or 0.0

    # Fetch some recent appointments for schedule
    schedule_db = db.query(models.Appointment).order_by(models.Appointment.appointment_date.asc()).limit(5).all()
    schedule = []
    for appt in schedule_db:
        schedule.append({
            "time": appt.time_slot or appt.appointment_date.strftime("%I:%M %p"),
            "patient": appt.patient.name if appt.patient else "Unknown",
            "dept": appt.department or "General"
        })
    if not schedule:
        schedule = [
            { "time": '09:00 AM', "patient": 'John Doe', "dept": 'Cardiology' },
            { "time": '10:00 AM', "patient": 'Jane Smith', "dept": 'Neurology' }
        ]

    # Fetch recent patients
    recent_patients_db = db.query(models.Patient).order_by(models.Patient.created_at.desc()).limit(4).all()
    recent_patients = []
    for i, p in enumerate(recent_patients_db):
        recent_patients.append({
            "name": p.name,
            "status": "Follow up" if i % 2 == 0 else "New Patient",
            "img": str(11 + i)
        })
    if not recent_patients:
        recent_patients = [
            { "name": 'John Doe', "status": 'Follow up', "img": '11' }
        ]

    return {
        "kpis": {
            "todays_appointments": todays_appointments,
            "patients_seen": patients_seen,
            "pending_reports": pending_reports,
            "opd_revenue": opd_revenue
        },
        "schedule": schedule,
        "recent_patients": recent_patients
    }
