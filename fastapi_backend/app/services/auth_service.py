from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from app.models.user import UserAccount
from app.core.security import verify_password, create_access_token, create_refresh_token, hash_password

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def login(self, email_or_username: str, password: str) -> dict:
        user = self.db.query(UserAccount).filter(
            or_(UserAccount.email == email_or_username, UserAccount.username == email_or_username)
        ).filter(UserAccount.is_active == True).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail={"type": "AuthenticationError", "title": "Invalid credentials"})
        user.last_login = datetime.utcnow()
        self.db.commit()
        payload = {"sub": str(user.user_id), "role": user.role, "branch_id": str(user.branch_id) if user.branch_id else None}
        return {
            "access_token": create_access_token(payload),
            "refresh_token": create_refresh_token(payload),
            "token_type": "bearer",
            "user": {"user_id": str(user.user_id), "email": user.email, "full_name": user.full_name, "role": user.role, "branch_id": str(user.branch_id) if user.branch_id else None}
        }

    def register(self, data: dict) -> dict:
        existing = self.db.query(UserAccount).filter(
            or_(UserAccount.email == data['email'], UserAccount.username == data['username'])
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail={"type": "ValidationError", "title": "Email or username already registered"})
        
        user = UserAccount(
            email=data['email'],
            username=data['username'],
            password_hash=hash_password(data['password']),
            full_name=data['full_name'],
            phone=data.get('phone'),
            role=data['role'],
            branch_id=data.get('branch_id')
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        payload = {"sub": str(user.user_id), "role": user.role, "branch_id": str(user.branch_id) if user.branch_id else None}
        return {
            "access_token": create_access_token(payload),
            "refresh_token": create_refresh_token(payload),
            "token_type": "bearer",
            "user": {"user_id": str(user.user_id), "email": user.email, "full_name": user.full_name, "role": user.role, "branch_id": str(user.branch_id) if user.branch_id else None}
        }
