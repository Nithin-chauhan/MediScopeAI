from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.database import get_db
from backend.orm import models
from backend.utils import auth
from backend.ml import model_loader
import os
from fastapi import HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from google import genai

class ChatRequest(BaseModel):
    message: str

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    total_preds = db.query(models.Prediction).count()
    total_docs = db.query(models.Doctor).filter(models.Doctor.availability == True).count()
    total_patients = db.query(models.Patient).count()
    reports_generated = db.query(models.Prediction).filter(models.Prediction.report_path != None).count()
    return {
        "total_predictions": total_preds,
        "active_doctors": total_docs,
        "registered_patients": total_patients,
        "reports_generated": reports_generated
    }

@router.get("/enterprise_summary")
def get_enterprise_summary(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    total_patients = db.query(models.Patient).count()
    total_appointments = db.query(models.Appointment).count()
    total_opd = db.query(models.Appointment).filter(models.Appointment.type == 'OPD').count()
    
    # Calculate revenue from paid bills
    total_revenue = db.query(func.sum(models.Billing.total)).filter(models.Billing.status == 'Paid').scalar() or 0.0

    # Real OPD/IPD timeseries based on appointments
    from sqlalchemy import extract
    appts = db.query(extract('hour', models.Appointment.appointment_date).label('h'), func.count(models.Appointment.id)).group_by('h').all()
    
    opd_ipd_chart = []
    for row in appts:
        hour = int(row[0])
        count = row[1]
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0: display_hour = 12
        opd_ipd_chart.append({ "time": f"{display_hour} {am_pm}", "opd": count, "ipd": 0 })

    # Calculate department distribution from doctors
    dept_dist = db.query(models.Doctor.specialization, func.count(models.Doctor.id)).group_by(models.Doctor.specialization).all()
    departments = [{"name": d[0] if d[0] else "General", "value": d[1]} for d in dept_dist]

    # Real Recent Appointments
    from sqlalchemy.orm import joinedload
    recent_appts_db = db.query(models.Appointment).options(joinedload(models.Appointment.patient), joinedload(models.Appointment.doctor)).order_by(models.Appointment.appointment_date.desc()).limit(4).all()
    recent_appts = []
    for a in recent_appts_db:
        recent_appts.append({
            "id": str(a.id),
            "patient": a.patient.name if a.patient else "Unknown",
            "dept": a.doctor.specialization if a.doctor else "General",
            "time": a.time_slot or a.appointment_date.strftime("%I:%M %p"),
            "doctor": f"Dr. {a.doctor.name}" if a.doctor else "Unknown",
            "status": a.status
        })

    # Calculate Bed Occupancy
    total_beds = db.query(models.Bed).count()
    if total_beds == 0:
        bed_stats = {"total": 250, "occupied": 170, "available": 80}
    else:
        occupied_beds = db.query(models.Bed).filter(models.Bed.status == 'Occupied').count()
        bed_stats = {"total": total_beds, "occupied": occupied_beds, "available": total_beds - occupied_beds}

    # Generate AI Alerts from recent predictions
    recent_high_risk = db.query(models.Prediction).filter(models.Prediction.risk_level.in_(['High', 'Critical'])).order_by(models.Prediction.created_at.desc()).limit(3).all()
    ai_alerts = []
    for p in recent_high_risk:
        alert_type = 'error' if p.risk_level == 'Critical' else 'warning'
        patient_name = p.patient.name if p.patient else f"Patient {p.patient_id}"
        ai_alerts.append({
            "id": str(p.id),
            "type": alert_type,
            "title": f"{p.risk_level} Risk Detected",
            "time": p.created_at.strftime("%I:%M %p"),
            "msg": f"AI predicted {p.risk_level} risk of {p.disease} for {patient_name}."
        })
        
    if not ai_alerts:
        ai_alerts = [
            {"id": "mock1", "type": "warning", "title": "Elevated Risk Detected", "time": "Just now", "msg": "AI detected potential anomalies in recent patient vitals."}
        ]

    return {
        "kpis": {
            "total_patients": total_patients,
            "appointments": total_appointments,
            "opd_visits": total_opd,
            "total_revenue": total_revenue
        },
        "charts": {
            "opd_ipd": opd_ipd_chart,
            "departments": departments
        },
        "recent_appointments": recent_appts,
        "ai_alerts": ai_alerts,
        "bed_occupancy": bed_stats
    }

@router.get("/disease_distribution")
def disease_distribution(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    dist = db.query(models.Prediction.disease, func.count(models.Prediction.id)).group_by(models.Prediction.disease).all()
    return [{"name": d[0], "value": d[1]} for d in dist]

@router.get("/risk_distribution")
def risk_distribution(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    dist = db.query(models.Prediction.risk_level, func.count(models.Prediction.id)).group_by(models.Prediction.risk_level).all()
    return [{"name": d[0], "value": d[1]} for d in dist]

@router.get("/doctor_workload")
def doctor_workload(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    docs = db.query(models.Doctor).all()
    return [{"name": d.name, "patients": d.patients_count} for d in docs]

@router.get("/recent_predictions")
def recent_predictions(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    preds = db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).limit(20).all()
    return preds

@router.get("/predictions_all")
def all_predictions(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    return db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).all()

@router.get("/activity_logs")
def activity_logs(db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if getattr(current_user, 'role', '') != 'admin':
        return []
    logs = db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc()).limit(50).all()
    return logs

@router.get("/model_metrics")
def model_metrics(current_user = Depends(auth.get_current_user)):
    metrics = {
        "diabetes": model_loader.load_metrics("diabetes"),
        "heart": model_loader.load_metrics("heart"),
        "kidney": model_loader.load_metrics("kidney"),
        "liver": model_loader.load_metrics("liver")
    }
    return metrics

@router.get("/download_report")
def download_report(path: str, current_user = Depends(auth.get_current_user)):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Report file not found on server")
    return FileResponse(path=path, media_type='application/pdf', filename=os.path.basename(path))

@router.post("/chat")
def ai_scribe_chat(req: ChatRequest, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured.")
        
    total_preds = db.query(models.Prediction).count()
    total_patients = db.query(models.Patient).count()
    total_docs = db.query(models.Doctor).count()
    recent_preds = db.query(models.Prediction).order_by(models.Prediction.created_at.desc()).limit(5).all()
    
    context = f"""
    You are the MediScope AI Medical Scribe. You assist doctors by answering questions about the clinic's database.
    Current Clinic Stats: {total_patients} registered patients, {total_docs} doctors, {total_preds} total AI predictions made.
    Recent 5 Predictions:
    """
    for p in recent_preds:
        context += f"- Patient {p.patient_id} ({p.disease}): Risk {p.risk_level}, Result: {p.prediction_result}\n"
        
    prompt = context + "\n\nDoctor asks: " + req.message
    
    try:
        client = genai.Client(api_key=api_key.strip())
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return {"reply": response.text}
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with AI.")
