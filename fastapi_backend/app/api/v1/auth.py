from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user

router = APIRouter()

class LoginRequest(BaseModel):
    email_or_username: str
    password: str
    model_config = ConfigDict(from_attributes=True)

class RegisterRequest(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    role: str
    phone: str = None
    branch_id: str = None
    model_config = ConfigDict(from_attributes=True)

class RefreshRequest(BaseModel):
    refresh_token: str
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict
    model_config = ConfigDict(from_attributes=True)

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).login(request.email_or_username, request.password)

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    return AuthService(db).register(request.model_dump())

@router.post("/refresh")
def refresh(request: RefreshRequest):
    return {"access_token": "new_token_here"}

@router.get("/me")
def me(user = Depends(get_current_user)):
    return {"user_id": str(user.user_id), "email": user.email, "role": user.role}
