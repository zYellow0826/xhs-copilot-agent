from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DEEPSEEK_API_KEY: str
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL_CHAT: str = "deepseek-chat"
    DEEPSEEK_MODEL_REASONER: str = "deepseek-reasoner"
    DEEPSEEK_MAX_TOKENS: int = 4096
    DEEPSEEK_TIMEOUT_SECONDS: float = 60.0
    DEEPSEEK_RETRY_MAX: int = 2

    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_KEY: str | None = None

    CORS_ALLOW_ORIGINS: str = "*"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_SERVICE_KEY)


settings = Settings()
