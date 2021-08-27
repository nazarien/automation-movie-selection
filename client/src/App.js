import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [book, setBook] = useState('');
  const [categories, setCategories] = useState([]);
  const [authorName, setAuthorName] = useState('');

  useEffect(() => {
    fetch('/categories')
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        setBook(data[0].book);
        setAuthorName(data[0].authorName);
      })
      .catch((error) => console.log(`error`, error));
  }, []);

  const handleCategory = (event) => {
    const category = event.target.value;
    setBook(categories.find((item) => item.category === category).book);
    setAuthorName(
      categories.find((item) => item.category === category).authorName
    );
  };

  const handleSubmit = () => {
    fetch(
      `/amazon-search?${new URLSearchParams({
        book,
        authorName,
      })}`
    )
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((error) => console.log(`error`, error));
  };

  return (
    <div className="App">
      <header className="App-header">
        {categories.length ? (
          <>
            <label className="label" htmlFor="categories">
              Choose a category:
            </label>
            <select name="categories" id="categories" onChange={handleCategory}>
              {categories.map((item) => (
                <option value={item.category} key={item.category}>
                  {item.category}
                </option>
              ))}
            </select>
            <button
              className="submitButton"
              type="submit"
              onClick={handleSubmit}
            >
              Go
            </button>
          </>
        ) : (
          <>
            <img src={logo} className="App-logo" alt="logo" />
            <p>Loading...</p>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
