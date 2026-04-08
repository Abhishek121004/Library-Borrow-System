CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity >= 0),
  available_copies INTEGER NOT NULL CHECK(available_copies >= 0 AND available_copies <= quantity)
);

INSERT INTO books (title, author, quantity, available_copies)
VALUES
('Clean Code', 'Robert C. Martin', 4, 4),
('The Pragmatic Programmer', 'Andrew Hunt', 3, 3),
('Designing Data-Intensive Applications', 'Martin Kleppmann', 2, 2),
('Refactoring', 'Martin Fowler', 5, 5);
