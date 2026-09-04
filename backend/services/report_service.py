import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports', 'generated_pdfs')
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_report(patient, prediction, recommendations, input_data):
    """Generates a PDF report for a prediction."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"report_{patient.id}_{timestamp}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)
    
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    Story = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], textColor=colors.HexColor('#4f5bd5'), alignment=1)
    section_style = ParagraphStyle('SectionStyle', parent=styles['Heading2'], textColor=colors.HexColor('#1a1d2e'))
    
    # Title
    Story.append(Paragraph("MediScope AI", title_style))
    Story.append(Paragraph("Medical Prediction Report", styles["Heading3"]))
    Story.append(Spacer(1, 12))
    
    # Patient Info
    Story.append(Paragraph("Patient Information", section_style))
    patient_data = [
        ["ID:", str(patient.id)],
        ["Name:", patient.name],
        ["Age:", str(patient.age)],
        ["Gender:", patient.gender],
        ["Phone:", patient.phone]
    ]
    t = Table(patient_data, colWidths=[100, 300])
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.white),
                           ('TEXTCOLOR', (0,0), (-1,-1), colors.black),
                           ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                           ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
                           ('BOTTOMPADDING', (0,0), (-1,-1), 6)]))
    Story.append(t)
    Story.append(Spacer(1, 12))
    
    # Prediction Results
    Story.append(Paragraph("Prediction Results", section_style))
    res_data = [
        ["Disease Tested:", prediction.disease],
        ["Result:", prediction.prediction_result],
        ["Probability:", f"{prediction.probability * 100:.2f}%"],
        ["Risk Level:", prediction.risk_level]
    ]
    t2 = Table(res_data, colWidths=[150, 250])
    t2.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.whitesmoke),
                            ('GRID', (0,0), (-1,-1), 1, colors.lightgrey)]))
    Story.append(t2)
    Story.append(Spacer(1, 12))
    
    # Doctor Info
    Story.append(Paragraph("Assigned Specialist", section_style))
    if prediction.doctor_name:
        doc_data = [
            ["Doctor Name:", prediction.doctor_name],
            ["Email:", prediction.doctor_email]
        ]
        t3 = Table(doc_data, colWidths=[100, 300])
        Story.append(t3)
    else:
        Story.append(Paragraph("No specialist available at the moment.", styles["Normal"]))
    Story.append(Spacer(1, 12))
    
    # Recommendations
    Story.append(Paragraph("Medical Recommendations", section_style))
    for rec in recommendations:
        Story.append(Paragraph(f"• {rec}", styles["Normal"]))
        Story.append(Spacer(1, 6))
        
    Story.append(Spacer(1, 24))
    Story.append(Paragraph("Disclaimer: For educational and research purposes only. Not a substitute for professional medical advice.", styles["Italic"]))
    
    doc.build(Story)
    return filepath
