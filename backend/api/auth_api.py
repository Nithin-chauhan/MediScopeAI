from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from fastapi.security import OAuth2PasswordRequestForm
from backend.database.database import get_db
from backend.orm import models
from backend.schemas import schemas
from backend.utils import auth, logger
from datetime import timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, password=hashed_password, role="admin") # Default admin for initial setup, but should be doctor. The user asked for "admin" default in create_admin.py, and "doctor" for register.
    new_user.role = "doctor"
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    logger.log_activity(db, user.email, "User Registration", "New account registered.")
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    role = user.role if user else "doctor"
    
    if not user:
        user = db.query(models.Doctor).filter(models.Doctor.email == form_data.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Credentials")
            
    if not auth.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": role}, expires_delta=access_token_expires
    )
    logger.log_activity(db, user.email, "Login", "User logged in.")
    
    return {"access_token": access_token, "token_type": "bearer", "role": role, "name": user.name}

@router.post("/google", response_model=schemas.Token)
def google_login(google_token: schemas.GoogleToken, db: Session = Depends(get_db)):
    client_id = os.environ.get("VITE_GOOGLE_CLIENT_ID", "YOUR_CLIENT_ID")
    
    email = None
    name = None
    
    if client_id == "YOUR_CLIENT_ID":
        # Mock mode for demonstration if user didn't set up GCP yet
        email = "demo@mediscope.ai"
        name = "Demo User"
    else:
        try:
            idinfo = id_token.verify_oauth2_token(google_token.token, google_requests.Request(), client_id)
            email = idinfo['email']
            name = idinfo.get('name', email.split('@')[0])
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid Google Token")
            
    # Check if user exists
    user = db.query(models.User).filter(models.User.email == email).first()
    role = user.role if user else "doctor"
    
    if not user:
        user = db.query(models.Doctor).filter(models.Doctor.email == email).first()
        
    # If user doesn't exist anywhere, register them automatically
    if not user:
        # Create a random password since they use Google Auth
        import secrets
        random_pwd = secrets.token_urlsafe(16)
        hashed_password = auth.get_password_hash(random_pwd)
        user = models.User(name=name, email=email, password=hashed_password, role="doctor")
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.log_activity(db, email, "Google Registration", "New account registered via Google.")
        role = "doctor"

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": role}, expires_delta=access_token_expires
    )
    logger.log_activity(db, user.email, "Google Login", "User logged in via Google.")
    
    return {"access_token": access_token, "token_type": "bearer", "role": role, "name": user.name}
