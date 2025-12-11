from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
import os
import uuid
import logging
from pathlib import Path
from enum import Enum

# Import Stripe integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Daylane Booking API")
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback_secret')
JWT_ALGORITHM = "HS256"

# Enums
class PlanType(str, Enum):
    TRIAL = "trial"
    STARTER = "starter" 
    PRO = "pro"

class AppointmentStatus(str, Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"

# Data Models
class Tenant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    email: EmailStr
    phone: Optional[str] = None
    password_hash: str
    locale: str = "de-CH"
    currency: str = "CHF"
    plan: PlanType = PlanType.TRIAL
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    active: bool = True

class TenantCreate(BaseModel):
    name: str
    slug: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class TenantLogin(BaseModel):
    email: EmailStr
    password: str

class WorkingDay(BaseModel):
    is_working: bool = False
    start_time: Optional[str] = None  # Format: "09:00"
    end_time: Optional[str] = None    # Format: "18:00"

class WeeklySchedule(BaseModel):
    monday: WorkingDay = Field(default_factory=WorkingDay)
    tuesday: WorkingDay = Field(default_factory=WorkingDay)
    wednesday: WorkingDay = Field(default_factory=WorkingDay)
    thursday: WorkingDay = Field(default_factory=WorkingDay)
    friday: WorkingDay = Field(default_factory=WorkingDay)
    saturday: WorkingDay = Field(default_factory=WorkingDay)
    sunday: WorkingDay = Field(default_factory=WorkingDay)

class SpecialClosure(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    staff_id: str
    tenant_id: str
    date: str  # Format: "2025-06-15" (ISO date string)
    reason: Optional[str] = None  # e.g., "Vacation", "Holiday", "Sick Leave"
    all_day: bool = True
    start_time: Optional[str] = None  # For partial day closures
    end_time: Optional[str] = None    # For partial day closures
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Staff(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    active: bool = True
    working_hours: WeeklySchedule = Field(default_factory=WeeklySchedule)
    timezone: str = "Europe/Zurich"
    color_tag: str = "#3B82F6"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StaffCreate(BaseModel):
    name: str
    working_hours: Optional[WeeklySchedule] = None
    color_tag: Optional[str] = "#3B82F6"

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    working_hours: Optional[WeeklySchedule] = None
    color_tag: Optional[str] = None
    active: Optional[bool] = None

class SpecialClosureCreate(BaseModel):
    date: str  # Format: "2025-06-15"
    reason: Optional[str] = None
    all_day: bool = True
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price_chf: float
    buffer_minutes: int = 0
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price_chf: float
    buffer_minutes: int = 0

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    service_id: str
    staff_id: str
    start_at: datetime
    end_at: datetime
    customer_name: str
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    status: AppointmentStatus = AppointmentStatus.CONFIRMED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AppointmentCreate(BaseModel):
    service_id: str
    staff_id: str
    start_at: datetime
    customer_name: str
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None

class UsageSnapshot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    month: int
    year: int
    staff_count: int
    monthly_appointment_count: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    session_id: str
    payment_id: Optional[str] = None
    amount: float
    currency: str = "CHF"
    plan_upgrade_to: Optional[PlanType] = None
    payment_status: str = "pending"  # pending, paid, failed, expired
    status: str = "initiated"  # initiated, completed, cancelled, expired
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    package_id: str  # "starter" or "pro"
    origin_url: str

# Swiss CHF Plan Packages (Fixed server-side pricing)
PLAN_PACKAGES = {
    "starter": {
        "name": "Starter Plan",
        "amount": 29.00,
        "currency": "CHF",
        "plan_type": PlanType.STARTER,
        "limits": {
            "max_staff": 2,
            "max_appointments_per_month": 200
        }
    },
    "pro": {
        "name": "Pro Plan", 
        "amount": 59.00,
        "currency": "CHF",
        "plan_type": PlanType.PRO,
        "limits": {
            "max_staff": 3,
            "max_appointments_per_month": 400
        }
    }
}

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_tenant(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        tenant_id: str = payload.get("sub")
        if tenant_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    tenant = await db.tenants.find_one({"id": tenant_id})
    if tenant is None:
        raise HTTPException(status_code=401, detail="Tenant not found")
    return Tenant(**tenant)

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        result = {}
        for key, value in data.items():
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                result[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
            else:
                result[key] = value
        return result
    return data

def parse_from_mongo(item):
    """Convert ISO strings back to datetime objects from MongoDB"""
    if isinstance(item, dict):
        result = {}
        for key, value in item.items():
            # Skip MongoDB's _id field to avoid ObjectId serialization issues
            if key == '_id':
                continue
            elif key in ['created_at', 'trial_start', 'trial_end', 'start_at', 'end_at'] and isinstance(value, str):
                try:
                    result[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    result[key] = value
            elif isinstance(value, dict):
                result[key] = parse_from_mongo(value)
            elif isinstance(value, list):
                result[key] = [parse_from_mongo(item) if isinstance(item, dict) else item for item in value]
            else:
                result[key] = value
        return result
    return item

# Authentication endpoints
@api_router.get("/")
async def api_root():
    return {"message": "Daylane API v1.0", "status": "online"}

@api_router.post("/auth/register")
async def register_tenant(tenant_data: TenantCreate):
    # Check if tenant already exists
    existing = await db.tenants.find_one({"$or": [{"email": tenant_data.email}, {"slug": tenant_data.slug}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email oder Slug bereits vergeben")
    
    # Create tenant with trial plan
    trial_start = datetime.now(timezone.utc)
    trial_end = trial_start + timedelta(days=14)
    
    tenant = Tenant(
        **tenant_data.dict(exclude={"password"}),
        password_hash=hash_password(tenant_data.password),
        plan=PlanType.TRIAL,
        trial_start=trial_start,
        trial_end=trial_end
    )
    
    tenant_dict = prepare_for_mongo(tenant.dict())
    await db.tenants.insert_one(tenant_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": tenant.id})
    return {"access_token": access_token, "token_type": "bearer", "tenant": tenant}

@api_router.post("/auth/login")
async def login_tenant(login_data: TenantLogin):
    tenant_doc = await db.tenants.find_one({"email": login_data.email})
    if not tenant_doc or not verify_password(login_data.password, tenant_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")
    
    tenant = Tenant(**parse_from_mongo(tenant_doc))
    access_token = create_access_token(data={"sub": tenant.id})
    return {"access_token": access_token, "token_type": "bearer", "tenant": tenant}

@api_router.post("/auth/cancel-subscription")
async def cancel_subscription(current_tenant: Tenant = Depends(get_current_tenant)):
    """Cancel the current subscription and downgrade to trial"""
    
    # Only allow cancellation for paid plans
    if current_tenant.plan == PlanType.TRIAL:
        raise HTTPException(status_code=400, detail="Keine aktives Abonnement zum Kündigen")
    
    try:
        # Reset to trial plan with extended trial period (30 days from now)
        trial_start = datetime.now(timezone.utc)
        trial_end = trial_start + timedelta(days=30)
        
        # Update tenant plan
        await db.tenants.update_one(
            {"id": current_tenant.id},
            {"$set": {
                "plan": PlanType.TRIAL,
                "trial_start": trial_start.isoformat(),
                "trial_end": trial_end.isoformat()
            }}
        )
        
        # Create a cancellation record for tracking
        cancellation_record = {
            "id": str(uuid.uuid4()),
            "tenant_id": current_tenant.id,
            "previous_plan": current_tenant.plan,
            "cancelled_at": trial_start.isoformat(),
            "reason": "user_requested"
        }
        
        await db.subscription_cancellations.insert_one(cancellation_record)
        
        logger.info(f"Subscription cancelled for tenant {current_tenant.id}, previous plan: {current_tenant.plan}")
        
        return {
            "message": "Abonnement erfolgreich gekündigt",
            "new_plan": "trial",
            "trial_end": trial_end.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error cancelling subscription for tenant {current_tenant.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Fehler beim Kündigen des Abonnements")

# Dashboard endpoints
@api_router.get("/dashboard/overview")
async def get_dashboard_overview(current_tenant: Tenant = Depends(get_current_tenant)):
    # Get current date/time
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # Count appointments this month
    appointments_count = await db.appointments.count_documents({
        "tenant_id": current_tenant.id,
        "start_at": {"$gte": month_start.isoformat()},
        "status": "confirmed"
    })
    
    # Count appointments today
    appointments_today = await db.appointments.count_documents({
        "tenant_id": current_tenant.id,
        "start_at": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()},
        "status": "confirmed"
    })
    
    # Count active staff
    staff_count = await db.staff.count_documents({
        "tenant_id": current_tenant.id,
        "active": True
    })
    
    # Count unique customers (distinct customer emails)
    customers_pipeline = [
        {"$match": {"tenant_id": current_tenant.id, "customer_email": {"$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$customer_email"}},
        {"$count": "total"}
    ]
    customers_result = await db.appointments.aggregate(customers_pipeline).to_list(1)
    customers_count = customers_result[0]["total"] if customers_result else 0
    
    # Get all appointments for today (from start of day, not just future)
    today_end = today_start + timedelta(days=1)
    next_appointments_cursor = db.appointments.find({
        "tenant_id": current_tenant.id,
        "start_at": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()},
        "status": "confirmed"
    }).sort("start_at", 1).limit(10)
    
    next_appointments = []
    async for apt_doc in next_appointments_cursor:
        apt = parse_from_mongo(apt_doc)
        
        # Get service and staff info
        service_doc = await db.services.find_one({"id": apt["service_id"]})
        staff_doc = await db.staff.find_one({"id": apt["staff_id"]})
        
        if service_doc:
            apt["service_name"] = service_doc["name"]
        if staff_doc:
            apt["staff_name"] = staff_doc["name"]
        
        next_appointments.append(apt)
    
    return {
        "termine_heute": appointments_today,
        "termine_dieses_monat": appointments_count,
        "aktive_mitarbeiter": staff_count,
        "total_kunden": customers_count,
        "naechste_termine": next_appointments,
        "plan": current_tenant.plan,
        "trial_end": current_tenant.trial_end,
        "tenant_name": current_tenant.name,
        "tenant_slug": current_tenant.slug
    }

# Staff endpoints
@api_router.get("/staff", response_model=List[Staff])
async def get_staff(current_tenant: Tenant = Depends(get_current_tenant)):
    staff_docs = await db.staff.find({"tenant_id": current_tenant.id}).to_list(100)
    return [Staff(**parse_from_mongo(staff)) for staff in staff_docs]

@api_router.post("/staff", response_model=Staff)
async def create_staff(staff_data: StaffCreate, current_tenant: Tenant = Depends(get_current_tenant)):
    # Check plan limits
    current_staff_count = await db.staff.count_documents({"tenant_id": current_tenant.id, "active": True})
    
    # Get plan limits from tenant plan
    plan_limits = {"trial": 1, "starter": 2, "pro": 3}
    max_staff = plan_limits.get(current_tenant.plan, 1)
    
    if current_staff_count >= max_staff:
        plan_names = {"trial": "Probezeitraum", "starter": "Starter Plan", "pro": "Pro Plan"}
        current_plan_name = plan_names.get(current_tenant.plan, "aktueller Plan")
        raise HTTPException(
            status_code=400, 
            detail=f"Mitarbeiterlimit erreicht. Ihr {current_plan_name} erlaubt maximal {max_staff} Mitarbeiter. Plan upgraden erforderlich."
        )
    
    # Default working hours if not provided - new structured format
    default_working_hours = WeeklySchedule(
        monday=WorkingDay(is_working=True, start_time="09:00", end_time="17:00"),
        tuesday=WorkingDay(is_working=True, start_time="09:00", end_time="17:00"),
        wednesday=WorkingDay(is_working=True, start_time="09:00", end_time="17:00"),
        thursday=WorkingDay(is_working=True, start_time="09:00", end_time="17:00"),
        friday=WorkingDay(is_working=True, start_time="09:00", end_time="17:00"),
        saturday=WorkingDay(is_working=False),
        sunday=WorkingDay(is_working=False)
    )
    
    staff = Staff(
        tenant_id=current_tenant.id,
        name=staff_data.name,
        working_hours=staff_data.working_hours or default_working_hours,
        color_tag=staff_data.color_tag or "#3B82F6"
    )
    
    staff_dict = prepare_for_mongo(staff.dict())
    await db.staff.insert_one(staff_dict)
    return staff

# Staff working hours management endpoints
@api_router.put("/staff/{staff_id}/working-hours", response_model=Staff)
async def update_staff_working_hours(staff_id: str, working_hours: WeeklySchedule, current_tenant: Tenant = Depends(get_current_tenant)):
    # Verify staff belongs to current tenant
    staff_doc = await db.staff.find_one({"id": staff_id, "tenant_id": current_tenant.id})
    if not staff_doc:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    # Update working hours
    update_data = {"working_hours": prepare_for_mongo(working_hours.dict())}
    await db.staff.update_one(
        {"id": staff_id, "tenant_id": current_tenant.id}, 
        {"$set": update_data}
    )
    
    # Return updated staff
    updated_staff_doc = await db.staff.find_one({"id": staff_id, "tenant_id": current_tenant.id})
    return Staff(**parse_from_mongo(updated_staff_doc))

@api_router.put("/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff_update: StaffUpdate, current_tenant: Tenant = Depends(get_current_tenant)):
    # Verify staff belongs to current tenant
    staff_doc = await db.staff.find_one({"id": staff_id, "tenant_id": current_tenant.id})
    if not staff_doc:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    # Prepare update data (only include non-None fields)
    update_data = {}
    if staff_update.name is not None:
        update_data["name"] = staff_update.name
    if staff_update.working_hours is not None:
        update_data["working_hours"] = prepare_for_mongo(staff_update.working_hours.dict())
    if staff_update.color_tag is not None:
        update_data["color_tag"] = staff_update.color_tag
    if staff_update.active is not None:
        update_data["active"] = staff_update.active
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Keine Aktualisierungsdaten bereitgestellt")
    
    # Update staff
    await db.staff.update_one(
        {"id": staff_id, "tenant_id": current_tenant.id}, 
        {"$set": update_data}
    )
    
    # Return updated staff
    updated_staff_doc = await db.staff.find_one({"id": staff_id, "tenant_id": current_tenant.id})
    return Staff(**parse_from_mongo(updated_staff_doc))

# Special closure dates management endpoints
@api_router.get("/staff/{staff_id}/closures", response_model=List[SpecialClosure])
async def get_staff_closures(staff_id: str, current_tenant: Tenant = Depends(get_current_tenant)):
    # Verify staff belongs to current tenant
    staff_doc = await db.staff.find_one({"id": staff_id, "tenant_id": current_tenant.id})
    if not staff_doc:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    closures_docs = await db.special_closures.find({
        "staff_id": staff_id, 
        "tenant_id": current_tenant.id
    }).to_list(100)
    
    return [SpecialClosure(**parse_from_mongo(closure)) for closure in closures_docs]

@api_router.post("/staff/{staff_id}/closures", response_model=SpecialClosure)
async def create_staff_closure(staff_id: str, closure_data: SpecialClosureCreate, current_tenant: Tenant = Depends(get_current_tenant)):
    # Verify staff belongs to current tenant
    staff_doc = await db.staff.find_one({"id": staff_id, "tenant_id": current_tenant.id})
    if not staff_doc:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    # Validate date format
    try:
        from datetime import datetime
        datetime.strptime(closure_data.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Ungültiges Datumsformat. Verwenden Sie YYYY-MM-DD")
    
    closure = SpecialClosure(
        staff_id=staff_id,
        tenant_id=current_tenant.id,
        **closure_data.dict()
    )
    
    closure_dict = prepare_for_mongo(closure.dict())
    await db.special_closures.insert_one(closure_dict)
    return closure

@api_router.delete("/staff/{staff_id}/closures/{closure_id}")
async def delete_staff_closure(staff_id: str, closure_id: str, current_tenant: Tenant = Depends(get_current_tenant)):
    # Verify staff belongs to current tenant
    staff_doc = await db.staff.find_one({"id": staff_id, "tenant_id": current_tenant.id})
    if not staff_doc:
        raise HTTPException(status_code=404, detail="Mitarbeiter nicht gefunden")
    
    # Delete the closure
    result = await db.special_closures.delete_one({
        "id": closure_id,
        "staff_id": staff_id,
        "tenant_id": current_tenant.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schließungsdatum nicht gefunden")
    
    return {"message": "Schließungsdatum gelöscht"}

# Get all closures for tenant (useful for calendar display)
@api_router.get("/closures", response_model=List[SpecialClosure])
async def get_all_closures(current_tenant: Tenant = Depends(get_current_tenant)):
    closures_docs = await db.special_closures.find({
        "tenant_id": current_tenant.id
    }).to_list(200)
    
    return [SpecialClosure(**parse_from_mongo(closure)) for closure in closures_docs]

# Services endpoints
@api_router.get("/services", response_model=List[Service])
async def get_services(current_tenant: Tenant = Depends(get_current_tenant)):
    services_docs = await db.services.find({"tenant_id": current_tenant.id}).to_list(100)
    return [Service(**parse_from_mongo(service)) for service in services_docs]

@api_router.post("/services", response_model=Service)
async def create_service(service_data: ServiceCreate, current_tenant: Tenant = Depends(get_current_tenant)):
    service = Service(tenant_id=current_tenant.id, **service_data.dict())
    service_dict = prepare_for_mongo(service.dict())
    await db.services.insert_one(service_dict)
    return service

# Public booking endpoints
@api_router.get("/public/{tenant_slug}/appointments")
async def get_public_appointments(tenant_slug: str, date: str, staff_id: str = None):
    """Get appointments for a specific date and optionally staff member (for conflict checking)"""
    try:
        # Find tenant by slug
        tenant_doc = await db.tenants.find_one({"slug": tenant_slug})
        if not tenant_doc:
            raise HTTPException(status_code=404, detail="Salon nicht gefunden")
        
        # Parse the date
        try:
            appointment_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Ungültiges Datumsformat")
        
        # Build query for appointments on the specific date
        query = {"tenant_id": tenant_doc["id"]}
        
        # Add staff filter if provided
        if staff_id:
            query["staff_id"] = staff_id
        
        # Find appointments for the date
        appointments_docs = await db.appointments.find(query).to_list(100)
        
        # Filter appointments for the specific date
        appointments_for_date = []
        for apt_doc in appointments_docs:
            apt_start = apt_doc["start_at"]
            if isinstance(apt_start, str):
                apt_start = datetime.fromisoformat(apt_start.replace('Z', '+00:00'))
            
            # Check if appointment is on the requested date
            if apt_start.date() == appointment_date:
                appointments_for_date.append({
                    "id": apt_doc["id"],
                    "staff_id": apt_doc["staff_id"],
                    "start_at": apt_start.isoformat(),
                    "end_at": apt_doc["end_at"] if isinstance(apt_doc["end_at"], str) else apt_doc["end_at"].isoformat(),
                    "service_name": apt_doc.get("service_name", ""),
                    "customer_name": apt_doc.get("customer_name", "")
                })
        
        return appointments_for_date
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching public appointments: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Laden der Termine")

@api_router.get("/public/{tenant_slug}/info")
async def get_tenant_booking_info(tenant_slug: str):
    tenant_doc = await db.tenants.find_one({"slug": tenant_slug, "active": True})
    if not tenant_doc:
        raise HTTPException(status_code=404, detail="Geschäft nicht gefunden")
    
    tenant = Tenant(**parse_from_mongo(tenant_doc))
    
    # Get services and staff
    services = await db.services.find({"tenant_id": tenant.id, "active": True}).to_list(100)
    staff = await db.staff.find({"tenant_id": tenant.id, "active": True}).to_list(100)
    
    return {
        "tenant": {
            "name": tenant.name,
            "id": tenant.id
        },
        "services": [Service(**parse_from_mongo(s)) for s in services],
        "staff": [Staff(**parse_from_mongo(s)) for s in staff]
    }

@api_router.post("/public/{tenant_slug}/appointments")
async def create_public_appointment(tenant_slug: str, appointment_data: AppointmentCreate):
    tenant_doc = await db.tenants.find_one({"slug": tenant_slug, "active": True})
    if not tenant_doc:
        raise HTTPException(status_code=404, detail="Geschäft nicht gefunden")
    
    tenant = Tenant(**parse_from_mongo(tenant_doc))
    
    # Check plan limits for current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    appointments_this_month = await db.appointments.count_documents({
        "tenant_id": tenant.id,
        "start_at": {"$gte": month_start.isoformat()},
        "status": "confirmed"
    })
    
    plan_limits = {"trial": 30, "starter": 200, "pro": 400}
    if appointments_this_month >= plan_limits[tenant.plan]:
        raise HTTPException(status_code=400, detail="Monatliches Terminlimit erreicht")
    
    # Check trial expiry
    if tenant.plan == PlanType.TRIAL and tenant.trial_end and now > tenant.trial_end:
        raise HTTPException(status_code=400, detail="Probezeitraum abgelaufen")
    
    # Get service to calculate end time
    service_doc = await db.services.find_one({"id": appointment_data.service_id, "tenant_id": tenant.id})
    if not service_doc:
        raise HTTPException(status_code=400, detail="Service nicht gefunden")
    
    service = Service(**parse_from_mongo(service_doc))
    end_time = appointment_data.start_at + timedelta(minutes=service.duration_minutes + service.buffer_minutes)
    
    # Check for conflicts
    conflicts = await db.appointments.find({
        "tenant_id": tenant.id,
        "staff_id": appointment_data.staff_id,
        "status": "confirmed",
        "$or": [
            {"start_at": {"$lt": end_time.isoformat()}, "end_at": {"$gt": appointment_data.start_at.isoformat()}}
        ]
    }).to_list(1)
    
    if conflicts:
        raise HTTPException(status_code=400, detail="Terminkonflikt - Zeit bereits vergeben")
    
    appointment = Appointment(
        tenant_id=tenant.id,
        **appointment_data.dict(),
        end_at=end_time
    )
    
    appointment_dict = prepare_for_mongo(appointment.dict())
    await db.appointments.insert_one(appointment_dict)
    
    return {"message": "Termin erfolgreich gebucht!", "appointment": appointment}

# Appointments endpoints
@api_router.get("/appointments")
async def get_appointments(current_tenant: Tenant = Depends(get_current_tenant)):
    appointments_docs = await db.appointments.find({"tenant_id": current_tenant.id}).to_list(1000)
    appointments = []
    
    for apt_doc in appointments_docs:
        # Get service and staff info for display
        service_doc = await db.services.find_one({"id": apt_doc["service_id"]})
        staff_doc = await db.staff.find_one({"id": apt_doc["staff_id"]})
        
        apt = parse_from_mongo(apt_doc)
        # Add display information
        if service_doc:
            apt["service_name"] = service_doc["name"]
            apt["price_chf"] = service_doc["price_chf"]
            apt["duration_minutes"] = service_doc["duration_minutes"]
        if staff_doc:
            apt["staff_name"] = staff_doc["name"]
            apt["staff_color"] = staff_doc.get("color_tag", "#3B82F6")
        
        appointments.append(apt)
    
    return appointments

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment_data: AppointmentCreate, current_tenant: Tenant = Depends(get_current_tenant)):
    # Get service to calculate end time
    service_doc = await db.services.find_one({"id": appointment_data.service_id, "tenant_id": current_tenant.id})
    if not service_doc:
        raise HTTPException(status_code=400, detail="Service nicht gefunden")
    
    service = Service(**parse_from_mongo(service_doc))
    end_time = appointment_data.start_at + timedelta(minutes=service.duration_minutes + service.buffer_minutes)
    
    # Check for conflicts
    conflicts = await db.appointments.find({
        "tenant_id": current_tenant.id,
        "staff_id": appointment_data.staff_id,
        "status": "confirmed",
        "$or": [
            {"start_at": {"$lt": end_time.isoformat()}, "end_at": {"$gt": appointment_data.start_at.isoformat()}}
        ]
    }).to_list(1)
    
    if conflicts:
        raise HTTPException(status_code=400, detail="Terminkonflikt - Zeit bereits vergeben")
    
    # Check plan limits for current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    appointments_this_month = await db.appointments.count_documents({
        "tenant_id": current_tenant.id,
        "start_at": {"$gte": month_start.isoformat()},
        "status": "confirmed"
    })
    
    plan_limits = {"trial": 30, "starter": 200, "pro": 400}
    if appointments_this_month >= plan_limits[current_tenant.plan]:
        raise HTTPException(status_code=400, detail="Monatliches Terminlimit erreicht")
    
    appointment = Appointment(
        tenant_id=current_tenant.id,
        **appointment_data.dict(),
        end_at=end_time
    )
    
    appointment_dict = prepare_for_mongo(appointment.dict())
    await db.appointments.insert_one(appointment_dict)
    
    return appointment

class AppointmentUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None

@api_router.put("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, appointment_data: AppointmentUpdate, current_tenant: Tenant = Depends(get_current_tenant)):
    # Find the appointment
    appointment_doc = await db.appointments.find_one({
        "id": appointment_id,
        "tenant_id": current_tenant.id
    })
    
    if not appointment_doc:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
    
    # Prepare update data
    update_data = {}
    if appointment_data.customer_name is not None:
        update_data["customer_name"] = appointment_data.customer_name
    if appointment_data.customer_email is not None:
        update_data["customer_email"] = appointment_data.customer_email
    if appointment_data.customer_phone is not None:
        update_data["customer_phone"] = appointment_data.customer_phone
    if appointment_data.notes is not None:
        update_data["notes"] = appointment_data.notes
    if appointment_data.status is not None:
        update_data["status"] = appointment_data.status
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Keine Aktualisierungsdaten bereitgestellt")
    
    # Update appointment
    await db.appointments.update_one(
        {"id": appointment_id, "tenant_id": current_tenant.id},
        {"$set": update_data}
    )
    
    # Get updated appointment
    updated_doc = await db.appointments.find_one({
        "id": appointment_id,
        "tenant_id": current_tenant.id
    })
    
    return Appointment(**parse_from_mongo(updated_doc))

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, current_tenant: Tenant = Depends(get_current_tenant)):
    # Find and delete the appointment
    result = await db.appointments.delete_one({
        "id": appointment_id,
        "tenant_id": current_tenant.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
    
    return {"message": "Termin erfolgreich gelöscht", "appointment_id": appointment_id}

# Stripe Payment Endpoints
@api_router.post("/payments/checkout/session")
async def create_checkout_session(checkout_data: CheckoutRequest, current_tenant: Tenant = Depends(get_current_tenant)):
    """Create a Stripe checkout session for plan upgrades"""
    
    # Validate package exists
    if checkout_data.package_id not in PLAN_PACKAGES:
        raise HTTPException(status_code=400, detail="Ungültiges Planpaket")
    
    package = PLAN_PACKAGES[checkout_data.package_id]
    
    # Check if tenant is already on this plan or higher
    if current_tenant.plan == package["plan_type"]:
        raise HTTPException(status_code=400, detail="Sie haben bereits diesen Plan")
    
    # Get amount from server-side definition only (security)
    amount = package["amount"]
    currency = package["currency"]
    
    # Initialize Stripe checkout
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe Konfigurationsfehler")
    
    try:
        # Build URLs from provided origin (security)
        success_url = f"{checkout_data.origin_url}/dashboard?payment_success={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{checkout_data.origin_url}/dashboard?payment_cancelled=true"
        
        # Create webhook URL
        webhook_url = f"{checkout_data.origin_url}/api/webhook/stripe"
        
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency=currency.lower(),
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "tenant_id": current_tenant.id,
                "package_id": checkout_data.package_id,
                "plan_upgrade_to": package["plan_type"],
                "source": "plan_upgrade"
            }
        )
        
        # Create Stripe checkout session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        payment_transaction = PaymentTransaction(
            tenant_id=current_tenant.id,
            session_id=session.session_id,
            amount=amount,
            currency=currency,
            plan_upgrade_to=package["plan_type"],
            payment_status="pending",
            status="initiated",
            metadata={
                "package_id": checkout_data.package_id,
                "package_name": package["name"],
                "stripe_session_id": session.session_id
            }
        )
        
        # Store in database
        transaction_dict = prepare_for_mongo(payment_transaction.dict())
        await db.payment_transactions.insert_one(transaction_dict)
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Fehler beim Erstellen der Zahlung")

@api_router.get("/payments/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, current_tenant: Tenant = Depends(get_current_tenant)):
    """Get the status of a Stripe checkout session and update payment transaction"""
    
    # Get payment transaction from database
    transaction_doc = await db.payment_transactions.find_one({
        "session_id": session_id,
        "tenant_id": current_tenant.id
    })
    
    if not transaction_doc:
        raise HTTPException(status_code=404, detail="Zahlungssession nicht gefunden")
    
    transaction = PaymentTransaction(**parse_from_mongo(transaction_doc))
    
    # Don't check again if already processed successfully
    if transaction.payment_status == "paid" and transaction.status == "completed":
        return {
            "status": transaction.status,
            "payment_status": transaction.payment_status,
            "amount_total": int(transaction.amount * 100),  # Convert to cents
            "currency": transaction.currency.lower(),
            "metadata": transaction.metadata
        }
    
    # Initialize Stripe checkout
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    webhook_url = "https://dummy-webhook-url.com"  # Not used for status check
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        # Get status from Stripe
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database if status changed
        if checkout_status.payment_status != transaction.payment_status or checkout_status.status != transaction.status:
            
            # Update transaction
            update_data = {
                "payment_status": checkout_status.payment_status,
                "status": checkout_status.status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.payment_transactions.update_one(
                {"session_id": session_id, "tenant_id": current_tenant.id},
                {"$set": update_data}
            )
            
            # If payment successful and not already processed, upgrade tenant plan
            if (checkout_status.payment_status == "paid" and 
                checkout_status.status == "complete" and 
                transaction.payment_status != "paid"):
                
                # Upgrade tenant plan
                if transaction.plan_upgrade_to:
                    await db.tenants.update_one(
                        {"id": current_tenant.id},
                        {"$set": {"plan": transaction.plan_upgrade_to}}
                    )
                    
                    logger.info(f"Upgraded tenant {current_tenant.id} to plan {transaction.plan_upgrade_to}")
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "metadata": checkout_status.metadata
        }
        
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail="Fehler beim Abrufen des Zahlungsstatus")

@api_router.post("/webhook/stripe")
async def handle_stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    
    try:
        # Get request body and headers
        body = await request.body()
        stripe_signature = request.headers.get("Stripe-Signature")
        
        if not stripe_signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Initialize Stripe checkout
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        webhook_url = "https://dummy-webhook-url.com"  # Not used for webhook handling
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Process webhook event
        if webhook_response.event_type in ["checkout.session.completed", "payment_intent.succeeded"]:
            session_id = webhook_response.session_id
            
            # Find transaction
            transaction_doc = await db.payment_transactions.find_one({"session_id": session_id})
            
            if transaction_doc:
                transaction = PaymentTransaction(**parse_from_mongo(transaction_doc))
                
                # Update transaction status
                update_data = {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": update_data}
                )
                
                # Upgrade tenant plan if not already done
                if (webhook_response.payment_status == "paid" and 
                    transaction.plan_upgrade_to and 
                    transaction.payment_status != "paid"):
                    
                    await db.tenants.update_one(
                        {"id": transaction.tenant_id},
                        {"$set": {"plan": transaction.plan_upgrade_to}}
                    )
                    
                    logger.info(f"Webhook: Upgraded tenant {transaction.tenant_id} to plan {transaction.plan_upgrade_to}")
        
        return {"received": True}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing error")

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()