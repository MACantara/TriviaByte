from flask import Flask
from config.settings import Config
from config.database import init_db

# Create Flask app instance first
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database
init_db(app)

# Import routes after app creation to avoid circular imports
from routes.quiz_routes import quiz_bp

# Register blueprints
app.register_blueprint(quiz_bp)

# Local development server
if __name__ == '__main__':
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)