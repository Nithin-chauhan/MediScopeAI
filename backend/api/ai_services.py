from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import os
from google import genai
from google.genai import types
from backend.utils.auth import get_current_user, RequireRole
from backend.orm import models

router = APIRouter(prefix="/api/ai", tags=["Enterprise AI Services"])

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY environment variable not set for AI Services.")
    
try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Failed to initialize Gemini Client: {e}")
    client = None

class DrugInteractionRequest(BaseModel):
    medications: list[str]
    patient_conditions: list[str] = []

class ClinicalGuidelineRequest(BaseModel):
    symptoms: list[str]
    patient_age: int
    patient_gender: str

@router.post("/drug-interaction")
async def check_drug_interaction(req: DrugInteractionRequest, current_user = Depends(RequireRole([models.RoleEnum.DOCTOR.value, models.RoleEnum.PHARMACIST.value, models.RoleEnum.SUPER_ADMIN.value]))):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not configured")
    
    prompt = f"""
    You are an expert clinical pharmacologist. 
    Review the following medications for severe drug-drug interactions: {req.medications}
    Consider these patient underlying conditions: {req.patient_conditions}
    
    Provide a concise, bulleted warning of any critical interactions, the mechanism of action, and clinical recommendations.
    Format the response as plain text. Do not provide medical advice to patients, only clinical guidance for doctors.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return {"result": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clinical-guideline")
async def clinical_guideline(req: ClinicalGuidelineRequest, current_user = Depends(RequireRole([models.RoleEnum.DOCTOR.value, models.RoleEnum.SUPER_ADMIN.value]))):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not configured")
        
    prompt = f"""
    You are a Medical AI Assistant operating within an Enterprise Hospital Management System.
    Patient Profile: {req.patient_age} year old {req.patient_gender}.
    Symptoms: {req.symptoms}
    
    Based on standard medical guidelines (e.g., WHO, CDC, AHA), what are the standard differential diagnoses and recommended first-line investigations (labs, imaging)?
    Keep the response strictly professional and bulleted.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return {"result": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import UploadFile, File
import json

import fitz # PyMuPDF

@router.post("/lab-report/analyze")
async def analyze_lab_report(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not configured")
        
    try:
        content = await file.read()
        
        try:
            pdf_doc = fitz.open(stream=content, filetype="pdf")
            extracted_text = ""
            for page in pdf_doc:
                extracted_text += page.get_text()
            pdf_doc.close()
        except Exception as e:
            print(f"Failed to parse PDF: {e}")
            # If not a PDF, maybe it's plain text (for testing/mocking)
            try:
                extracted_text = content.decode('utf-8')
            except:
                raise HTTPException(status_code=400, detail="Invalid PDF file")
            
        prompt = f"""
        You are a medical AI. Extract all laboratory test parameters from the following text and analyze them.
        Provide the output STRICTLY as a JSON object with this exact structure (no markdown, no backticks, just raw JSON):
        {{
            "extracted_parameters": [
                {{"name": "Glucose", "value": "190 mg/dL", "status": "High"}},
                {{"name": "HbA1c", "value": "8.2%", "status": "High"}}
            ],
            "prediction_result": {{
                "disease": "Primary Risk Identified (e.g. Diabetes Risk)",
                "risk_level": "High Risk / Moderate Risk / Low Risk",
                "probability": 85,
                "recommendations": "Actionable medical advice based on the results."
            }}
        }}
        
        The extracted_parameters list should contain all tests found in the text. 'status' should be 'High', 'Low', or 'Normal'.
        Determine the most prominent disease risk from the lab values and provide a single prediction_result.
        
        Lab Report Text:
        {extracted_text}
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        
        json_str = response.text.strip()
        if json_str.startswith("```json"):
            json_str = json_str[7:]
        if json_str.startswith("```"):
            json_str = json_str[3:]
        if json_str.endswith("```"):
            json_str = json_str[:-3]
            
        result = json.loads(json_str.strip())
        result["file_name"] = file.filename
        
        return result
        
    except Exception as e:
        print(f"Error in analyze_lab_report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

class ReportGenerationRequest(BaseModel):
    extracted_parameters: list
    prediction_result: dict
    patient_name: str = "Unknown Patient"

@router.post("/lab-report/generate-pdf")
async def generate_lab_pdf(req: ReportGenerationRequest, current_user = Depends(get_current_user)):
    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Premium Header Background
        c.setFillColorRGB(0.145, 0.388, 0.925) # #2563EB Blue
        c.rect(0, height - 80, width, 80, stroke=0, fill=1)
        
        # Header Text
        c.setFillColorRGB(1, 1, 1) # White
        c.setFont("Helvetica-Bold", 24)
        c.drawString(50, height - 40, "MediScope AI")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 60, "Intelligent Lab Analysis Report")

        # Patient Info Section
        c.setFillColorRGB(0.1, 0.1, 0.1) # Black text
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 120, f"Patient Name: {req.patient_name}")
        from datetime import datetime
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 135, f"Report Date: {datetime.now().strftime('%d %B %Y')}")
        
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.line(50, height - 150, width - 50, height - 150)

        # Extracted Parameters
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, height - 180, "Extracted Lab Parameters")
        
        y = height - 205
        c.setFont("Helvetica", 11)
        for param in req.extracted_parameters:
            name = param.get('name', param.get('label', ''))
            val = param.get('value', '')
            status = param.get('status', param.get('flag', ''))
            
            c.setFillColorRGB(0, 0, 0)
            c.drawString(60, y, f"{name}: {val}")
            
            # Color code status
            if status.lower() == 'high':
                c.setFillColorRGB(0.8, 0, 0) # Red
            elif status.lower() == 'low':
                c.setFillColorRGB(0.8, 0.5, 0) # Orange
            else:
                c.setFillColorRGB(0, 0.6, 0) # Green
            c.drawString(300, y, f"[{status}]")
            y -= 25

        # AI Prediction Section
        y -= 20
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.line(50, y, width - 50, y)
        y -= 30

        c.setFillColorRGB(0.145, 0.388, 0.925)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "MediScope AI Diagnostics")
        
        y -= 25
        pred = req.prediction_result
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(60, y, "Condition Identified:")
        c.setFont("Helvetica", 12)
        c.drawString(200, y, f"{pred.get('disease')}")
        
        y -= 20
        c.setFont("Helvetica-Bold", 12)
        c.drawString(60, y, "Risk Level:")
        
        risk = str(pred.get('risk_level', ''))
        if 'High' in risk or 'Critical' in risk:
            c.setFillColorRGB(0.8, 0, 0)
        elif 'Low' in risk:
            c.setFillColorRGB(0, 0.6, 0)
        else:
            c.setFillColorRGB(0.8, 0.5, 0)
            
        c.drawString(200, y, f"{risk} ({pred.get('probability')}%)")
        
        y -= 30
        c.setFillColorRGB(0, 0, 0)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(60, y, "Clinical Recommendation:")
        y -= 20
        
        # Simple word wrap for recommendations
        import textwrap
        c.setFont("Helvetica", 11)
        recs = textwrap.wrap(pred.get('recommendations', ''), width=85)
        for line in recs:
            c.drawString(60, y, line)
            y -= 20

        # Footer
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawString(50, 40, "Disclaimer: This report was generated by MediScope AI. It is intended to assist medical professionals")
        c.drawString(50, 25, "and does not substitute professional medical advice, diagnosis, or treatment.")

        c.save()
        buffer.seek(0)
        return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=MediScope_AI_Lab_Report.pdf"})
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/radiology/analyze")
async def analyze_radiology_image(
    file: UploadFile = File(...), 
    scan_type: str = "X-Ray",
    region: str = "Unknown",
    current_user = Depends(get_current_user)
):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not configured")
        
    try:
        content = await file.read()
        import tempfile
        import json
        
        # We must use the File API for images to gemini
        ext = ".png"
        if file.filename.lower().endswith(".jpg") or file.filename.lower().endswith(".jpeg"):
            ext = ".jpg"
            
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            uploaded_file = client.files.upload(file=tmp_path)
            
            prompt = f"""
            You are an expert radiologist AI. Analyze the uploaded {scan_type} of the {region}.
            Provide your analysis STRICTLY as a JSON object with this exact structure (no markdown, no backticks, just raw JSON):
            {{
                "region_identified": "Specific anatomical region identified",
                "findings": [
                    "Finding 1 (e.g. No acute fractures seen)",
                    "Finding 2 (e.g. Mild osteopenia)"
                ],
                "severity_level": "Normal / Moderate / Critical",
                "recommendations": "Actionable medical advice based on findings."
            }}
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt, uploaded_file]
            )
            
            json_str = response.text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:]
            if json_str.startswith("```"):
                json_str = json_str[3:]
            if json_str.endswith("```"):
                json_str = json_str[:-3]
                
            result = json.loads(json_str.strip())
            
            return {
                "file_name": file.filename,
                "analysis": result
            }
        finally:
            try:
                client.files.delete(name=uploaded_file.name)
            except:
                pass
            try:
                os.remove(tmp_path)
            except:
                pass
                
    except Exception as e:
        print(f"Error in analyze_radiology_image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []

@router.post("/chat")
async def chat_with_ai(req: ChatRequest, current_user = Depends(get_current_user)):
    if not client:
        raise HTTPException(status_code=500, detail="AI Client not configured")
        
    try:
        # Build chat history for Gemini
        system_instruction = "You are MediScope AI, an advanced medical assistant for hospital staff. Answer questions concisely, professionally, and accurately. Do not provide direct medical advice to patients, but assist doctors with clinical guidelines, summaries, and hospital management tasks."
        
        # We can just construct a full prompt string since gemini-2.5-flash generates content well from text
        # If we want true chat history, we can format it into the prompt.
        prompt = f"{system_instruction}\n\n"
        
        if req.history:
            prompt += "Conversation History:\n"
            for msg in req.history[-10:]: # Keep last 10 messages for context
                prompt += f"{msg.role.capitalize()}: {msg.content}\n"
                
        prompt += f"\nUser: {req.message}\nMediScope AI:"

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        return {"response": response.text.strip()}
    except Exception as e:
        print(f"Chat API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
