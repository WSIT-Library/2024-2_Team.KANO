# routes/__init__.py

from .chat import chat_bp

def register_routes(app):
    app.register_blueprint(chat_bp)
