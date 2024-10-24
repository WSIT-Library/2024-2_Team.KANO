# app.py

from flask import Flask
from flask_cors import CORS
from config import Config
from routes import register_routes
from utils.response import create_response

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all domains and routes
    CORS(app)

    # Register all routes
    register_routes(app)

    # Global error handler
    @app.errorhandler(404)
    def not_found(error):
        return create_response(404, "Resource not found")

    @app.errorhandler(405)
    def method_not_allowed(error):
        return create_response(405, "Method not allowed")

    @app.errorhandler(500)
    def internal_error(error):
        return create_response(500, "Internal Server Error")

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
