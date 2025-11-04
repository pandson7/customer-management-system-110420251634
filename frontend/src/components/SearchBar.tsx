import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search customers by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;
