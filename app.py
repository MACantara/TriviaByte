from flask import Flask
from config.settings import Config
from config.database import init_db
from routes.quiz_routes import quiz_bp
from routes.auth_routes import auth_bp
from routes.analytics import analytics_bp  # Updated import name

app = Flask(__name__)

# Configure app
app.config.from_object(Config)

# Initialize database
init_db(app)

# Register blueprints
app.register_blueprint(quiz_bp)
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(analytics_bp, url_prefix='/analytics')  # Updated blueprint name

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return {'error': 'Not Found'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal Server Error'}, 500

if __name__ == '__main__':
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )