from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

class SleepEstimateRequest(BaseModel):
    eyeOpenness: float = Field(..., ge=0, le=100)
    blinkRate: float = Field(..., ge=0)
    facialTension: float = Field(..., ge=0, le=100)
    skinTone: float = Field(..., ge=0, le=100)
    darkCircles: float = Field(..., ge=0, le=100)

class SleepEstimateResponse(BaseModel):
    estimatedSleepHours: float
    fatigueLevel: float
    alertnessScore: float
    recommendedRestMinutes: int
    alertLevel: str
    alertMessage: str

app = FastAPI(
    title="Python Sleep Detection Service",
    description="Computes sleep estimation and alert level from facial metrics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"]
)


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def compute_sleep_estimate(data: SleepEstimateRequest) -> SleepEstimateResponse:
    eye_factor = (100 - data.eyeOpenness) * 1.0
    blink_factor = max(0, 20 - data.blinkRate) * 1.2
    tension_factor = data.facialTension * 1.1
    skin_factor = max(0, 50 - data.skinTone) * 0.7
    dark_circle_factor = data.darkCircles * 1.0

    raw_fatigue = (eye_factor + blink_factor + tension_factor + skin_factor + dark_circle_factor) / 5.0
    fatigue_level = clamp(raw_fatigue, 0, 100)
    estimated_sleep_hours = clamp(8 - (fatigue_level / 100) * 6, 2, 8)
    alertness_score = clamp(100 - fatigue_level, 0, 100)
    recommended_rest_minutes = int(max(0, (6 - estimated_sleep_hours) * 15))

    if estimated_sleep_hours < 5 and alertness_score < 50:
        alert_level = "critical"
        alert_message = (
            f"Severe sleep deprivation detected: {estimated_sleep_hours:.1f}h sleep, "
            f"alertness {alertness_score:.0f}%. Rest immediately."
        )
    elif estimated_sleep_hours < 6 and alertness_score < 60:
        alert_level = "warning"
        alert_message = (
            f"Moderate sleep deprivation detected: {estimated_sleep_hours:.1f}h sleep, "
            f"alertness {alertness_score:.0f}%. Take a short break soon."
        )
    else:
        alert_level = "normal"
        alert_message = (
            f"Sleep levels appear acceptable: {estimated_sleep_hours:.1f}h sleep, "
            f"alertness {alertness_score:.0f}%.")

    return SleepEstimateResponse(
        estimatedSleepHours=round(estimated_sleep_hours, 1),
        fatigueLevel=round(fatigue_level, 1),
        alertnessScore=round(alertness_score, 1),
        recommendedRestMinutes=recommended_rest_minutes,
        alertLevel=alert_level,
        alertMessage=alert_message,
    )


@app.get("/health")
def health_check():
    return {"success": True, "message": "Python sleep detection service is running."}


@app.post("/sleep-estimate")
def sleep_estimate(request: SleepEstimateRequest):
    try:
        return compute_sleep_estimate(request)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
