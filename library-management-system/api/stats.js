import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const [booksRes, membersRes, borrowedRes, overdueRes, finesRes] = await Promise.all([
      sql`SELECT COUNT(*) as count, SUM(total_copies) as total_copies, SUM(available_copies) as available FROM books`,
      sql`SELECT COUNT(*) as count FROM members`,
      sql`SELECT COUNT(*) as count FROM borrowings WHERE status = 'borrowed'`,
      sql`SELECT COUNT(*) as count FROM borrowings WHERE status = 'borrowed' AND due_date < CURRENT_DATE`,
      sql`SELECT COALESCE(SUM(fine_amount), 0) as total_fines, COALESCE(SUM(CASE WHEN fine_paid THEN fine_amount ELSE 0 END), 0) as paid_fines FROM borrowings WHERE fine_amount > 0`
    ]);

    res.status(200).json({
      total_books: parseInt(booksRes.rows[0].count),
      total_copies: parseInt(booksRes.rows[0].total_copies) || 0,
      available_copies: parseInt(booksRes.rows[0].available) || 0,
      total_members: parseInt(membersRes.rows[0].count),
      books_borrowed: parseInt(borrowedRes.rows[0].count),
      overdue_books: parseInt(overdueRes.rows[0].count),
      total_fines: parseFloat(finesRes.rows[0].total_fines),
      paid_fines: parseFloat(finesRes.rows[0].paid_fines)
    });
  } catch (error) {
    console.error("Stats API error:", error);
    res.status(500).json({ error: error.message });
  }
}
