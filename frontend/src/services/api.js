```javascript
import axios from 'axios';

/**
 * Centralized module for all API interactions.
 * It configures a base Axios instance and exports functions for each API endpoint,
 * promoting a clean and maintainable way to manage backend communication.
 */

// --- Configuration ---

// The base URL for the AI-Powered News Aggregator backend API.
// It's configured via environment variables to allow for different environments
// (development, staging, production). Falls back to a local default.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Base URL for the interconnected Personal Recipe Book service.
// This demonstrates a microservice architecture where the frontend can
// communicate with multiple backend services.
const RECIPE_SERVICE_URL = process.env.REACT_APP_RECIPE_SERVICE_URL || 'http://localhost:8081/api';


// --- Axios Instances ---

/**
 * Main Axios instance for communicating with the News Aggregator backend.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // In a real-world application, an authentication token would be added here,
    // likely through an interceptor that reads it from local storage or a cookie.
    // e.g., 'Authorization': `Bearer ${getAuthToken()}`
  },
  timeout: 10000, // 10-second timeout for requests
});

/**
 * Axios instance for the external Personal Recipe Book service.
 */
const recipeApiClient = axios.create({
    baseURL: RECIPE_SERVICE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 5000, // Shorter timeout for non-critical, auxiliary services
});


// --- Interceptors ---

// Add a response interceptor for global error handling and logging.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging purposes.
    const errorMessage = error.response
      ? `API Error: ${error.response.status} ${error.response.statusText} on ${error.config.url}`
      : `API Error: ${error.message}`;
    console.error(errorMessage);
    
    // You could add more sophisticated error handling here, like redirecting
    // to a login page for 401 Unauthorized errors.
    
    return Promise.reject(error);
  }
);


// --- API Service Methods ---

/**
 * Fetches a list of articles based on specified filters.
 * @param {object} params - The query parameters for filtering articles.
 * @param {string} [params.category] - The news category (e.g., 'technology').
 * @param {string} [params.sources] - Comma-separated list of news source IDs.
 * @param {string} [params.q] - A search query string for keywords.
 * @param {number} [params.page=1] - The page number for pagination.
 * @param {number} [params.pageSize=20] - The number of articles per page.
 * @returns {Promise<object>} A promise that resolves to the API response data,
 *                            typically { articles: [], totalResults: number }.
 * @throws {Error} Throws a user-friendly error if the API request fails.
 */
export const fetchArticles = async (params = {}) => {
  try {
    const response = await apiClient.get('/articles', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw new Error('Could not retrieve news articles. The server may be unavailable.');
  }
};

/**
 * Requests sentiment analysis for a given article URL from the backend.
 * @param {string} articleUrl - The full URL of the article to be analyzed.
 * @returns {Promise<object>} A promise that resolves to the sentiment analysis result
 *                            (e.g., { sentiment: 'positive', score: 0.95 }).
 * @throws {Error} Throws a user-friendly error if the analysis fails.
 */
export const fetchArticleSentiment = async (articleUrl) => {
  if (!articleUrl) {
    throw new Error('An article URL is required for sentiment analysis.');
  }
  try {
    // The backend expects a JSON payload with the URL.
    const response = await apiClient.post('/sentiment', { url: articleUrl });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch sentiment for ${articleUrl}:`, error);
    throw new Error('Sentiment analysis is currently unavailable.');
  }
};

/**
 * Fetches the current user's personalization preferences.
 * NOTE: In a real app, this would be an authenticated endpoint.
 * @returns {Promise<object>} A promise that resolves to the user's preferences object.
 * @throws {Error} Throws a user-friendly error if fetching fails.
 */
export const fetchUserPreferences = async () => {
    try {
      const response = await apiClient.get('/user/preferences');
      // e.g., { preferredCategories: ['technology', 'science'], blockedSources: ['daily-mail'] }
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
      throw new Error('Could not load your personalization settings.');
    }
};

/**
 * Updates the user's personalization preferences on the server.
 * @param {object} preferences - The new preferences object to save.
 * @returns {Promise<object>} A promise that resolves to the updated preferences object from the server.
 * @throws {Error} Throws a user-friendly error if saving fails.
 */
export const updateUserPreferences = async (preferences) => {
    try {
      const response = await apiClient.put('/user/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw new Error('Could not save your preferences. Please try again.');
    }
};


// --- Cross-Service API Methods ---

/**
 * Fetches recipes from the Personal Recipe Book service that are related to news article keywords.
 * This demonstrates cross-service communication in a microservice architecture.
 * This function fails gracefully (returns an empty array) as it's a non-critical feature.
 * @param {Array<string>} keywords - An array of keywords from a news article.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of related recipe objects.
 */
export const fetchRelatedRecipes = async (keywords) => {
    if (!keywords || keywords.length === 0) {
        return [];
    }
    try {
        const response = await recipeApiClient.get('/search', {
            params: { query: keywords.join(' ') } // Assuming recipe API takes a space-separated query
        });
        return response.data.recipes || [];
    } catch (error) {
        // For non-critical, cross-service features, it's often better to fail silently
        // and log a warning rather than breaking the user experience.
        console.warn('Could not fetch related recipes from external service:', error.message);
        return [];
    }
};
```