from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils.auth import get_current_user, RequireRole

router = APIRouter(prefix="/api/clinical", tags=["Clinical (OPD/IPD)"])

# Appointments (OPD)
@router.post("/appointments", response_model=schemas.AppointmentResponse, dependencies=[Depends(RequireRole([models.RoleEnum.RECEPTIONIST.value, models.RoleEnum.SUPER_ADMIN.value, models.RoleEnum.DOCTOR.value]))])
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    db_appointment = models.Appointment(**appointment.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.get("/appointments", response_model=List[schemas.AppointmentResponse])
def get_appointments(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(models.Appointment).all()

class StatusUpdateRequest(schemas.BaseModel):
    status: str

@router.patch("/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: int, req: StatusUpdateRequest, db: Session = Depends(get_db), current_user = Depends(RequireRole([models.RoleEnum.DOCTOR.value, models.RoleEnum.SUPER_ADMIN.value]))):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    appt.status = req.status
    db.commit()
    db.refresh(appt)
    return {"message": "Status updated successfully", "status": appt.status}

@router.get("/appointments/calendar")
def get_calendar_events(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from sqlalchemy.orm import joinedload
    appts = db.query(models.Appointment).options(joinedload(models.Appointment.patient), joinedload(models.Appointment.doctor)).all()
    events = []
    for a in appts:
        from datetime import timedelta
        start = a.appointment_date
        patient_name = a.patient.name if a.patient else f"Unknown Patient"
        doctor_name = a.doctor.name if a.doctor else f"Unknown Doctor"
        
        events.append({
            "id": a.id,
            "title": f"Consultation - {patient_name}",
            "start": start.isoformat(),
            "end": (start + timedelta(minutes=45)).isoformat(), # Default 45 min slot
            "type": a.type or "Consultation",
            "patientName": patient_name,
            "doctorName": f"Dr. {doctor_name}"
        })
    return events

@router.get("/opd/queue")
def get_opd_queue(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from sqlalchemy.orm import joinedload
    from datetime import date
    
    # Ideally filter by date.today(), for now return recent ones to show data
    appts = db.query(models.Appointment).options(
        joinedload(models.Appointment.patient), 
        joinedload(models.Appointment.doctor)
    ).order_by(models.Appointment.appointment_date.desc()).limit(20).all()
    
    queue_data = []
    for a in appts:
        patient_name = a.patient.name if a.patient else "Unknown Patient"
        doctor_name = a.doctor.name if a.doctor else "Unknown Doctor"
        
        status_mapping = {
            "Scheduled": "Waiting",
            "In Progress": "In Consultation",
            "Completed": "Completed"
        }
        
        # map status
        status = status_mapping.get(a.status, "Waiting")
        if a.status == "Waiting" or a.status == "In Consultation":
            status = a.status
            
        queue_data.append({
            "id": str(a.id),
            "patient_id": a.patient_id,
            "patient": patient_name,
            "doctor": doctor_name,
            "time": a.time_slot or (a.appointment_date.strftime("%I:%M %p") if a.appointment_date else "00:00"),
            "status": status,
            "type": a.type or "Consultation",
            "priority": "High" if a.type == "Emergency" else "Normal"
        })
    return queue_data

# IPD Admissions
@router.post("/admissions", response_model=schemas.IPDAdmissionResponse, dependencies=[Depends(RequireRole([models.RoleEnum.RECEPTIONIST.value, models.RoleEnum.NURSE.value, models.RoleEnum.SUPER_ADMIN.value]))])
def create_admission(admission: schemas.IPDAdmissionCreate, db: Session = Depends(get_db)):
    # Check bed availability
    bed = db.query(models.Bed).filter(models.Bed.id == admission.bed_id).first()
    if not bed or bed.status != "Available":
        raise HTTPException(status_code=400, detail="Bed not available")
    
    db_admission = models.IPDAdmission(**admission.model_dump())
    bed.status = "Occupied"
    db.add(db_admission)
    db.commit()
    db.refresh(db_admission)
    return db_admission

@router.get("/admissions", response_model=List[schemas.IPDAdmissionResponse])
def get_admissions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(models.IPDAdmission).all()

@router.delete("/beds/{bed_id}/clear")
def clear_bed(bed_id: int, db: Session = Depends(get_db), current_user = Depends(RequireRole([models.RoleEnum.RECEPTIONIST.value, models.RoleEnum.NURSE.value, models.RoleEnum.SUPER_ADMIN.value]))):
    bed = db.query(models.Bed).filter(models.Bed.id == bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    active_admission = db.query(models.IPDAdmission).filter(
        models.IPDAdmission.bed_id == bed_id, 
        models.IPDAdmission.status == "Admitted"
    ).first()
    
    if active_admission:
        db.delete(active_admission)
    
    bed.status = "Available"
    db.commit()
    return {"message": "Bed cleared successfully"}

@router.get("/ipd/overview")
def get_ipd_overview(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    from sqlalchemy.orm import joinedload
    
    total_beds = db.query(models.Bed).count()
    occupied_beds = db.query(models.Bed).filter(models.Bed.status == 'Occupied').count()
    maintenance_beds = db.query(models.Bed).filter(models.Bed.status == 'Maintenance').count()
    available_beds = total_beds - occupied_beds - maintenance_beds

    wards = db.query(models.Ward).options(
        joinedload(models.Ward.rooms).joinedload(models.Room.beds).joinedload(models.Bed.admissions).joinedload(models.IPDAdmission.patient)
    ).all()
    
    floors_data = []
    for w in wards:
        ward_beds = []
        for r in w.rooms:
            for b in r.beds:
                active_admission = next((a for a in b.admissions if a.status == "Admitted"), None)
                patient_name = active_admission.patient.name if active_admission and active_admission.patient else None
                patient_id = active_admission.patient.id if active_admission and active_admission.patient else None
                ward_beds.append({
                    "db_id": b.id,
                    "id": b.bed_number,
                    "status": b.status,
                    "patientName": patient_name,
                    "patientId": patient_id,
                    "admissionDate": active_admission.admission_date.strftime("%d %b %Y") if active_admission else None
                })
        
        floors_data.append({
            "id": w.id,
            "name": f"{w.name} ({w.floor})",
            "totalBeds": len(ward_beds),
            "occupied": len([b for b in ward_beds if b['status'] == 'Occupied']),
            "beds": ward_beds
        })

    return {
        "stats": {
            "total": total_beds,
            "occupied": occupied_beds,
            "available": available_beds,
            "maintenance": maintenance_beds
        },
        "floors": floors_data
    }

# Clinical Notes (Daily Progress)
class ClinicalNoteCreate(schemas.BaseModel):
    patient_id: int
    doctor_id: int
    type: str
    reference_id: int = None
    note_text: str

@router.get("/notes/{patient_id}")
def get_clinical_notes(patient_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    notes = db.query(models.ClinicalNote).filter(models.ClinicalNote.patient_id == patient_id).order_by(models.ClinicalNote.created_at.desc()).all()
    result = []
    for n in notes:
        doctor_name = n.doctor.name if n.doctor else "Unknown Doctor"
        result.append({
            "id": n.id,
            "patient_id": n.patient_id,
            "doctor_name": f"Dr. {doctor_name}",
            "type": n.type,
            "reference_id": n.reference_id,
            "note_text": n.note_text,
            "created_at": n.created_at.isoformat()
        })
    return result

@router.post("/notes")
def add_clinical_note(note: ClinicalNoteCreate, db: Session = Depends(get_db), current_user = Depends(RequireRole([models.RoleEnum.DOCTOR.value, models.RoleEnum.SUPER_ADMIN.value]))):
    new_note = models.ClinicalNote(
        patient_id=note.patient_id,
        doctor_id=note.doctor_id,
        type=note.type,
        reference_id=note.reference_id,
        note_text=note.note_text
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return {"message": "Note added successfully", "id": new_note.id}
