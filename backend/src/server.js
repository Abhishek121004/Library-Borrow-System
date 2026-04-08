import cors from "cors";
import express from "express";
import {
  all,
  borrowBook,
  getBookById,
  initializeDatabase,
  returnBook
} from "./db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/books", async (_request, response) => {
  try {
    const books = await all(`
      SELECT
        id,
        title,
        author,
        quantity,
        available_copies AS availableCopies
      FROM books
      ORDER BY title ASC
    `);

    response.json(books);
  } catch (error) {
    response.status(500).json({ message: "Unable to load books." });
  }
});

app.post("/api/books/:id/borrow", async (request, response) => {
  try {
    const bookId = Number(request.params.id);

    if (Number.isNaN(bookId)) {
      response.status(400).json({ message: "Book id must be a number." });
      return;
    }

    const updatedBook = await borrowBook(bookId);

    if (!updatedBook) {
      const existingBook = await getBookById(bookId);

      if (!existingBook) {
        response.status(404).json({ message: "Book not found." });
        return;
      }

      response.status(409).json({ message: "No copies are available to borrow." });
      return;
    }

    response.json(updatedBook);
  } catch (error) {
    response.status(500).json({ message: "Unable to borrow the book." });
  }
});

app.post("/api/books/:id/return", async (request, response) => {
  try {
    const bookId = Number(request.params.id);

    if (Number.isNaN(bookId)) {
      response.status(400).json({ message: "Book id must be a number." });
      return;
    }

    const updatedBook = await returnBook(bookId);

    if (!updatedBook) {
      const existingBook = await getBookById(bookId);

      if (!existingBook) {
        response.status(404).json({ message: "Book not found." });
        return;
      }

      response.status(409).json({ message: "All copies are already in the library." });
      return;
    }

    response.json(updatedBook);
  } catch (error) {
    response.status(500).json({ message: "Unable to return the book." });
  }
});

initializeDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the existing server or change PORT.`);
        process.exit(1);
        return;
      }

      console.error("Failed to start the server.", error);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize the database.", error);
    process.exit(1);
  });
