from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash
import secrets
import base64
from config.settings import Config
import logging

logger = logging.getLogger(__name__)

class PasswordService:
    def __init__(self):
        """Initialize password service with Argon2 configuration."""
        self.ph = PasswordHasher(
            time_cost=Config.PASSWORD_HASH_TIME_COST,
            memory_cost=Config.PASSWORD_HASH_MEMORY_COST,
            parallelism=Config.PASSWORD_HASH_PARALLELISM,
            hash_len=Config.PASSWORD_HASH_LENGTH,
            salt_len=Config.PASSWORD_SALT_LENGTH
        )
        self.pepper = Config.PEPPER.encode() if Config.PEPPER else b''

    def hash_password(self, password: str) -> tuple[str, str]:
        """
        Hash a password using Argon2 with salt and pepper.
        
        Args:
            password: The plain text password to hash
            
        Returns:
            tuple: (hash, salt) where both are base64 encoded strings
        """
        try:
            # Generate a unique salt
            salt = secrets.token_bytes(Config.PASSWORD_SALT_LENGTH)
            
            # Combine password with pepper and salt
            peppered = password.encode() + self.pepper
            salted = peppered + salt
            
            # Hash the combination
            password_hash = self.ph.hash(salted)
            
            # Encode salt for storage
            salt_b64 = base64.b64encode(salt).decode('utf-8')
            
            return password_hash, salt_b64
            
        except Exception as e:
            logger.error(f"Error hashing password: {str(e)}")
            raise

    def verify_password(self, password: str, stored_hash: str, stored_salt: str) -> bool:
        """
        Verify a password against its hash using the stored salt and pepper.
        
        Args:
            password: The plain text password to verify
            stored_hash: The stored Argon2 hash
            stored_salt: The stored base64 encoded salt
            
        Returns:
            bool: True if password matches, False otherwise
        """
        try:
            # Decode stored salt
            salt = base64.b64decode(stored_salt.encode('utf-8'))
            
            # Combine password with pepper and salt
            peppered = password.encode() + self.pepper
            salted = peppered + salt
            
            # Verify the password
            self.ph.verify(stored_hash, salted)
            return True
            
        except VerifyMismatchError:
            return False
        except InvalidHash:
            logger.error("Invalid hash format detected")
            return False
        except Exception as e:
            logger.error(f"Error verifying password: {str(e)}")
            return False

    def needs_rehash(self, stored_hash: str) -> bool:
        """
        Check if the hash needs to be updated due to parameter changes.
        
        Args:
            stored_hash: The stored Argon2 hash
            
        Returns:
            bool: True if rehash is needed, False otherwise
        """
        try:
            return self.ph.check_needs_rehash(stored_hash)
        except Exception:
            return True
