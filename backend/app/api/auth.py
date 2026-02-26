from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
from datetime import datetime, timedelta
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/prospectminer")
client = AsyncIOMotorClient(MONGODB_URI)
db = client.get_database()
users_collection = db.users

# JWT Settings
SECRET_KEY = os.getenv("JWT_SECRET", "navya_jain_prospectminer_2025_secret_xyz123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security scheme
security = HTTPBearer(auto_error=False)


# Pydantic Models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated user"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(credentials.credentials)
    user_id = payload.get("user_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }


# Routes
@router.post("/register")
async def register(user: UserRegister):
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password length
    if len(user.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )

    hashed_pw = hash_password(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw,
        "created_at": datetime.utcnow(),
    }

    result = await users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)
    token = create_access_token({"user_id": user_id, "email": user.email})

    return {
        "token": token,
        "user": {"id": user_id, "name": user.name, "email": user.email},
    }


@router.post("/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    user_id = str(db_user["_id"])
    token = create_access_token({"user_id": user_id, "email": user.email})

    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": db_user["name"],
            "email": db_user["email"],
        },
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current logged in user info"""
    return current_user


@router.post("/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify if token is valid"""
    return {"valid": True, "user": current_user}