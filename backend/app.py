```python
# backend/app.py

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import the core sentiment analysis logic
from services.sentiment_analyzer import analyze_sentiment_for_text

# Load environment variables from .env file
load_dotenv()

# --- Application Setup ---

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# --- Configuration ---

# Load configuration from environment variables
# In a production environment, these would be set in the deployment environment
# (e.g., Docker environment variables, Kubernetes secrets)
FLASK_ENV = os.getenv('FLASK_ENV', 'production')
PORT = int(os.getenv('PORT', 5001))
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# URLs for interconnected services (demonstrating microservice architecture awareness)
RECIPE_SERVICE_URL = os.getenv('RECIPE_SERVICE_URL')
MARKDOWN_SERVICE_URL = os.getenv('MARKDOWN_SERVICE_URL')

# --- CORS Configuration ---

# Enable Cross-Origin Resource Sharing (CORS) to allow the React frontend
# to communicate with this backend API.
# In a production environment, it's more secure to restrict this to the specific
# frontend domain (e.g., `origins=[FRONTEND_URL]`).
CORS(app, resources={r"/api/*": {"origins": "*"}})

logger.info("AI-Powered News Aggregator Backend is starting...")
logger.info(f"Flask environment: {FLASK_ENV}")
logger.info(f"CORS enabled for frontend at: {FRONTEND_URL}")
if RECIPE_SERVICE_URL:
    logger.info(f"Aware of Recipe Book service at: {RECIPE_SERVICE_URL}")
if MARKDOWN_SERVICE_URL:
    logger.info(f"Aware of Markdown Previewer service at: {MARKDOWN_SERVICE_URL}")


# --- API Endpoints ---

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint.
    Provides a simple response to indicate that the service is running.
    Useful for load balancers, container orchestrators (like Kubernetes),
    and general monitoring.
    ---
    responses:
      200:
        description: Service is healthy.
        schema:
          type: object
          properties:
            status:
              type: string
              example: "ok"
            service:
              type: string
              example: "news-aggregator-sentiment-analysis"
    """
    return jsonify({
        "status": "ok",
        "service": "news-aggregator-sentiment-analysis"
    }), 200


@app.route('/api/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    """
    Analyzes the sentiment of a given piece of text.
    Expects a JSON payload with a 'text' key.
    ---
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            text:
              type: string
              description: The article text to be analyzed.
              example: "This is a fantastic piece of journalism. Truly insightful."
    responses:
      200:
        description: Sentiment analysis successful.
        schema:
          type: object
          properties:
            polarity:
              type: number
              description: The polarity score of the text (-1 to 1).
            subjectivity:
              type: number
              description: The subjectivity score of the text (0 to 1).
            sentiment:
              type: string
              description: A categorical label for the sentiment (positive, neutral, negative).
      400:
        description: Bad Request - Missing or invalid 'text' field in the request body.
      500:
        description: Internal Server Error - An unexpected error occurred during analysis.
    """
    logger.info("Received request for sentiment analysis.")

    # 1. Validate request data
    if not request.is_json:
        logger.warning("Request is not JSON.")
        return jsonify({"error": "Invalid request: payload must be JSON."}), 400

    data = request.get_json()
    article_text = data.get('text')

    if not article_text or not isinstance(article_text, str):
        logger.warning("Missing or invalid 'text' field in payload.")
        return jsonify({"error": "Missing or invalid 'text' field in payload."}), 400

    # 2. Perform sentiment analysis
    try:
        # Delegate the core logic to the sentiment analyzer service
        sentiment_result = analyze_sentiment_for_text(article_text)
        logger.info(f"Successfully analyzed sentiment: {sentiment_result['sentiment']}")
        return jsonify(sentiment_result), 200

    except Exception as e:
        # 3. Handle unexpected errors
        logger.error(f"An unexpected error occurred during sentiment analysis: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while analyzing sentiment."}), 500


# --- Main Execution ---

if __name__ == '__main__':
    # This block is executed when the script is run directly.
    # It's suitable for local development.
    # For production, a WSGI server like Gunicorn or uWSGI should be used.
    # Example: gunicorn --bind 0.0.0.0:5001 app:app
    app.run(host='0.0.0.0', port=PORT, debug=(FLASK_ENV == 'development'))
```