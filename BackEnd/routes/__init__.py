# routes/__init__.py

from .chat import chat_bp
from .auth import auth_bp
from .challenge import challenge_bp
from .action import action_bp

def register_routes(app):
    app.register_blueprint(chat_bp)
    app.register_blueprint(challenge_bp)
    app.register_blueprint(action_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')  # 회원가입 라우트 등록