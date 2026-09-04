import json
import pandas as pd
from backend.orm import models
from backend.ml import model_loader
from backend.services.doctor_allocator import allocate_doctor
from backend.services.report_service import generate_report

def get_risk_level(prob: float) -> str:
    if prob <= 0.25:
        return "LOW"
    elif prob <= 0.50:
        return "MEDIUM"
    elif prob <= 0.75:
        return "HIGH"
    return "CRITICAL"

def generate_recommendations(disease: str, risk: str) -> list:
    base = []
    if disease == "Diabetes":
        if risk in ["HIGH", "CRITICAL"]:
            base = ["Consult an endocrinologist immediately.", "Monitor blood sugar daily.", "Strictly avoid simple carbohydrates."]
        else:
            base = ["Maintain a balanced diet.", "Regular exercise (30 mins/day).", "Annual checkups."]
    elif disease == "Heart Disease":
        if risk in ["HIGH", "CRITICAL"]:
            base = ["Immediate consultation with a cardiologist.", "Avoid strenuous physical stress.", "Low sodium diet."]
        else:
            base = ["Routine ECG checkup.", "Maintain healthy cholesterol levels."]
    elif disease == "Kidney Disease":
        if risk in ["HIGH", "CRITICAL"]:
            base = ["Urgent nephrologist visit.", "Strict fluid and sodium management.", "Prepare for possible dialysis discussion."]
        else:
            base = ["Stay hydrated.", "Monitor blood pressure.", "Limit protein intake slightly."]
    elif disease == "Liver Disease":
        if risk in ["HIGH", "CRITICAL"]:
            base = ["See a hepatologist.", "Complete abstinence from alcohol.", "Low fat diet."]
        else:
            base = ["Moderate or avoid alcohol.", "Avoid unnecessary medications."]
    return base

def handle_prediction(db, patient, disease_name, input_dict, feature_cols, sanity_check_fn):
    # Load ML
    model_key = disease_name.lower().replace(" disease", "")
    try:
        model = model_loader.load_model(model_key)
        scaler = model_loader.load_scaler(model_key)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"ML Model for {disease_name} not found or failed to load. Ensure the model is trained and placed in the ml/models directory. Error: {e}")
    
    
    # Predict
    inp_df = pd.DataFrame([input_dict], columns=feature_cols)
    scaled = scaler.transform(inp_df)
    prob_raw = float(model.predict_proba(scaled)[0][1])
    
    # Sanity Check
    prob_adj = sanity_check_fn(prob_raw, input_dict)
    
    risk_level = get_risk_level(prob_adj)
    prediction_result = "Positive" if prob_adj > 0.5 else "Negative"
    
    # Allocate doctor if positive
    assigned_doc = None
    if prediction_result == "Positive" or prob_adj > 0.4:
        assigned_doc = allocate_doctor(db, disease_name, prob_adj)
        
    recs = generate_recommendations(disease_name, risk_level)
    
    # Save to DB
    pred = models.Prediction(
        patient_id=patient.id,
        disease=disease_name,
        probability=prob_adj,
        risk_level=risk_level,
        prediction_result=prediction_result,
        doctor_id=assigned_doc.id if assigned_doc else None,
        doctor_name=assigned_doc.name if assigned_doc else None,
        doctor_email=assigned_doc.email if assigned_doc else None,
        input_data=json.dumps(input_dict),
        recommendations=json.dumps(recs)
    )
    db.add(pred)
    db.flush()
    
    # Generate Report
    report_path = generate_report(patient, pred, recs, input_dict)
    pred.report_path = report_path
    db.commit()
    db.refresh(pred)
    
    # Send Automated Critical Alert
    if risk_level == "CRITICAL" and assigned_doc and assigned_doc.email:
        import threading
        from backend.utils.email_service import send_critical_alert
        email_thread = threading.Thread(
            target=send_critical_alert,
            args=(assigned_doc.email, patient.name, disease_name, prob_adj, report_path)
        )
        email_thread.start()
    
    return pred
