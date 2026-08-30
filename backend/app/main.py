from fastapi import FastAPI

from app.api.analyze import router as analyze_router
from app.api.youtube import router as youtube_router

app = FastAPI(title="YouTube Analyzer API", version="0.1.0")
app.include_router(analyze_router)
app.include_router(youtube_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
