from sqlalchemy.orm import Session
from backend.orm import models

def log_activity(db: Session, email: str, action: str, details: str):
    log = models.ActivityLog(user_email=email, action=action, details=details)
    db.add(log)
    db.commit()
