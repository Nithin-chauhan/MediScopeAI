from sqlalchemy.orm import Session
from backend.orm import models

def allocate_doctor(db: Session, disease: str, probability: float):
    """
    Auto-allocates specialist doctors based on load balancing and experience.
    """
    specialization_mapping = {
        "Diabetes": "Endocrinologist",
        "Heart Disease": "Cardiologist",
        "Kidney Disease": "Nephrologist",
        "Liver Disease": "Hepatologist"
    }
    
    required_spec = specialization_mapping.get(disease, "General Physician")
    
    # 1. Filter: specialization==required AND availability==True
    query = db.query(models.Doctor).filter(
        models.Doctor.specialization == required_spec,
        models.Doctor.availability == True
    )
    
    doctors = query.all()
    
    if not doctors:
        # Fallback to General Physician
        doctors = db.query(models.Doctor).filter(
            models.Doctor.specialization == "General Physician",
            models.Doctor.availability == True
        ).all()
        
    if not doctors:
        return None # "No specialist available"
        
    # 2 & 3. Sort logic
    if probability > 0.85:
        # CRITICAL: Sort by experience DESC (most experienced first), then by patients_count ASC
        doctors.sort(key=lambda d: (-d.experience, d.patients_count))
    else:
        # Order by patients_count ASC (least busy first)
        doctors.sort(key=lambda d: (d.patients_count, -d.experience))
        
    chosen_doctor = doctors[0]
    
    # 6. chosen.patients_count += 1
    chosen_doctor.patients_count += 1
    db.commit()
    
    return chosen_doctor
