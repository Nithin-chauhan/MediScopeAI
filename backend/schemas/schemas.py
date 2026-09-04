from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Auth Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime
    class Config:
        from_attributes = True

# Doctor Schemas
class DoctorBase(BaseModel):
    name: str
    email: EmailStr
    specialization: str
    phone: str
    experience: int
    availability: bool = True

class DoctorCreate(DoctorBase):
    password: str

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    experience: Optional[int] = None
    availability: Optional[bool] = None

class DoctorResponse(DoctorBase):
    id: int
    patients_count: int
    created_at: datetime
    class Config:
        from_attributes = True

# Patient Schemas
class PatientBase(BaseModel):
    name: str
    gender: str
    age: int
    phone: str
    address: str
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    dob: Optional[datetime] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_pressure: Optional[str] = None
    pulse: Optional[int] = None
    weight: Optional[float] = None
    chronic_diseases: Optional[str] = None
    current_medication: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Disease Prediction Request Schemas
class DiabetesRequest(BaseModel):
    patient_id: int
    Pregnancies: float = Field(..., ge=0, le=20)
    Glucose: float = Field(..., ge=0, le=400)
    BloodPressure: float = Field(..., ge=0, le=200)
    SkinThickness: float = Field(..., ge=0, le=100)
    Insulin: float = Field(..., ge=0, le=1000)
    BMI: float = Field(..., ge=0, le=70)
    DiabetesPedigreeFunction: float = Field(..., ge=0, le=3.0)
    Age: float = Field(..., ge=1, le=120)

class HeartRequest(BaseModel):
    patient_id: int
    age: float = Field(..., ge=1, le=120)
    sex: float = Field(..., ge=0, le=1) # 0=Female, 1=Male
    cp: float = Field(..., ge=0, le=3)
    trestbps: float = Field(..., ge=80, le=260)
    chol: float = Field(..., ge=100, le=600)
    fbs: float = Field(..., ge=0, le=1)
    restecg: float = Field(..., ge=0, le=2)
    thalach: float = Field(..., ge=60, le=220)
    exang: float = Field(..., ge=0, le=1)
    oldpeak: float = Field(..., ge=0.0, le=6.5)
    slope: float = Field(..., ge=0, le=2)
    ca: float = Field(..., ge=0, le=4)
    thal: float = Field(..., ge=0, le=3)

class KidneyRequest(BaseModel):
    patient_id: int
    age: float = Field(..., ge=1, le=120)
    bp: float = Field(..., ge=50, le=200)
    sg: float = Field(..., ge=1.000, le=1.030)
    al: float = Field(..., ge=0, le=5)
    su: float = Field(..., ge=0, le=5)
    rbc: str # 'normal', 'abnormal'
    pc: str
    pcc: str # 'present', 'notpresent'
    ba: str
    bgr: float = Field(..., ge=20, le=500)
    bu: float = Field(..., ge=1.0, le=400)
    sc: float = Field(..., ge=0.1, le=80)
    sod: float = Field(..., ge=2.0, le=200)
    pot: float = Field(..., ge=2.0, le=50)
    hemo: float = Field(..., ge=2.0, le=20)
    pcv: float = Field(..., ge=5, le=60)
    wc: float = Field(..., ge=2000, le=30000)
    rc: float = Field(..., ge=1.0, le=9.0)
    htn: str # 'yes', 'no'
    dm: str
    cad: str
    appet: str # 'good', 'poor'
    pe: str
    ane: str

class LiverRequest(BaseModel):
    patient_id: int
    Age: float = Field(..., ge=1, le=120)
    Gender: str # 'Male', 'Female'
    Total_Bilirubin: float = Field(..., ge=0, le=100)
    Direct_Bilirubin: float = Field(..., ge=0, le=50)
    Alkaline_Phosphotase: float = Field(..., ge=5, le=3000)
    Alamine_Aminotransferase: float = Field(..., ge=5, le=3000)
    Aspartate_Aminotransferase: float = Field(..., ge=5, le=3000)
    Total_Protiens: float = Field(..., ge=1.0, le=15.0)
    Albumin: float = Field(..., ge=0.5, le=10.0)
    Albumin_and_Globulin_Ratio: float = Field(..., ge=0.1, le=5.0)

# Prediction Response Schema
class PredictionResponse(BaseModel):
    id: int
    patient_id: int
    disease: str
    probability: float
    risk_level: str
    prediction_result: str
    doctor_id: Optional[int]
    doctor_name: Optional[str]
    doctor_email: Optional[str]
    report_path: Optional[str]
    recommendations: str
    created_at: datetime
    class Config:
        from_attributes = True

# Lab Report Schemas
class LabReportBase(BaseModel):
    patient_id: int
    file_name: str
    file_size: Optional[str] = None
    extracted_parameters: Optional[str] = None
    ai_predictions: Optional[str] = None
    recommendations: Optional[str] = None
    status: str = "Pending"

class LabReportCreate(LabReportBase):
    pass

class LabReportResponse(LabReportBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- NEW ENTERPRISE HMS SCHEMAS ---

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    time_slot: Optional[str] = None
    status: str = "Scheduled"
    type: str = "OPD"
    department: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentResponse(AppointmentBase):
    id: int
    token_number: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class WardBase(BaseModel):
    name: str
    floor: str
    type: str

class WardCreate(WardBase):
    pass

class WardResponse(WardBase):
    id: int
    class Config:
        from_attributes = True

class IPDAdmissionBase(BaseModel):
    patient_id: int
    doctor_id: int
    bed_id: int
    status: str = "Admitted"

class IPDAdmissionCreate(IPDAdmissionBase):
    pass

class IPDAdmissionResponse(IPDAdmissionBase):
    id: int
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class BillingBase(BaseModel):
    patient_id: int
    type: str
    amount: float
    discount: float = 0.0
    tax: float = 0.0

class BillingCreate(BillingBase):
    pass

class BillingResponse(BillingBase):
    id: int
    total: float
    status: str
    payment_method: Optional[str] = None
    date: datetime
    class Config:
        from_attributes = True

class MedicineBase(BaseModel):
    name: str
    brand: str
    capacity: Optional[str] = None
    details: Optional[str] = None
    stock: int
    price: float
    expiry_date: datetime
    status: str = "In Stock"

class MedicineCreate(MedicineBase):
    pass

class MedicineResponse(MedicineBase):
    id: int
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    user_id: int
    department: str
    designation: str
    salary: float

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    joining_date: datetime
    class Config:
        from_attributes = True


class GoogleToken(BaseModel):
    token: str
