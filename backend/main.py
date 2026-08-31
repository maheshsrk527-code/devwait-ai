import os
import time
import random
import secrets
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai


# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)

DEVWAIT_API_KEY = os.getenv("DEVWAIT_API_KEY")


# Optional fallback model
GEMINI_FALLBACK_MODEL = os.getenv(
    "GEMINI_FALLBACK_MODEL",
    ""
).strip()


# ============================================================
# ENVIRONMENT VALIDATION
# ============================================================

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured."
    )

if not DEVWAIT_API_KEY:
    raise RuntimeError(
        "DEVWAIT_API_KEY is not configured."
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=GEMINI_API_KEY,
    vertexai=False
)


# ============================================================
# FASTAPI
# ============================================================

limiter = Limiter(
    key_func=get_remote_address
)

app = FastAPI(
    title="DevWait AI",
    version="0.6.0",
    description="AI-powered developer assistant."
)

app.state.limiter = limiter


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "X-DevWait-Key"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class AIRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=20000
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "service": "DevWait AI",
        "version": "0.6.0"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "devwait_configured": bool(DEVWAIT_API_KEY),
        "model": GEMINI_MODEL
    }


# ============================================================
# GEMINI REQUEST WITH RETRY
# ============================================================

def generate_with_retry(model: str, prompt: str):

    max_attempts = 3

    for attempt in range(max_attempts):

        try:

            return client.models.generate_content(
                model=model,
                contents=prompt
            )

        except Exception as error:

            error_text = str(error)

            print(
                f"Gemini attempt {attempt + 1}/{max_attempts} "
                f"failed: {error_text}"
            )

            # Retry transient server/rate-limit errors
            transient_errors = (
                "503",
                "UNAVAILABLE",
                "429",
                "RESOURCE_EXHAUSTED",
                "500",
                "INTERNAL"
            )

            if not any(
                item in error_text.upper()
                for item in transient_errors
            ):
                raise

            if attempt == max_attempts - 1:
                raise

            delay = (2 ** attempt) + random.uniform(0, 1)

            print(
                f"Retrying Gemini in {delay:.2f} seconds..."
            )

            time.sleep(delay)


# ============================================================
# AI ENDPOINT
# ============================================================

@app.post("/ai")
@limiter.limit("20/minute")
def generate_ai(
    request: Request,
    body: AIRequest,
    x_devwait_key: str | None = Header(
        default=None,
        alias="X-DevWait-Key"
    )
):

    # --------------------------------------------------------
    # AUTHENTICATION
    # --------------------------------------------------------

    if not x_devwait_key:

        raise HTTPException(
            status_code=401,
            detail="Missing DevWait API key."
        )

    if not secrets.compare_digest(
        x_devwait_key,
        DEVWAIT_API_KEY
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid DevWait API key."
        )


    # --------------------------------------------------------
    # VALIDATE PROMPT
    # --------------------------------------------------------

    prompt = body.prompt.strip()

    if not prompt:

        raise HTTPException(
            status_code=422,
            detail="Prompt cannot be empty."
        )


    # --------------------------------------------------------
    # PRIMARY MODEL
    # --------------------------------------------------------

    try:

        response = generate_with_retry(
            GEMINI_MODEL,
            prompt
        )

        ai_text = response.text or ""

        if ai_text:

            return {
                "success": True,
                "model": GEMINI_MODEL,
                "response": ai_text
            }


    except Exception as primary_error:

        print(
            "Primary Gemini model failed:",
            str(primary_error)
        )


        # ----------------------------------------------------
        # FALLBACK MODEL
        # ----------------------------------------------------

        if GEMINI_FALLBACK_MODEL:

            print(
                "Trying fallback model:",
                GEMINI_FALLBACK_MODEL
            )

            try:

                response = generate_with_retry(
                    GEMINI_FALLBACK_MODEL,
                    prompt
                )

                ai_text = response.text or ""

                if ai_text:

                    return {
                        "success": True,
                        "model": GEMINI_FALLBACK_MODEL,
                        "response": ai_text
                    }

            except Exception as fallback_error:

                print(
                    "Fallback Gemini model failed:",
                    str(fallback_error)
                )


        raise HTTPException(
            status_code=503,
            detail=(
                "Gemini is temporarily unavailable. "
                "Please try again shortly."
            )
        )