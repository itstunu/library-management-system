import { sql } from "@vercel/postgres";

const FINE_PER_DAY = 5; // BDT 5 per day overdue
const LOAN_DAYS = 14;   // 14-day lending period

function calculateFine(dueDate, returnDate) {
  const due = new Date(dueDate);
  const ret = new Date(returnDate || new Date());
  ret.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffMs = ret - due;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * FINE_PER_DAY : 0;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // GET - list borrowings with joins
    if (req.method === "GET") {
      const { status, member_id, book_id } = req.query;

      let query = `
        SELECT b.*, 
          bk.title as book_title, bk.author as book_author, bk.isbn as book_isbn,
          m.name as member_name, m.member_id as member_code, m.email as member_email
        FROM borrowings b
        JOIN books bk ON b.book_id = bk.id
        JOIN members m ON b.member_id = m.id
      `;
      const conditions = [];
      const params = [];

      if (status) { conditions.push(`b.status = $${params.length + 1}`); params.push(status); }
      if (member_id) { conditions.push(`b.member_id = $${params.length + 1}`); params.push(member_id); }
      if (book_id) { conditions.push(`b.book_id = $${params.length + 1}`); params.push(book_id); }

      if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
      query += ` ORDER BY b.created_at DESC`;

      const { rows } = await sql.query(query, params);

      // Recalculate fine for active borrowings
      const enriched = rows.map(row => ({
        ...row,
        current_fine: row.status === "borrowed"
          ? calculateFine(row.due_date, new Date())
          : row.fine_amount
      }));

      return res.status(200).json(enriched);
    }

    // POST - borrow a book
    if (req.method === "POST") {
      const { book_id, member_id } = req.body;

      // Check availability
      const { rows: bookRows } = await sql`SELECT * FROM books WHERE id = ${book_id}`;
      if (!bookRows[0] || bookRows[0].available_copies < 1) {
        return res.status(400).json({ error: "Book not available" });
      }

      // Check member has no overdue fines
      const { rows: overdueRows } = await sql`
        SELECT COUNT(*) as count FROM borrowings 
        WHERE member_id = ${member_id} AND status = 'borrowed' AND due_date < CURRENT_DATE
      `;
      if (parseInt(overdueRows[0].count) > 0) {
        return res.status(400).json({ error: "Member has overdue books. Please return them first." });
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + LOAN_DAYS);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      // Create borrowing
      const { rows } = await sql`
        INSERT INTO borrowings (book_id, member_id, due_date, status)
        VALUES (${book_id}, ${member_id}, ${dueDateStr}, 'borrowed')
        RETURNING *
      `;

      // Decrease available copies
      await sql`UPDATE books SET available_copies = available_copies - 1 WHERE id = ${book_id}`;

      return res.status(201).json(rows[0]);
    }

    // PUT - return a book
    if (req.method === "PUT") {
      const { id, fine_paid } = req.body;

      const { rows: borrowRows } = await sql`SELECT * FROM borrowings WHERE id = ${id}`;
      if (!borrowRows[0]) return res.status(404).json({ error: "Borrowing not found" });

      const borrowing = borrowRows[0];
      if (borrowing.status === "returned") {
        return res.status(400).json({ error: "Book already returned" });
      }

      const today = new Date().toISOString().split("T")[0];
      const fine = calculateFine(borrowing.due_date, today);

      const { rows } = await sql`
        UPDATE borrowings 
        SET return_date = ${today}, fine_amount = ${fine}, fine_paid = ${fine_paid || false}, status = 'returned'
        WHERE id = ${id}
        RETURNING *
      `;

      // Increase available copies
      await sql`UPDATE books SET available_copies = available_copies + 1 WHERE book_id = ${borrowing.book_id}`;
      // Fix: use correct column name
      await sql`UPDATE books SET available_copies = available_copies + 1 WHERE id = ${borrowing.book_id}`;

      return res.status(200).json({ ...rows[0], fine_amount: fine });
    }

  } catch (error) {
    console.error("Borrowings API error:", error);
    res.status(500).json({ error: error.message });
  }
}
