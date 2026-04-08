import path from "node:path";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "library.db");

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath);

const seedBooks = [
  { title: "Clean Code", author: "Robert C. Martin", quantity: 4 },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", quantity: 3 },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", quantity: 2 },
  { title: "Refactoring", author: "Martin Fowler", quantity: 5 }
];

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this);
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });

export const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });

export async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity >= 0),
      available_copies INTEGER NOT NULL CHECK(available_copies >= 0 AND available_copies <= quantity)
    )
  `);

  const result = await get("SELECT COUNT(*) AS count FROM books");

  if (result.count === 0) {
    for (const book of seedBooks) {
      await run(
        `
          INSERT INTO books (title, author, quantity, available_copies)
          VALUES (?, ?, ?, ?)
        `,
        [book.title, book.author, book.quantity, book.quantity]
      );
    }
  }
}

export async function borrowBook(bookId) {
  const result = await run(
    `
      UPDATE books
      SET available_copies = available_copies - 1
      WHERE id = ? AND available_copies > 0
    `,
    [bookId]
  );

  if (result.changes === 0) {
    return null;
  }

  return getBookById(bookId);
}

export async function returnBook(bookId) {
  const result = await run(
    `
      UPDATE books
      SET available_copies = available_copies + 1
      WHERE id = ? AND available_copies < quantity
    `,
    [bookId]
  );

  if (result.changes === 0) {
    return null;
  }

  return getBookById(bookId);
}

export function getBookById(bookId) {
  return get(
    `
      SELECT
        id,
        title,
        author,
        quantity,
        available_copies AS availableCopies
      FROM books
      WHERE id = ?
    `,
    [bookId]
  );
}
