from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils.auth import get_current_user, RequireRole

router = APIRouter(prefix="/api/hr", tags=["HR & Payroll"])

@router.post("/employees", response_model=schemas.EmployeeResponse, dependencies=[Depends(RequireRole([models.RoleEnum.HR.value, models.RoleEnum.SUPER_ADMIN.value]))])
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    db_emp = models.Employee(**employee.model_dump())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@router.get("/employees", response_model=List[schemas.EmployeeResponse], dependencies=[Depends(RequireRole([models.RoleEnum.HR.value, models.RoleEnum.SUPER_ADMIN.value]))])
def get_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).all()
