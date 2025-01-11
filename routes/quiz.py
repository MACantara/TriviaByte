from flask import Flask, jsonify, request
from models.analytics import QuestionAnalytics

app = Flask(__name__)

@app.route('/api/analytics/log', methods=['POST'])
def log_analytics():
    data = request.get_json()
    
    QuestionAnalytics.log_answer(
        question_id=data['question_id'],
        question_text=data['question_text'],
        is_correct=data['is_correct'],
        time_taken=data['time_taken'],
        score=data['score']
    )
    
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
