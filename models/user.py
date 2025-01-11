from config.database import db
from services import PasswordService  # Updated import

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(500), nullable=False)
    password_salt = db.Column(db.String(100), nullable=False)  # Add salt column
    is_admin = db.Column(db.Boolean, default=False)

    _password_service = PasswordService()

    def set_password(self, password: str) -> None:
        """Hash password and store both hash and salt."""
        hash, salt = self._password_service.hash_password(password)
        self.password_hash = hash
        self.password_salt = salt

    def check_password(self, password: str) -> bool:
        """Verify password using stored hash and salt."""
        return self._password_service.verify_password(
            password,
            self.password_hash,
            self.password_salt
        )
