import socketio

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:8080"],
    logger=False,
    engineio_logger=False,
)
