from flask import Flask
from config.settings import Config
from config.database import init_db
from routes.quiz_routes import quiz_bp
from routes.auth_routes import auth_bp

# Create Flask app instance
app = Flask(__name__)
app.config.from_object(Config)

# Initialize database (will only create tables if they don't exist)
init_db(app)

# Register blueprints
app.register_blueprint(quiz_bp)
app.register_blueprint(auth_bp, url_prefix='/auth')

# Only use this for local development
if __name__ == '__main__' and not os.getenv('VERCEL_ENV'):
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)