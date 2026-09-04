from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    youtube_api_key: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.1-flash-lite"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
