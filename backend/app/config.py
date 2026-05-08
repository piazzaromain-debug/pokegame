from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: str = "postgresql+asyncpg://pokegame:pokegame_dev@db:5432/pokegame"
    secret_key: str = "dev_secret"
    log_level: str = "INFO"


settings = Settings()
