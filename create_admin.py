from config.database import db
from models.user import User
from app import app

def create_admin(username, password):
    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(username=username).first()
        if admin:
            print("Admin user already exists!")
            return

        # Create new admin user
        admin = User(username=username, is_admin=True)
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"Admin user '{username}' created successfully!")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    create_admin(username, password)
