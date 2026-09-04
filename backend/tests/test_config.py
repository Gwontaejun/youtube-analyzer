from app.core.config import Settings


def test_default_gemini_model_uses_verified_lite_model(monkeypatch) -> None:
    monkeypatch.delenv("GEMINI_MODEL", raising=False)

    settings = Settings(_env_file=None)

    assert settings.gemini_model == "gemini-3.1-flash-lite"
