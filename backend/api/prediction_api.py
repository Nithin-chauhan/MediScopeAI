from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils import auth, logger
from backend.api import predict_helper, vision_helper
from fastapi import File, UploadFile, Form

router = APIRouter(prefix="/api/predict", tags=["prediction"])

def get_patient_or_404(db: Session, patient_id: int):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/extract_metrics")
async def extract_metrics(disease_type: str = Form(...), file: UploadFile = File(...), current_user = Depends(auth.get_current_user)):
    try:
        contents = await file.read()
        mime_type = file.content_type
        metrics = vision_helper.extract_metrics_from_image(contents, disease_type, mime_type)
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in extract_metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract metrics from image.")

@router.post("/diabetes", response_model=schemas.PredictionResponse)
def predict_diabetes(req: schemas.DiabetesRequest, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = get_patient_or_404(db, req.patient_id)
    
    def sanity_check(prob, inp):
        if inp['Glucose'] < 90 and prob > 0.20:
            return min(prob, 0.15)
        if inp['Age'] < 35 and inp['Glucose'] < 100 and inp['BMI'] < 28 and prob > 0.25:
            return min(prob, 0.20)
        return prob
        
    cols = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age']
    inp_dict = req.dict(exclude={'patient_id'})
    
    pred = predict_helper.handle_prediction(db, patient, "Diabetes", inp_dict, cols, sanity_check)
    logger.log_activity(db, current_user.email, "Diabetes Prediction", f"Predicted for patient {patient.name}")
    return pred

@router.post("/heart", response_model=schemas.PredictionResponse)
def predict_heart(req: schemas.HeartRequest, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = get_patient_or_404(db, req.patient_id)
    
    def sanity_check(prob, inp):
        if inp['sex'] == 0 and inp['age'] < 45 and inp['ca'] == 0 and inp['oldpeak'] < 1 and inp['exang'] == 0:
            return min(prob, 0.25)
        if inp['ca'] == 0 and inp['oldpeak'] == 0 and inp['exang'] == 0 and prob > 0.35:
            return min(prob, 0.28)
        return prob
        
    cols = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
    inp_dict = req.dict(exclude={'patient_id'})
    
    pred = predict_helper.handle_prediction(db, patient, "Heart Disease", inp_dict, cols, sanity_check)
    logger.log_activity(db, current_user.email, "Heart Prediction", f"Predicted for patient {patient.name}")
    return pred

@router.post("/kidney", response_model=schemas.PredictionResponse)
def predict_kidney(req: schemas.KidneyRequest, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = get_patient_or_404(db, req.patient_id)
    
    def sanity_check(prob, inp):
        if inp['sc'] < 1.5 and inp['hemo'] > 12 and inp['al'] == 0 and prob > 0.30:
            return min(prob, 0.22)
        return prob
        
    cols = ['age', 'bp', 'sg', 'al', 'su', 'rbc', 'pc', 'pcc', 'ba', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc', 'htn', 'dm', 'cad', 'appet', 'pe', 'ane']
    inp_dict = req.dict(exclude={'patient_id'})
    
    # Map categoricals before predicting
    cat_mapping = {'normal': 0, 'abnormal': 1, 'present': 1, 'notpresent': 0, 'yes': 1, 'no': 0, 'good': 1, 'poor': 0}
    mapped_dict = {}
    for k, v in inp_dict.items():
        if isinstance(v, str) and v in cat_mapping:
            mapped_dict[k] = cat_mapping[v]
        else:
            mapped_dict[k] = v
            
    pred = predict_helper.handle_prediction(db, patient, "Kidney Disease", mapped_dict, cols, sanity_check)
    logger.log_activity(db, current_user.email, "Kidney Prediction", f"Predicted for patient {patient.name}")
    return pred

@router.post("/liver", response_model=schemas.PredictionResponse)
def predict_liver(req: schemas.LiverRequest, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    patient = get_patient_or_404(db, req.patient_id)
    
    def sanity_check(prob, inp):
        if inp['Total_Bilirubin'] < 1.2 and inp['Alamine_Aminotransferase'] < 40 and inp['Aspartate_Aminotransferase'] < 40 and inp['Albumin_and_Globulin_Ratio'] > 0.9 and prob > 0.40:
            return min(prob, 0.35)
        return prob
        
    cols = ['Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin', 'Alkaline_Phosphotase', 'Alamine_Aminotransferase', 'Aspartate_Aminotransferase', 'Total_Protiens', 'Albumin', 'Albumin_and_Globulin_Ratio']
    inp_dict = req.dict(exclude={'patient_id'})
    
    mapped_dict = inp_dict.copy()
    mapped_dict['Gender'] = 1 if inp_dict['Gender'] == 'Male' else 0
    
    pred = predict_helper.handle_prediction(db, patient, "Liver Disease", mapped_dict, cols, sanity_check)
    logger.log_activity(db, current_user.email, "Liver Prediction", f"Predicted for patient {patient.name}")
    return pred
