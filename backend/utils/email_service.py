import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
import traceback

def send_critical_alert(doctor_email: str, patient_name: str, disease: str, probability: float, pdf_path: str):
    sender_email = os.environ.get("SMTP_EMAIL")
    sender_password = os.environ.get("SMTP_PASSWORD")
    
    if not sender_email or not sender_password:
        print("SMTP Credentials not configured. Skipping email alert.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = doctor_email
        msg['Subject'] = f"CRITICAL ALERT: High Risk {disease} Detected for {patient_name}"

        body = f"""
        Dear Doctor,

        The MediScope AI system has detected a CRITICAL risk level for your patient, {patient_name}.
        
        Disease: {disease}
        Risk Probability: {(probability * 100):.1f}%
        
        Please find the detailed AI-generated medical report attached to this email.
        Immediate attention is recommended.

        Best regards,
        MediScope AI System
        """
        msg.attach(MIMEText(body, 'plain'))

        if os.path.exists(pdf_path):
            with open(pdf_path, "rb") as f:
                attach = MIMEApplication(f.read(), _subtype="pdf")
                attach.add_header('Content-Disposition', 'attachment', filename=f"{patient_name.replace(' ', '_')}_{disease}_Report.pdf")
                msg.attach(attach)

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent CRITICAL email alert to {doctor_email}")
        
    except Exception as e:
        print(f"Failed to send email alert: {e}")
        traceback.print_exc()
