from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from backend.database.database import Base

# --- EXISTING ENUMS & TABLES (PRESERVED) ---

class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "Super Admin"
    HOSPITAL_ADMIN = "Hospital Admin"
    DOCTOR = "Doctor"
    RECEPTIONIST = "Receptionist"
    NURSE = "Nurse"
    LAB_TECHNICIAN = "Lab Technician"
    RADIOLOGIST = "Radiologist"
    PHARMACIST = "Pharmacist"
    ACCOUNTANT = "Accountant"
    HR = "HR"
    INVENTORY_MANAGER = "Inventory Manager"
    PATIENT = "Patient"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255))
    role = Column(String(50), default=RoleEnum.DOCTOR.value)
    created_at = Column(DateTime, default=datetime.utcnow)

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255))
    specialization = Column(String(255), index=True)
    phone = Column(String(50))
    experience = Column(Integer)
    patients_count = Column(Integer, default=0)
    availability = Column(Boolean, default=True)
    consultation_fee = Column(Float, default=0.0) # Added
    created_at = Column(DateTime, default=datetime.utcnow)
    
    predictions = relationship("Prediction", back_populates="assigned_doctor")
    appointments = relationship("Appointment", back_populates="doctor")
    admissions = relationship("IPDAdmission", back_populates="doctor")

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    gender = Column(String(50))
    age = Column(Integer)
    phone = Column(String(50))
    address = Column(String(255))
    blood_group = Column(String(10), nullable=True)
    allergies = Column(Text, nullable=True)
    dob = Column(DateTime, nullable=True)
    marital_status = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    blood_pressure = Column(String(20), nullable=True) # e.g. 120/80
    pulse = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    chronic_diseases = Column(Text, nullable=True)
    current_medication = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    predictions = relationship("Prediction", back_populates="patient", cascade="all, delete")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete")
    admissions = relationship("IPDAdmission", back_populates="patient", cascade="all, delete")
    bills = relationship("Billing", back_populates="patient")

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    disease = Column(String(100), index=True)
    probability = Column(Float)
    risk_level = Column(String(50))
    prediction_result = Column(String(50))
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    doctor_name = Column(String(255), nullable=True)
    doctor_email = Column(String(255), nullable=True)
    report_path = Column(String(500), nullable=True)
    input_data = Column(Text)
    recommendations = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient", back_populates="predictions")
    assigned_doctor = relationship("Doctor", back_populates="predictions")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(255), index=True)
    action = Column(String(255))
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class LabReport(Base):
    __tablename__ = "lab_reports"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    file_name = Column(String(255))
    file_size = Column(String(50))
    extracted_parameters = Column(Text) # JSON string
    ai_predictions = Column(Text) # JSON string
    recommendations = Column(Text)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")

# --- NEW ENTERPRISE HMS TABLES ---

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_date = Column(DateTime, index=True)
    time_slot = Column(String(50), nullable=True)
    status = Column(String(50), default="Scheduled") # Scheduled, Completed, Cancelled
    type = Column(String(50), default="OPD") # OPD, Follow-up
    department = Column(String(100), nullable=True)
    token_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")

class Ward(Base):
    __tablename__ = "wards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    floor = Column(String(50))
    type = Column(String(50)) # General, ICU, Maternity
    rooms = relationship("Room", back_populates="ward", cascade="all, delete")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"))
    room_number = Column(String(50))
    ward = relationship("Ward", back_populates="rooms")
    beds = relationship("Bed", back_populates="room", cascade="all, delete")

class Bed(Base):
    __tablename__ = "beds"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    bed_number = Column(String(50))
    status = Column(String(50), default="Available") # Available, Occupied, Maintenance
    room = relationship("Room", back_populates="beds")
    admissions = relationship("IPDAdmission", back_populates="bed")

class IPDAdmission(Base):
    __tablename__ = "ipd_admissions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    bed_id = Column(Integer, ForeignKey("beds.id"))
    admission_date = Column(DateTime, default=datetime.utcnow)
    discharge_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="Admitted") # Admitted, Discharged
    
    patient = relationship("Patient", back_populates="admissions")
    doctor = relationship("Doctor", back_populates="admissions")
    bed = relationship("Bed", back_populates="admissions")

class Billing(Base):
    __tablename__ = "billing"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    type = Column(String(50)) # OPD, IPD, Pharmacy, Lab
    amount = Column(Float)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    total = Column(Float)
    status = Column(String(50), default="Unpaid") # Paid, Unpaid, Refunded
    payment_method = Column(String(50), nullable=True) # Cash, Card, UPI
    date = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="bills")

class Medicine(Base):
    __tablename__ = "medicines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    brand = Column(String(100))
    capacity = Column(String(100), nullable=True)
    details = Column(String(100), nullable=True)
    stock = Column(Integer, default=0)
    price = Column(Float)
    expiry_date = Column(DateTime)
    status = Column(String(50), default="In Stock")

class BloodBank(Base):
    __tablename__ = "blood_bank"
    id = Column(Integer, primary_key=True, index=True)
    blood_group = Column(String(10), unique=True, index=True)
    units_available = Column(Integer, default=0)

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    department = Column(String(100))
    designation = Column(String(100))
    salary = Column(Float)
    joining_date = Column(DateTime, default=datetime.utcnow)

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    type = Column(String(50)) # 'OPD' or 'IPD'
    reference_id = Column(Integer, nullable=True) # Appointment ID or Admission ID
    note_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")
    doctor = relationship("Doctor")
