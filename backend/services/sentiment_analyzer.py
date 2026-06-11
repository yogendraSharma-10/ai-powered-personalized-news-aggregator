```python
# backend/services/sentiment_analyzer.py

import logging
from typing import Any, Dict, Optional

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Configure logging for the service
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    A service class for performing sentiment analysis on text using NLTK's VADER.

    VADER (Valence Aware Dictionary and sEntiment Reasoner) is a lexicon and rule-based
    sentiment analysis tool that is specifically attuned to sentiments expressed in social media,
    and works well on texts from other domains as well.
    """

    _instance = None

    def __new__(cls):
        """
        Singleton pattern to ensure only one instance of the analyzer is created,
        preventing repeated downloads and initializations.
        """
        if cls._instance is None:
            cls._instance = super(SentimentAnalyzer, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """
        Initializes the SentimentIntensityAnalyzer and ensures the VADER lexicon is downloaded.
        The initialization is guarded to run only once.
        """
        if self._initialized:
            return
        self.analyzer = None
        try:
            self._download_vader_lexicon()
            self.analyzer = SentimentIntensityAnalyzer()
            logger.info("SentimentIntensityAnalyzer initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize SentimentIntensityAnalyzer: {e}")
            # The analyzer will remain None, and subsequent calls will fail gracefully.
        self._initialized = True

    def _download_vader_lexicon(self):
        """
        Downloads the VADER lexicon required by NLTK's SentimentIntensityAnalyzer
        if it's not already present on the system.
        """
        try:
            # Check if the lexicon is already available
            nltk.data.find("sentiment/vader_lexicon.zip")
            logger.info("VADER lexicon is already downloaded.")
        except LookupError:
            # If not found, download it
            logger.info("VADER lexicon not found. Attempting to download...")
            nltk.download("vader_lexicon")
            logger.info("VADER lexicon downloaded successfully.")

    def _classify_sentiment(self, compound_score: float) -> str:
        """
        Classifies sentiment into 'positive', 'negative', or 'neutral'
        based on the VADER compound score.

        The thresholds are standard practice for VADER.

        Args:
            compound_score (float): The VADER compound score, ranging from -1 to 1.

        Returns:
            str: The sentiment classification ('positive', 'negative', 'neutral').
        """
        if compound_score >= 0.05:
            return "positive"
        elif compound_score <= -0.05:
            return "negative"
        else:
            return "neutral"

    def analyze(self, text: Optional[str]) -> Dict[str, Any]:
        """
        Analyzes the sentiment of a given piece of text.

        Args:
            text (Optional[str]): The text content to analyze. Can be None or empty.

        Returns:
            Dict[str, Any]: A dictionary containing the sentiment classification
                            and the detailed polarity scores from VADER. Returns a
                            default neutral score for invalid or empty input.
        """
        # Default response for uninitialized analyzer or invalid input
        default_response = {
            "sentiment": "neutral",
            "scores": {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0},
        }

        if not self.analyzer:
            logger.error("Sentiment analyzer is not available. Returning default response.")
            return default_response

        if not isinstance(text, str) or not text.strip():
            logger.warning("Input text is empty or invalid. Returning neutral sentiment.")
            return default_response

        try:
            scores = self.analyzer.polarity_scores(text)
            sentiment_label = self._classify_sentiment(scores["compound"])

            return {"sentiment": sentiment_label, "scores": scores}
        except Exception as e:
            logger.error(f"An unexpected error occurred during sentiment analysis: {e}")
            # Return a default neutral response in case of an unexpected error
            return default_response


# Example usage for direct execution and testing
if __name__ == "__main__":
    # Instantiate the analyzer service
    analyzer = SentimentAnalyzer()

    # --- Test Cases ---
    test_cases = {
        "Positive Text": "This is a fantastic article! The author provides deep insights and a hopeful outlook on the future.",
        "Negative Text": "The report highlights a disastrous economic downturn with no signs of recovery. It's truly grim.",
        "Neutral Text": "The company announced its quarterly earnings report will be released next Tuesday.",
        "Mixed Text": "The movie was visually stunning, but the plot was predictable and disappointing.",
        "Empty Text": "",
        "None Input": None,
    }

    for name, text in test_cases.items():
        print(f"--- Analyzing: {name} ---")
        result = analyzer.analyze(text)
        print(f"Input: '{str(text)[:70]}...'")
        print(f"Result: {result}\n")

```