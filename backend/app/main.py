# backend/app/main.py
import time
from collections import defaultdict
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.database import Base, engine
from app.routers import (
    health,
    auth,
    businesses,
    parties,
    items,
    invoices,
    payments,
    dashboard,
    reports,
    admin,
)

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BiLU ERP API",
    description="Secure GST billing, accounting, and ERP backend for Indian businesses by Pravara Infotech Pvt. Ltd.",
    version="1.0.0",
)

# Security Middleware 1: HTTP Security Headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

# Security Middleware 2: Sliding-Window Rate Limiter on sensitive auth endpoints
class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/auth"):
            client_ip = request.client.host if request.client else "127.0.0.1"
            now = time.time()
            cutoff = now - self.window_seconds
            self.requests[client_ip] = [t for t in self.requests[client_ip] if t > cutoff]

            if len(self.requests[client_ip]) >= self.max_requests:
                return Response(
                    content='{"detail": "Rate limit exceeded. Please try again after 60 seconds."}',
                    status_code=429,
                    media_type="application/json",
                )
            self.requests[client_ip].append(now)

        response = await call_next(request)
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuthRateLimitMiddleware)

# CORS allow all in development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(businesses.router)
app.include_router(parties.router)
app.include_router(items.router)
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "app": "BiLU ERP API",
        "tagline": "Everything Your Business Needs",
        "powered_by": "Pravara Infotech Pvt. Ltd.",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
