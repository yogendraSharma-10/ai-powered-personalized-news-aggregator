import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ArticleCard from './components/ArticleCard';
import { fetchArticles, fetchSources } from './services/api';
import './App.css';

/**
 * The main application component for the AI-Powered News Aggregator.
 * It manages state for articles, sources, filters, and handles data fetching.
 *
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  // State for storing articles and available news sources
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);

  // State for user-configurable filters
  const [selectedSources, setSelectedSources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all'); // 'all', 'positive', 'negative', 'neutral'

  // State for UI feedback (loading and errors)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches the list of available news sources from the API on component mount.
   */
  useEffect(() => {
    const getSources = async () => {
      try {
        const availableSources = await fetchSources();
        setSources(availableSources);
        // Pre-select the first few sources for a better initial experience
        setSelectedSources(availableSources.slice(0, 3).map(s => s.id));
      } catch (err) {
        console.error("Failed to fetch sources:", err);
        setError('Could not load news sources. Please try again later.');
      }
    };

    getSources();
  }, []);

  /**
   * Fetches articles from the backend based on the current search term and selected sources.
   * This function is memoized with useCallback to prevent unnecessary re-creations.
   */
  const getArticles = useCallback(async () => {
    if (selectedSources.length === 0) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchArticles(selectedSources, searchTerm);
      setArticles(data);
    } catch (err) {
      console.error("Failed to fetch articles:", err);
      setError('Failed to fetch articles. The server might be busy.');
      setArticles([]); // Clear articles on error
    } finally {
      setLoading(false);
    }
  }, [selectedSources, searchTerm]);

  /**
   * Effect to trigger article fetching when filters change.
   */
  useEffect(() => {
    getArticles();
  }, [getArticles]);

  /**
   * Handles changes to the source selection checkboxes.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The input change event.
   */
  const handleSourceChange = (event) => {
    const { value, checked } = event.target;
    setSelectedSources(prev =>
      checked ? [...prev, value] : prev.filter(sourceId => sourceId !== value)
    );
  };

  /**
   * Handles changes to the sentiment filter dropdown.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The select change event.
   */
  const handleSentimentFilterChange = (event) => {
    setSentimentFilter(event.target.value);
  };
  
  /**
   * Filters articles based on the selected sentiment.
   * useMemo ensures this filtering logic only re-runs when articles or the filter change.
   */
  const filteredArticles = useMemo(() => {
    if (sentimentFilter === 'all') {
      return articles;
    }
    return articles.filter(article => article.sentiment && article.sentiment.label.toLowerCase() === sentimentFilter);
  }, [articles, sentimentFilter]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>AI-Powered News Aggregator</h1>
          <p>Your personalized news feed, with sentiment analysis.</p>
        </div>
        <nav className="cross-service-nav">
          <span>Explore our other services:</span>
          <a href={process.env.REACT_APP_MARKDOWN_PREVIEWER_URL || '#'} target="_blank" rel="noopener noreferrer">Markdown Previewer</a>
          <a href={process.env.REACT_APP_RECIPE_BOOK_URL || '#'} target="_blank" rel="noopener noreferrer">Recipe Book</a>
        </nav>
      </header>

      <main className="App-main">
        <aside className="sidebar">
          <h2>Filters</h2>
          
          <div className="filter-group">
            <h3>Sources</h3>
            <div className="source-list">
              {sources.map(source => (
                <div key={source.id} className="source-item">
                  <input
                    type="checkbox"
                    id={source.id}
                    value={source.id}
                    checked={selectedSources.includes(source.id)}
                    onChange={handleSourceChange}
                  />
                  <label htmlFor={source.id}>{source.name}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h3>Search</h3>
            <input
              type="text"
              placeholder="Search by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <h3>Sentiment</h3>
            <select value={sentimentFilter} onChange={handleSentimentFilterChange} className="sentiment-select">
              <option value="all">All</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          <button onClick={getArticles} disabled={loading} className="refresh-button">
            {loading ? 'Refreshing...' : 'Refresh Feed'}
          </button>
        </aside>

        <section className="content">
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading-spinner"></div>
          ) : (
            <>
              {filteredArticles.length > 0 ? (
                <div className="articles-grid">
                  {filteredArticles.map((article, index) => (
                    <ArticleCard key={article.url || index} article={article} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>No Articles Found</h2>
                  <p>Try adjusting your filters or selecting more sources.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="App-footer">
        <p>&copy; {new Date().getFullYear()} AI News Aggregator. Part of an interconnected microservice suite.</p>
      </footer>
    </div>
  );
}

export default App;