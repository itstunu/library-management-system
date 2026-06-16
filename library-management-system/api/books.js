import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { search, id } = req.query;

      if (id) {
        const { rows } = await sql`SELECT * FROM books WHERE id = ${id}`;
        return res.status(200).json(rows[0] || null);
      }

      if (search) {
        const term = `%${search}%`;
        const { rows } = await sql`
          SELECT * FROM books 
          WHERE title ILIKE ${term} OR author ILIKE ${term} OR isbn ILIKE ${term} OR category ILIKE ${term}
          ORDER BY title ASC
        `;
        return res.status(200).json(rows);
      }

      const { rows } = await sql`SELECT * FROM books ORDER BY title ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { title, author, isbn, category, total_copies } = req.body;
      const copies = parseInt(total_copies) || 1;
      const { rows } = await sql`
        INSERT INTO books (title, author, isbn, category, total_copies, available_copies)
        VALUES (${title}, ${author}, ${isbn}, ${category}, ${copies}, ${copies})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, title, author, isbn, category, total_copies } = req.body;
      const { rows } = await sql`
        UPDATE books SET title=${title}, author=${author}, isbn=${isbn}, category=${category}, total_copies=${total_copies}
        WHERE id=${id} RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      await sql`DELETE FROM books WHERE id=${id}`;
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error("Books API error:", error);
    res.status(500).json({ error: error.message });
  }
}
