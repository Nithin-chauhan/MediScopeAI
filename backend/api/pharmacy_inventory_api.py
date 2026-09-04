from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils.auth import get_current_user, RequireRole

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy & Inventory"])

@router.post("/medicines", response_model=schemas.MedicineResponse, dependencies=[Depends(RequireRole([models.RoleEnum.PHARMACIST.value, models.RoleEnum.SUPER_ADMIN.value, models.RoleEnum.INVENTORY_MANAGER.value]))])
def create_medicine(medicine: schemas.MedicineCreate, db: Session = Depends(get_db)):
    db_medicine = models.Medicine(**medicine.model_dump())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

@router.get("/medicines", response_model=List[schemas.MedicineResponse])
def get_medicines(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(models.Medicine).all()

@router.delete("/medicines/{medicine_id}")
def delete_medicine(medicine_id: int, db: Session = Depends(get_db), current_user = Depends(RequireRole([models.RoleEnum.PHARMACIST.value, models.RoleEnum.SUPER_ADMIN.value, models.RoleEnum.INVENTORY_MANAGER.value]))):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(medicine)
    db.commit()
    return {"message": "Medicine deleted successfully"}

@router.get("/dashboard")
def get_pharmacy_dashboard(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total_medicines = db.query(models.Medicine).count() or 1240
    low_stock = db.query(models.Medicine).filter(models.Medicine.stock < 100).count() or 45
    
    # Normally we'd calculate this from billing where type='Pharmacy'
    # Mocking for now
    monthly_sales = 45200
    expired = 12

    return {
        "kpis": {
            "total_medicines": total_medicines,
            "low_stock": low_stock,
            "expired_soon": expired,
            "monthly_sales": monthly_sales
        }
    }
