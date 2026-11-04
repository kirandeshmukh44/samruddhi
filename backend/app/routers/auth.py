# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, UserPlan
from app.schemas import (
    UserRegister,
    UserLogin,
    OTPRequest,
    OTPVerify,
    UserUpdate,
    UserOut,
    TokenOut,
)
from app.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    if not user_in.email and not user_in.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone must be provided",
        )

    if user_in.email:
        existing_email = db.query(User).filter(User.email == user_in.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    if user_in.phone:
        existing_phone = db.query(User).filter(User.phone == user_in.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone already registered",
            )

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=get_password_hash(user_in.password),
        role=UserRole.owner.value,
        plan=UserPlan.free.value,
        is_active=True,
        language="en",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id})
    return {"access_token": token, "token_type": "bearer", "user": new_user}


@router.post("/login", response_model=TokenOut)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    ident = login_in.identifier or login_in.email or login_in.phone
    if not ident:
        raise HTTPException(status_code=400, detail="Email or phone is required")

    user = (
        db.query(User)
        .filter((User.email == ident) | (User.phone == ident))
        .first()
    )
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


# Mock OTP flow: In dev, OTP is always 123456
@router.post("/otp/request")
def request_otp(req: OTPRequest, db: Session = Depends(get_db)):
    # Dev mock: always succeeds, prompt code 123456
    return {
        "detail": "OTP sent successfully (Development mock code: 123456)",
        "phone": req.phone,
    }


@router.post("/otp/verify", response_model=TokenOut)
def verify_otp(verify_in: OTPVerify, db: Session = Depends(get_db)):
    if verify_in.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP code")

    user = db.query(User).filter(User.phone == verify_in.phone).first()
    if not user:
        # Create a user if they log in with phone for first time
        user = User(
            name=f"User {verify_in.phone[-4:]}",
            phone=verify_in.phone,
            password_hash=get_password_hash("123456"),
            role=UserRole.owner.value,
            plan=UserPlan.free.value,
            is_active=True,
            language="en",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update_in.name is not None:
        current_user.name = update_in.name
    if update_in.language is not None:
        if update_in.language not in ("en", "hi", "mr"):
            raise HTTPException(status_code=400, detail="Language must be en, hi, or mr")
        current_user.language = update_in.language

    db.commit()
    db.refresh(current_user)
    return current_user

