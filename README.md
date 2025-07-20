# TriviaByte - Dynamic Quiz Generator

A Flask-based web application that generates customized quizzes using Google's Gemini AI. The application features a difficulty-based gaming system with prizes and interactive gameplay.

## Features

- **Difficulty-Based Gaming System**: Choose from Easy, Medium, or Hard levels
- **Prize System**: Win different rewards based on difficulty:
  - Easy: Candy 🍭
  - Medium: Biscuit 🍪  
  - Hard: Keychain 🔑
- Dynamic quiz generation based on user-specified topics
- Support for multiple question types:
  - Multiple Choice
- Interactive game interface with timers, scoring, and streaks
- Clean and responsive user interface
- Admin panel for generating custom quizzes
- Analytics dashboard for question performance tracking
- Powered by Google's Gemini AI for intelligent question generation

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Dynamic_Quiz_Generator.git
cd Dynamic_Quiz_Generator
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
```

3. Install the required dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your web browser and navigate to `http://localhost:5000`

3. Use the interface to:
   - **For Players**: Click "Play Game" to select difficulty level and play
   - **For Admins**: Login to generate custom quizzes with topic and difficulty selection
   - Choose from Easy, Medium, or Hard difficulty levels
   - Win prizes based on your chosen difficulty level

## Database Setup

After installation, run the database migration to add difficulty support to existing questions:

```bash
python migrate_difficulty.py
```

## Admin Setup

To create an admin user for generating custom quizzes:

```bash
python create_admin.py
```

Follow the prompts to create your admin credentials.

## Game Features

### Difficulty Levels
- **Easy**: Basic knowledge questions - Win Candy 🍭
- **Medium**: Moderate difficulty questions - Win Biscuit 🍪  
- **Hard**: Challenging expert-level questions - Win Keychain 🔑

### Gameplay Features
- Interactive timer-based questions (30 seconds each)
- Scoring system with streak bonuses
- Background music and sound effects
- Mobile-responsive design
- Real-time analytics tracking

## Project Structure

```
TriviaByte/
├── app.py                    # Main Flask application
├── init_db.py               # Database initialization
├── create_admin.py          # Admin user creation
├── migrate_difficulty.py    # Database migration for difficulty system
├── requirements.txt         # Python dependencies
├── vercel.json             # Vercel deployment config
├── config/                 # Configuration files
│   ├── database.py         # Database configuration
│   └── settings.py         # Application settings
├── models/                 # Database models
│   ├── quiz.py            # Quiz and Question models
│   ├── user.py            # User model
│   └── analytics.py       # Analytics model
├── routes/                 # Application routes
│   ├── quiz_routes.py     # Quiz-related routes
│   ├── auth_routes.py     # Authentication routes
│   └── analytics.py       # Analytics routes
├── services/              # Business logic layer
│   ├── ai_service.py      # AI integration service
│   ├── quiz_service.py    # Quiz generation service
│   ├── database_service.py # Database operations
│   └── password_service.py # Password utilities
├── static/                # Static files
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── sounds/           # Audio files for game
└── templates/            # HTML templates
    ├── base.html         # Base template
    ├── index.html        # Main page
    ├── level_selection.html # Difficulty selection page
    ├── auth/             # Authentication templates
    ├── analytics/        # Analytics templates
    └── components/       # Reusable components
```

## Dependencies

- Flask: Web framework
- python-dotenv: Environment variable management
- google-genai: Google Gemini AI integration

## Getting a Gemini API Key

1. Visit the [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your `.env` file

## Contributing

Feel free to open issues or submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.
