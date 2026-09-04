from backend.database.database import SessionLocal, engine, Base
from backend.orm import models
from backend.utils import auth

Base.metadata.create_all(bind=engine)

def create_admin():
    db = SessionLocal()
    admin_email = "admin@mediscope.ai"
    
    # Check if admin exists
    admin = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin:
        hashed_password = auth.get_password_hash("admin123")
        new_admin = models.User(
            name="System Admin",
            email=admin_email,
            password=hashed_password,
            role="admin"
        )
        db.add(new_admin)
        db.commit()
        print(f"Created default admin: {admin_email} / admin123")
    else:
        print("Admin already exists.")
        
    db.close()

if __name__ == "__main__":
    create_admin()
