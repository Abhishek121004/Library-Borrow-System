import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://library-borrow-system.onrender.com/api";
export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingBookId, setPendingBookId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/books`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load books.");
      }

      setBooks(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateBook(bookId, action) {
    try {
      setPendingBookId(bookId);
      setError("");
      setNotice("");

      const response = await fetch(`${API_BASE_URL}/books/${bookId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Unable to ${action} book.`);
      }

      setBooks((currentBooks) =>
        currentBooks.map((book) => (book.id === data.id ? data : book))
      );
      setNotice(
        action === "borrow"
          ? `Borrowed "${data.title}" successfully.`
          : `Returned "${data.title}" successfully.`
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPendingBookId(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <h1>Library Borrow System</h1>
        <p className="hero-copy">
          Track limited inventory, borrow available books, and return them without
          letting quantities drift past their fixed limits.
        </p>
      </section>

      <section className="status-panel">
        <div>
          <span className="label">Catalog status</span>
          <strong>{books.length} books loaded</strong>
        </div>
        <button className="refresh-button" onClick={loadBooks} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {notice ? <p className="notice success">{notice}</p> : null}
      {error ? <p className="notice error">{error}</p> : null}

      {loading ? (
        <section className="empty-state">
          <p>Loading catalog...</p>
        </section>
      ) : (
        <section className="book-grid">
          {books.map((book) => {
            const borrowedCount = book.quantity - book.availableCopies;
            const isPending = pendingBookId === book.id;

            return (
              <article className="book-card" key={book.id}>
                <div className="book-card__header">
                  <p className="book-author">{book.author}</p>
                  <span
                    className={
                      book.availableCopies === 0 ? "chip chip--danger" : "chip"
                    }
                  >
                    {book.availableCopies} available
                  </span>
                </div>

                <h2>{book.title}</h2>

                <dl className="book-metrics">
                  <div>
                    <dt>Total copies</dt>
                    <dd>{book.quantity}</dd>
                  </div>
                  <div>
                    <dt>Borrowed</dt>
                    <dd>{borrowedCount}</dd>
                  </div>
                </dl>

                <div className="book-actions">
                  <button
                    onClick={() => updateBook(book.id, "borrow")}
                    disabled={book.availableCopies === 0 || isPending}
                  >
                    {isPending ? "Working..." : "Borrow"}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => updateBook(book.id, "return")}
                    disabled={borrowedCount === 0 || isPending}
                  >
                    Return
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
