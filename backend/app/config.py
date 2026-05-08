from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://pokegame:pokegame_dev@db:5432/pokegame"
    secret_key: str = "dev_secret"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"


settings = Settings()
