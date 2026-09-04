from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils.auth import get_current_user, RequireRole

router = APIRouter(prefix="/api/finance", tags=["Finance & Billing"])

@router.post("/billing", response_model=schemas.BillingResponse, dependencies=[Depends(RequireRole([models.RoleEnum.ACCOUNTANT.value, models.RoleEnum.SUPER_ADMIN.value, models.RoleEnum.RECEPTIONIST.value]))])
def create_bill(bill: schemas.BillingCreate, db: Session = Depends(get_db)):
    total = bill.amount - bill.discount + bill.tax
    db_bill = models.Billing(**bill.model_dump(), total=total)
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.get("/billing", response_model=List[schemas.BillingResponse], dependencies=[Depends(RequireRole([models.RoleEnum.ACCOUNTANT.value, models.RoleEnum.SUPER_ADMIN.value]))])
def get_bills(db: Session = Depends(get_db)):
    return db.query(models.Billing).all()

@router.get("/invoice/{id}")
def get_invoice_details(id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # In a real app we'd fetch actual line items from an InvoiceItem table
    # Since we only have a flat Billing table right now, we will mock the line items based on the bill total
    # or just return a standard mock if the ID is purely string (like INV-2024-001)

    return {
        "invoiceNumber": id,
        "date": "15 May 2024",
        "dueDate": "30 May 2024",
        "patient": {
            "name": "Emma Thompson",
            "id": "PT-8842",
            "address": "123 Park Avenue, NY 10001",
            "phone": "+1 234-567-8900"
        },
        "items": [
            { "id": 1, "description": "Cardiology Consultation", "category": "Consultation", "qty": 1, "rate": 150.00, "amount": 150.00 },
            { "id": 2, "description": "Complete Blood Count (CBC)", "category": "Laboratory", "qty": 1, "rate": 45.00, "amount": 45.00 },
            { "id": 3, "description": "Lipid Profile Panel", "category": "Laboratory", "qty": 1, "rate": 85.00, "amount": 85.00 },
            { "id": 4, "description": "ECG/EKG Test", "category": "Diagnostics", "qty": 1, "rate": 120.00, "amount": 120.00 }
        ],
        "subtotal": 400.00,
        "tax": 20.00,
        "discount": 0.00,
        "total": 420.00,
        "amountPaid": 420.00,
        "balanceDue": 0.00,
        "status": "Paid",
        "paymentMethod": "Credit Card (ending in 4242)",
        "notes": "Thank you for choosing MediScope AI Hospital. Please contact billing department for any queries."
    }
