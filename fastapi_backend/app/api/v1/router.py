from fastapi import APIRouter
from app.api.v1 import auth, pos, inventory, analytics, anomalies, customers, branches

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(pos.router, prefix="/pos", tags=["POS"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(anomalies.router, prefix="/ai/anomalies", tags=["AI Anomalies"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(branches.router, prefix="/branches", tags=["Branches"])
