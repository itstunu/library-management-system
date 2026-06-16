import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { search, id } = req.query;

      if (id) {
        const { rows } = await sql`SELECT * FROM members WHERE id = ${id}`;
        return res.status(200).json(rows[0] || null);
      }

      if (search) {
        const term = `%${search}%`;
        const { rows } = await sql`
          SELECT * FROM members 
          WHERE name ILIKE ${term} OR email ILIKE ${term} OR member_id ILIKE ${term} OR phone ILIKE ${term}
          ORDER BY name ASC
        `;
        return res.status(200).json(rows);
      }

      const { rows } = await sql`SELECT * FROM members ORDER BY name ASC`;
      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const { name, email, phone } = req.body;
      // Auto-generate member_id
      const { rows: countRows } = await sql`SELECT COUNT(*) as count FROM members`;
      const count = parseInt(countRows[0].count) + 1;
      const member_id = `MEM-${String(count).padStart(3, "0")}`;

      const { rows } = await sql`
        INSERT INTO members (name, email, phone, member_id)
        VALUES (${name}, ${email}, ${phone}, ${member_id})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === "PUT") {
      const { id, name, email, phone } = req.body;
      const { rows } = await sql`
        UPDATE members SET name=${name}, email=${email}, phone=${phone}
        WHERE id=${id} RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      await sql`DELETE FROM members WHERE id=${id}`;
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error("Members API error:", error);
    res.status(500).json({ error: error.message });
  }
}
