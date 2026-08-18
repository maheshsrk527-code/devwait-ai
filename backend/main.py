import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai


# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

# Load backend/.env
load_dotenv(BASE_DIR / ".env")


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.6-flash"
)

DEVWAIT_API_KEY = os.getenv("DEVWAIT_API_KEY")


# ============================================================
# ENVIRONMENT VALIDATION
# ============================================================

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not configured in backend/.env"
    )

if not DEVWAIT_API_KEY:
    raise RuntimeError(
        "DEVWAIT_API_KEY is not configured in backend/.env"
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=GEMINI_API_KEY,
    vertexai=False
)


# ============================================================
# DEBUG INFORMATION
# ============================================================

print("========================================")
print("DevWait AI Backend")
print("========================================")
print("Gemini API key loaded:", bool(GEMINI_API_KEY))
print(
    "Gemini API key length:",
    len(GEMINI_API_KEY)
)
print("Gemini model:", GEMINI_MODEL)
print("DevWait API key loaded:", bool(DEVWAIT_API_KEY))
print("Using Vertex AI: False")
print("========================================")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="DevWait AI",
    version="0.4.0",
    description="AI-powered developer assistant."
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class AIRequest(BaseModel):
    prompt: str


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "status": "online",
        "service": "DevWait AI",
        "version": "0.4.0"
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
# AI ENDPOINT
# ============================================================

@app.post("/ai")
def generate_ai(request: AIRequest):

    # --------------------------------------------------------
    # Validate prompt
    # --------------------------------------------------------

    prompt = request.prompt.strip()

    if not prompt:

        raise HTTPException(
            status_code=422,
            detail="Prompt cannot be empty."
        )


    # --------------------------------------------------------
    # Validate Gemini configuration
    # --------------------------------------------------------

    if not GEMINI_API_KEY:

        raise HTTPException(
            status_code=500,
            detail="Missing Gemini API key."
        )


    # --------------------------------------------------------
    # Validate DevWait configuration
    # --------------------------------------------------------

    if not DEVWAIT_API_KEY:

        raise HTTPException(
            status_code=500,
            detail="Missing DevWait API key."
        )


    # --------------------------------------------------------
    # Call Gemini
    # --------------------------------------------------------

    try:

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )


        # ----------------------------------------------------
        # Get Gemini response
        # ----------------------------------------------------

        ai_text = response.text or ""


        if not ai_text:

            raise HTTPException(
                status_code=500,
                detail="Gemini returned an empty response."
            )


        # ----------------------------------------------------
        # Return response
        # ----------------------------------------------------

        return {
            "success": True,
            "model": GEMINI_MODEL,
            "response": ai_text
        }


    # --------------------------------------------------------
    # Gemini/API errors
    # --------------------------------------------------------

    except HTTPException:

        raise


    except Exception as error:

        print("Gemini API error:", str(error))

        raise HTTPException(
            status_code=500,
            detail=f"Gemini API error: {str(error)}"
        )