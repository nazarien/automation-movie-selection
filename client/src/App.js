import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

const STATUS_CODE = {
  pending: 'pending',
  fulfilled: 'fulfilled',
  rejected: 'rejected',
};

function App() {
  const [book, setBook] = useState({});
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setStatus(STATUS_CODE.pending);
    fetch('/categories')
      .then((res) => res.json())
      .then((categoriesResponse) => {
        setCategories(categoriesResponse);
        setBook({
          title: categoriesResponse[0].book,
          author: categoriesResponse[0].authorName,
        });
        setStatus(STATUS_CODE.fulfilled);
      })
      .catch(() => {
        setStatus(STATUS_CODE.rejected);
      });
  }, []);

  const handleCategory = (event) => {
    const category = event.target.value;
    const bookCategory = categories.find((item) => item.category === category);
    if (bookCategory) {
      setBook({ title: bookCategory.book, author: bookCategory.authorName });
    }
  };

  const handleSubmit = () => {
    fetch(
      `/amazon-search?${new URLSearchParams({
        book: book.title,
        authorName: book.author,
      })}`,
      { method: 'POST' }
    );
  };

  const isFulfilled = status === STATUS_CODE.fulfilled;
  const isPending = status === STATUS_CODE.pending;

  return (
    <div className="app">
      <main className="appMain">
        {isFulfilled && (
          <>
            <label className="selectLabel" htmlFor="categories">
              Choose a category and you will be redirected to the amazon book page
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
        )}
        {!isFulfilled && (
          <>
            <img src={logo} className="appLogo" alt="logo" />
              {isPending
                ? <p>Loading...</p>
                : <p className="errorMessage">Something went wrong please refresh the page</p>
              }
          </>
        )}
      </main>
    </div>
  );
}

export default App;
