import os
import json
import tempfile
from google import genai
from fastapi import HTTPException
from backend.utils.logger import log_activity

def extract_metrics_from_image(file_bytes: bytes, disease_type: str, mime_type: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server.")
        
    client = genai.Client(api_key=api_key.strip())
    
    try:
        # Save bytes to a temporary file
        ext = ".pdf" if "pdf" in mime_type else ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        # Upload using the robust Files API
        uploaded_file = client.files.upload(file=tmp_path, config={'mime_type': mime_type})
        
        prompt = f"""
        You are a medical AI assistant. Extract the patient metrics from this lab report for a {disease_type} prediction.
        Return ONLY a raw JSON object (no markdown, no backticks, no text). 
        If a metric is missing or cannot be found, use null.
        Ensure keys exactly match standard metrics for {disease_type}. 
        For example, if Diabetes: Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age.
        If Heart: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal.
        If Kidney: age, bp, sg, al, su, rbc, pc, pcc, ba, bgr, bu, sc, sod, pot, hemo, pcv, wc, rc, htn, dm, cad, appet, pe, ane.
        If Liver: Age, Gender, Total_Bilirubin, Direct_Bilirubin, Alkaline_Phosphotase, Alamine_Aminotransferase, Aspartate_Aminotransferase, Total_Protiens, Albumin, Albumin_and_Globulin_Ratio.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, uploaded_file]
        )
        
        # Cleanup temp file and Gemini file
        try:
            client.files.delete(name=uploaded_file.name)
            os.remove(tmp_path)
        except:
            pass
        
        # Clean response string to parse JSON
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
            
        return json.loads(text.strip())
    except Exception as e:
        print(f"Vision API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Vision API Error: {str(e)}")
