```javascript
import React from 'react';
import PropTypes from 'prop-types';

/**
 * A simple utility to format an ISO date string for user-friendly display.
 * @param {string} isoString - The ISO date string to format.
 * @returns {string} A formatted date string (e.g., "January 1, 2023").
 */
const formatDate = (isoString) => {
  if (!isoString) return 'Date unknown';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * A helper to determine the visual style and label for the sentiment score.
 * @param {object} sentiment - The sentiment object from the backend.
 * @returns {object} An object with `backgroundColor` and `label` for styling.
 */
const getSentimentStyle = (sentiment) => {
  if (!sentiment || typeof sentiment.score !== 'number' || !sentiment.label) {
    return {
      backgroundColor: '#6c757d', // Gray for neutral/unknown
      label: 'Neutral'
    };
  }

  const score = sentiment.score.toFixed(2);

  switch (sentiment.label.toLowerCase()) {
    case 'positive':
      return {
        backgroundColor: '#28a745', // Green
        label: `Positive (${score})`
      };
    case 'negative':
      return {
        backgroundColor: '#dc3545', // Red
        label: `Negative (${score})`
      };
    case 'neutral':
    default:
      return {
        backgroundColor: '#6c757d', // Gray
        label: `Neutral (${score})`
      };
  }
};

/**
 * ArticleCard Component
 *
 * A presentational component that displays a single news article in a card format.
 * It includes the article's image, title, source, date, description, and a
 * sentiment analysis badge. It also features a conditional button for cross-service
 * integration with a "Personal Recipe Book" service.
 *
 * @param {object} props - The component props.
 * @param {object} props.article - The article object to display.
 */
const ArticleCard = ({ article }) => {
  // Destructure for easier access and cleaner code
  const {
    title,
    description,
    url,
    urlToImage,
    publishedAt,
    source,
    sentiment,
  } = article;

  const sentimentStyle = getSentimentStyle(sentiment);

  // Use a placeholder image if the article doesn't provide one
  const imageUrl = urlToImage || 'https://via.placeholder.com/400x200.png?text=News';

  // Cross-service integration: Check if the article might be a recipe.
  // This is a simplified example based on source name for demonstration purposes.
  const isRecipeSource = source?.name && /recipe|food|cooking/i.test(source.name);

  /**
   * Handles the click event for saving an article to the Recipe Book.
   * In a real application, this would trigger an API call to the Recipe Book microservice.
   * @param {React.MouseEvent} e - The mouse event.
   */
  const handleSaveToRecipeBook = (e) => {
    e.preventDefault(); // Prevent the parent link's navigation
    e.stopPropagation(); // Stop event bubbling
    // In a real app, this would call an API endpoint for the Recipe Book service
    // e.g., recipeBookApi.saveArticleAsRecipe({ title, url, source: source.name });
    alert(`'${title}' would be sent to the Personal Recipe Book service for processing!`);
  };

  return (
    <div className="article-card">
      <a href={url} target="_blank" rel="noopener noreferrer" className="article-card-link">
        <img
          src={imageUrl}
          alt={title}
          className="article-image"
          // Add a fallback for broken image links
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x200.png?text=Image+Not+Found'; }}
        />
        <div className="article-content">
          <div className="article-meta">
            <span className="article-source">{source?.name || 'Unknown Source'}</span>
            <span className="article-date">{formatDate(publishedAt)}</span>
          </div>
          <h3 className="article-title">{title}</h3>
          <p className="article-description">{description}</p>
        </div>
      </a>
      <div className="article-footer">
        {sentiment && (
          <div
            className="sentiment-badge"
            style={{ backgroundColor: sentimentStyle.backgroundColor }}
            title={`Sentiment Analysis Score: ${sentiment.score?.toFixed(2) || 'N/A'}`}
          >
            {sentimentStyle.label}
          </div>
        )}
        {isRecipeSource && (
          <button onClick={handleSaveToRecipeBook} className="recipe-button">
            Save to Recipe Book
          </button>
        )}
      </div>
    </div>
  );
};

// PropTypes for type-checking, crucial for production-ready components
ArticleCard.propTypes = {
  article: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    url: PropTypes.string.isRequired,
    urlToImage: PropTypes.string,
    publishedAt: PropTypes.string,
    source: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // API can return null object
      name: PropTypes.string,
    }),
    sentiment: PropTypes.shape({
      score: PropTypes.number,
      label: PropTypes.string,
    }),
  }).isRequired,
};

// Default props for graceful degradation if some data is missing from the API
ArticleCard.defaultProps = {
  article: {
    description: 'No description available.',
    urlToImage: null,
    publishedAt: '',
    source: {
      name: 'Unknown Source',
    },
    sentiment: null,
  },
};

export default ArticleCard;
```