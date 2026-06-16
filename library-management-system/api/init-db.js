import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Create books table
    await sql`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(100),
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create members table
    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        member_id VARCHAR(50) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create borrowings table
    await sql`
      CREATE TABLE IF NOT EXISTS borrowings (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id),
        member_id INTEGER REFERENCES members(id),
        borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE NOT NULL,
        return_date DATE,
        fine_amount DECIMAL(10,2) DEFAULT 0,
        fine_paid BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) DEFAULT 'borrowed',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Seed sample books if empty
    const { rows } = await sql`SELECT COUNT(*) as count FROM books`;
    if (parseInt(rows[0].count) === 0) {
      await sql`
        INSERT INTO books (title, author, isbn, category, total_copies, available_copies) VALUES
        ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'Fiction', 3, 3),
        ('To Kill a Mockingbird', 'Harper Lee', '978-0061935466', 'Fiction', 2, 2),
        ('1984', 'George Orwell', '978-0451524935', 'Dystopian', 4, 4),
        ('Clean Code', 'Robert C. Martin', '978-0132350884', 'Technology', 2, 2),
        ('The Pragmatic Programmer', 'Andy Hunt', '978-0135957059', 'Technology', 2, 2),
        ('Sapiens', 'Yuval Noah Harari', '978-0062316097', 'History', 3, 3),
        ('Atomic Habits', 'James Clear', '978-0735211292', 'Self-Help', 3, 3),
        ('Dune', 'Frank Herbert', '978-0441013593', 'Science Fiction', 2, 2)
      `;

      // Seed sample members
      await sql`
        INSERT INTO members (name, email, phone, member_id) VALUES
        ('Alice Rahman', 'alice@example.com', '01711000001', 'MEM-001'),
        ('Bob Islam', 'bob@example.com', '01711000002', 'MEM-002'),
        ('Carol Ahmed', 'carol@example.com', '01711000003', 'MEM-003')
      `;
    }

    res.status(200).json({ success: true, message: "Database initialized successfully" });
  } catch (error) {
    console.error("DB init error:", error);
    res.status(500).json({ error: error.message });
  }
}
