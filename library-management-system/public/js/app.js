/* ================================================
   LibraryOS — Frontend Application
================================================ */

const API = "";  // Same origin on Vercel

// ── State ──────────────────────────────────────
const state = {
  currentPage: "dashboard",
  selectedBook: null,
  selectedMember: null,
  selectedBorrowing: null,
  books: [],
  members: [],
  borrowings: [],
  stats: {}
};

// ── Router ──────────────────────────────────────
const PAGES = {
  dashboard: { title: "Dashboard", render: renderDashboard },
  books: { title: "Books", render: renderBooks },
  members: { title: "Members", render: renderMembers },
  borrow: { title: "Borrow Book", render: renderBorrow },
  return: { title: "Return Book", render: renderReturn },
  borrowings: { title: "All Borrowings", render: renderBorrowings }
};

function navigate(page) {
  state.currentPage = page;
  document.querySelectorAll(".nav-link").forEach(l => {
    l.classList.toggle("active", l.dataset.page === page);
  });
  document.getElementById("topbarTitle").textContent = PAGES[page].title;
  closeSidebar();
  PAGES[page].render();
}

// ── API Helpers ─────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ── Init DB ─────────────────────────────────────
async function initDB() {
  try {
    await apiFetch("/api/init-db");
  } catch (e) {
    console.error("DB init:", e);
  }
}

// ── Toast ───────────────────────────────────────
let toastTimer;
function toast(msg, type = "info") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove("show"); }, 3200);
}

// ── Modal ───────────────────────────────────────
function openModal(title, bodyHTML) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = bodyHTML;
  document.getElementById("modalBackdrop").classList.add("open");
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
}

// ── Sidebar ─────────────────────────────────────
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}

// ── Formatters ──────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function daysOverdue(dueDate) {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0,0,0,0); due.setHours(0,0,0,0);
  return Math.max(0, Math.floor((now - due) / 86400000));
}

function loading() {
  return `<div class="loading"><div class="spinner"></div>Loading…</div>`;
}

function emptyState(icon, title, sub) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
}

// ════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════
async function renderDashboard() {
  const el = document.getElementById("content");
  el.innerHTML = loading();
  document.getElementById("topbarActionBtn").style.display = "none";

  try {
    const [stats, overdue] = await Promise.all([
      apiFetch("/api/stats"),
      apiFetch("/api/borrowings?status=borrowed")
    ]);

    const overdueList = overdue
      .filter(b => daysOverdue(b.due_date) > 0)
      .sort((a,b) => daysOverdue(b.due_date) - daysOverdue(a.due_date))
      .slice(0, 8);

    const recentBorrowings = overdue.slice(0, 6);

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card teal">
          <div class="stat-label">Total Books</div>
          <div class="stat-value">${stats.total_books}</div>
          <div class="stat-sub">${stats.available_copies} available</div>
        </div>
        <div class="stat-card teal">
          <div class="stat-label">Members</div>
          <div class="stat-value">${stats.total_members}</div>
          <div class="stat-sub">registered</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">Borrowed</div>
          <div class="stat-value">${stats.books_borrowed}</div>
          <div class="stat-sub">currently out</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Overdue</div>
          <div class="stat-value">${stats.overdue_books}</div>
          <div class="stat-sub">past due date</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Fines Collected</div>
          <div class="stat-value">৳${stats.paid_fines.toFixed(0)}</div>
          <div class="stat-sub">৳${stats.total_fines.toFixed(0)} total owed</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-title">⚠ Overdue Books</div>
          <div class="overdue-list">
            ${overdueList.length ? overdueList.map(b => `
              <div class="overdue-item">
                <div>
                  <div class="overdue-book">${b.book_title}</div>
                  <div class="overdue-member">${b.member_name} · ${b.member_code}</div>
                </div>
                <div class="overdue-days">${daysOverdue(b.due_date)}d late · ৳${daysOverdue(b.due_date)*5}</div>
              </div>
            `).join("") : '<p style="color:var(--success);font-size:14px;padding:12px 0">✓ No overdue books</p>'}
          </div>
        </div>

        <div class="card">
          <div class="card-title">◈ Active Borrowings</div>
          <div class="overdue-list">
            ${recentBorrowings.length ? recentBorrowings.map(b => `
              <div class="overdue-item">
                <div>
                  <div class="overdue-book">${b.book_title}</div>
                  <div class="overdue-member">${b.member_name}</div>
                </div>
                <div style="font-size:12px;color:var(--fog-dim)">Due ${fmtDate(b.due_date)}</div>
              </div>
            `).join("") : emptyState("◇", "All Clear", "No active borrowings")}
          </div>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="navigate('borrow')">◆ Borrow a Book</button>
        <button class="btn btn-amber" onclick="navigate('return')">◇ Return a Book</button>
        <button class="btn btn-ghost" onclick="navigate('books')">◉ Manage Books</button>
      </div>
    `;
  } catch (e) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠</div><div class="empty-title">Could not load dashboard</div><div class="empty-sub">${e.message}</div></div>`;
  }
}

// ════════════════════════════════════════════════
// BOOKS
// ════════════════════════════════════════════════
async function renderBooks() {
  const el = document.getElementById("content");
  el.innerHTML = loading();

  const btn = document.getElementById("topbarActionBtn");
  btn.style.display = "inline-flex";
  btn.textContent = "+ Add Book";
  btn.onclick = () => openBookModal();

  try {
    state.books = await apiFetch("/api/books");
    renderBooksTable(state.books);
  } catch (e) {
    el.innerHTML = emptyState("⚠", "Error loading books", e.message);
  }
}

function renderBooksTable(books) {
  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">Books (${books.length})</div>
      <button class="btn btn-primary" onclick="openBookModal()">+ Add Book</button>
    </div>
    <div class="search-bar">
      <input class="search-input" id="bookSearch" placeholder="Search by title, author, ISBN, category…" />
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Title</th>
          <th>Author</th>
          <th class="hide-mobile">ISBN</th>
          <th class="hide-mobile">Category</th>
          <th>Copies</th>
          <th>Status</th>
          <th>Actions</th>
        </tr></thead>
        <tbody id="booksBody">
          ${books.length ? books.map(bookRow).join("") : `<tr><td colspan="7">${emptyState("◉", "No books yet", "Add your first book to get started")}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("bookSearch").addEventListener("input", async (e) => {
    const q = e.target.value.trim();
    const filtered = q
      ? state.books.filter(b =>
          b.title.toLowerCase().includes(q.toLowerCase()) ||
          b.author.toLowerCase().includes(q.toLowerCase()) ||
          b.isbn.toLowerCase().includes(q.toLowerCase()) ||
          (b.category || "").toLowerCase().includes(q.toLowerCase())
        )
      : state.books;
    document.getElementById("booksBody").innerHTML =
      filtered.length ? filtered.map(bookRow).join("") : `<tr><td colspan="7">${emptyState("◎", "No results", "Try a different search term")}</td></tr>`;
  });
}

function bookRow(b) {
  const avail = b.available_copies > 0;
  return `<tr>
    <td><strong style="color:var(--white)">${b.title}</strong></td>
    <td>${b.author}</td>
    <td class="hide-mobile" style="color:var(--fog-dim);font-size:12px">${b.isbn}</td>
    <td class="hide-mobile"><span class="badge badge-none">${b.category || "—"}</span></td>
    <td>${b.available_copies}/${b.total_copies}</td>
    <td><span class="badge ${avail ? "badge-available" : "badge-overdue"}">${avail ? "Available" : "Unavailable"}</span></td>
    <td>
      <button class="btn btn-ghost btn-sm" onclick="openBookModal(${JSON.stringify(b).replace(/"/g,"&quot;")})">Edit</button>
      <button class="btn btn-danger btn-sm" onclick="deleteBook(${b.id})">Del</button>
    </td>
  </tr>`;
}

function openBookModal(book = null) {
  const isEdit = !!book;
  openModal(isEdit ? "Edit Book" : "Add New Book", `
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input class="form-input" id="bookTitle" value="${book?.title || ""}" placeholder="Book title" required />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Author *</label>
        <input class="form-input" id="bookAuthor" value="${book?.author || ""}" placeholder="Author name" required />
      </div>
      <div class="form-group">
        <label class="form-label">ISBN *</label>
        <input class="form-input" id="bookISBN" value="${book?.isbn || ""}" placeholder="978-…" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <input class="form-input" id="bookCategory" value="${book?.category || ""}" placeholder="Fiction, Science…" />
      </div>
      <div class="form-group">
        <label class="form-label">Total Copies</label>
        <input class="form-input" id="bookCopies" type="number" min="1" value="${book?.total_copies || 1}" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBook(${book?.id || "null"})">
        ${isEdit ? "Save Changes" : "Add Book"}
      </button>
    </div>
  `);
}

async function saveBook(id) {
  const body = {
    id,
    title: document.getElementById("bookTitle").value.trim(),
    author: document.getElementById("bookAuthor").value.trim(),
    isbn: document.getElementById("bookISBN").value.trim(),
    category: document.getElementById("bookCategory").value.trim(),
    total_copies: document.getElementById("bookCopies").value
  };
  if (!body.title || !body.author || !body.isbn) { toast("Please fill required fields", "error"); return; }
  try {
    if (id) {
      await apiFetch("/api/books", { method: "PUT", body: JSON.stringify(body) });
      toast("Book updated", "success");
    } else {
      await apiFetch("/api/books", { method: "POST", body: JSON.stringify(body) });
      toast("Book added", "success");
    }
    closeModal();
    renderBooks();
  } catch (e) { toast(e.message, "error"); }
}

async function deleteBook(id) {
  if (!confirm("Delete this book?")) return;
  try {
    await apiFetch(`/api/books?id=${id}`, { method: "DELETE" });
    toast("Book deleted", "success");
    renderBooks();
  } catch (e) { toast(e.message, "error"); }
}

// ════════════════════════════════════════════════
// MEMBERS
// ════════════════════════════════════════════════
async function renderMembers() {
  const el = document.getElementById("content");
  el.innerHTML = loading();

  const btn = document.getElementById("topbarActionBtn");
  btn.style.display = "inline-flex";
  btn.textContent = "+ Add Member";
  btn.onclick = () => openMemberModal();

  try {
    state.members = await apiFetch("/api/members");
    renderMembersTable(state.members);
  } catch (e) {
    el.innerHTML = emptyState("⚠", "Error loading members", e.message);
  }
}

function renderMembersTable(members) {
  const el = document.getElementById("content");
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">Members (${members.length})</div>
      <button class="btn btn-primary" onclick="openMemberModal()">+ Add Member</button>
    </div>
    <div class="search-bar">
      <input class="search-input" id="memberSearch" placeholder="Search by name, email, member ID…" />
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Member ID</th>
          <th>Name</th>
          <th class="hide-mobile">Email</th>
          <th class="hide-mobile">Phone</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr></thead>
        <tbody id="membersBody">
          ${members.length ? members.map(memberRow).join("") : `<tr><td colspan="6">${emptyState("◎", "No members yet", "Register your first member")}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("memberSearch").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = q
      ? state.members.filter(m =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.member_id.toLowerCase().includes(q)
        )
      : state.members;
    document.getElementById("membersBody").innerHTML = filtered.length ? filtered.map(memberRow).join("") : `<tr><td colspan="6">${emptyState("◎", "No results", "")}</td></tr>`;
  });
}

function memberRow(m) {
  return `<tr>
    <td><span class="badge badge-available">${m.member_id}</span></td>
    <td><strong style="color:var(--white)">${m.name}</strong></td>
    <td class="hide-mobile" style="color:var(--fog-dim);font-size:13px">${m.email}</td>
    <td class="hide-mobile" style="color:var(--fog-dim);font-size:13px">${m.phone || "—"}</td>
    <td style="font-size:12px;color:var(--fog-dim)">${fmtDate(m.created_at)}</td>
    <td>
      <button class="btn btn-ghost btn-sm" onclick="openMemberModal(${JSON.stringify(m).replace(/"/g,"&quot;")})">Edit</button>
      <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.id})">Del</button>
    </td>
  </tr>`;
}

function openMemberModal(member = null) {
  const isEdit = !!member;
  openModal(isEdit ? "Edit Member" : "Register New Member", `
    <div class="form-group">
      <label class="form-label">Full Name *</label>
      <input class="form-input" id="memName" value="${member?.name || ""}" placeholder="Full name" />
    </div>
    <div class="form-group">
      <label class="form-label">Email *</label>
      <input class="form-input" id="memEmail" type="email" value="${member?.email || ""}" placeholder="email@example.com" />
    </div>
    <div class="form-group">
      <label class="form-label">Phone</label>
      <input class="form-input" id="memPhone" value="${member?.phone || ""}" placeholder="01xxxxxxxxx" />
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveMember(${member?.id || "null"})">
        ${isEdit ? "Save Changes" : "Register Member"}
      </button>
    </div>
  `);
}

async function saveMember(id) {
  const body = {
    id,
    name: document.getElementById("memName").value.trim(),
    email: document.getElementById("memEmail").value.trim(),
    phone: document.getElementById("memPhone").value.trim()
  };
  if (!body.name || !body.email) { toast("Name and email are required", "error"); return; }
  try {
    if (id) {
      await apiFetch("/api/members", { method: "PUT", body: JSON.stringify(body) });
      toast("Member updated", "success");
    } else {
      await apiFetch("/api/members", { method: "POST", body: JSON.stringify(body) });
      toast("Member registered", "success");
    }
    closeModal();
    renderMembers();
  } catch (e) { toast(e.message, "error"); }
}

async function deleteMember(id) {
  if (!confirm("Delete this member?")) return;
  try {
    await apiFetch(`/api/members?id=${id}`, { method: "DELETE" });
    toast("Member deleted", "success");
    renderMembers();
  } catch (e) { toast(e.message, "error"); }
}

// ════════════════════════════════════════════════
// BORROW BOOK
// ════════════════════════════════════════════════
function renderBorrow() {
  document.getElementById("topbarActionBtn").style.display = "none";
  document.getElementById("content").innerHTML = `
    <div class="borrow-page">
      <div class="step-indicator">
        <div class="step active" id="step1">1. Select Book</div>
        <div class="step" id="step2">2. Select Member</div>
        <div class="step" id="step3">3. Confirm</div>
      </div>

      <div class="card">
        <div class="card-title">◉ Search Book</div>
        <div class="search-bar">
          <input class="search-input" id="borrowBookSearch" placeholder="Type title, author or ISBN…" />
        </div>
        <div id="borrowBookResults"></div>
        <div id="borrowBookSelected"></div>
      </div>

      <div class="card" id="borrowMemberCard" style="display:none">
        <div class="card-title">◎ Search Member</div>
        <div class="search-bar">
          <input class="search-input" id="borrowMemberSearch" placeholder="Type name, email or member ID…" />
        </div>
        <div id="borrowMemberResults"></div>
        <div id="borrowMemberSelected"></div>
      </div>

      <div class="card" id="borrowConfirmCard" style="display:none">
        <div class="card-title">◆ Confirm Borrowing</div>
        <div id="borrowSummary"></div>
        <div style="margin-top:20px;display:flex;gap:10px">
          <button class="btn btn-ghost" onclick="resetBorrow()">Start Over</button>
          <button class="btn btn-primary" id="confirmBorrowBtn" onclick="confirmBorrow()">✓ Confirm Borrow</button>
        </div>
      </div>
    </div>
  `;

  let bookSearchTimer;
  document.getElementById("borrowBookSearch").addEventListener("input", (e) => {
    clearTimeout(bookSearchTimer);
    bookSearchTimer = setTimeout(() => searchBorrowBook(e.target.value), 350);
  });
}

async function searchBorrowBook(q) {
  if (!q.trim()) { document.getElementById("borrowBookResults").innerHTML = ""; return; }
  try {
    const books = await apiFetch(`/api/books?search=${encodeURIComponent(q)}`);
    document.getElementById("borrowBookResults").innerHTML = books.slice(0,5).map(b => `
      <div class="result-card" style="cursor:pointer;margin-bottom:8px" onclick="selectBorrowBook(${b.id})">
        <div class="result-title">${b.title}</div>
        <div class="result-sub">${b.author} · ${b.isbn}</div>
        <span class="result-tag ${b.available_copies > 0 ? "avail" : "unavail"}">
          ${b.available_copies > 0 ? `${b.available_copies} available` : "Not available"}
        </span>
      </div>
    `).join("") || '<p style="color:var(--fog-dim);font-size:14px;padding:10px 0">No books found</p>';
  } catch (e) { toast(e.message, "error"); }
}

async function selectBorrowBook(id) {
  try {
    const book = await apiFetch(`/api/books?id=${id}`);
    state.selectedBook = book;
    document.getElementById("borrowBookResults").innerHTML = "";
    document.getElementById("borrowBookSearch").value = "";
    document.getElementById("borrowBookSelected").innerHTML = `
      <div class="result-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="result-title">✓ ${book.title}</div>
            <div class="result-sub">${book.author} · ${book.isbn}</div>
            <span class="result-tag avail">${book.available_copies} available</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="clearBorrowBook()">Change</button>
        </div>
      </div>
    `;
    document.getElementById("borrowMemberCard").style.display = "block";
    document.getElementById("step2").classList.add("active");

    let memberSearchTimer;
    document.getElementById("borrowMemberSearch").addEventListener("input", (e) => {
      clearTimeout(memberSearchTimer);
      memberSearchTimer = setTimeout(() => searchBorrowMember(e.target.value), 350);
    });
  } catch (e) { toast(e.message, "error"); }
}

function clearBorrowBook() {
  state.selectedBook = null;
  state.selectedMember = null;
  document.getElementById("borrowBookSelected").innerHTML = "";
  document.getElementById("borrowMemberCard").style.display = "none";
  document.getElementById("borrowConfirmCard").style.display = "none";
  document.getElementById("step2").classList.remove("active");
  document.getElementById("step3").classList.remove("active");
}

async function searchBorrowMember(q) {
  if (!q.trim()) { document.getElementById("borrowMemberResults").innerHTML = ""; return; }
  try {
    const members = await apiFetch(`/api/members?search=${encodeURIComponent(q)}`);
    document.getElementById("borrowMemberResults").innerHTML = members.slice(0,5).map(m => `
      <div class="result-card" style="cursor:pointer;margin-bottom:8px" onclick="selectBorrowMember(${m.id})">
        <div class="result-title">${m.name}</div>
        <div class="result-sub">${m.member_id} · ${m.email}</div>
      </div>
    `).join("") || '<p style="color:var(--fog-dim);font-size:14px;padding:10px 0">No members found</p>';
  } catch (e) { toast(e.message, "error"); }
}

async function selectBorrowMember(id) {
  try {
    const member = await apiFetch(`/api/members?id=${id}`);
    state.selectedMember = member;
    document.getElementById("borrowMemberResults").innerHTML = "";
    document.getElementById("borrowMemberSelected").innerHTML = `
      <div class="result-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div class="result-title">✓ ${member.name}</div>
            <div class="result-sub">${member.member_id} · ${member.email}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="clearBorrowMember()">Change</button>
        </div>
      </div>
    `;

    // Show confirm
    const due = new Date(); due.setDate(due.getDate() + 14);
    document.getElementById("borrowConfirmCard").style.display = "block";
    document.getElementById("step3").classList.add("active");
    document.getElementById("borrowSummary").innerHTML = `
      <div style="display:grid;gap:12px">
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--slate)">
          <span style="color:var(--fog-dim);font-size:13px">Book</span>
          <strong style="color:var(--white);font-size:14px">${state.selectedBook.title}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--slate)">
          <span style="color:var(--fog-dim);font-size:13px">Member</span>
          <strong style="color:var(--white);font-size:14px">${state.selectedMember.name} (${state.selectedMember.member_id})</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--slate)">
          <span style="color:var(--fog-dim);font-size:13px">Borrow Date</span>
          <strong style="color:var(--white);font-size:14px">${fmtDate(new Date())}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 0">
          <span style="color:var(--fog-dim);font-size:13px">Due Date (14 days)</span>
          <strong style="color:var(--amber);font-size:14px">${fmtDate(due)}</strong>
        </div>
      </div>
      <div style="background:var(--slate);border-radius:var(--radius);padding:12px 16px;margin-top:12px;font-size:13px;color:var(--fog-dim)">
        ৳5 per day fine applies after the due date.
      </div>
    `;
  } catch (e) { toast(e.message, "error"); }
}

function clearBorrowMember() {
  state.selectedMember = null;
  document.getElementById("borrowMemberSelected").innerHTML = "";
  document.getElementById("borrowConfirmCard").style.display = "none";
  document.getElementById("step3").classList.remove("active");
}

async function confirmBorrow() {
  if (!state.selectedBook || !state.selectedMember) { toast("Select book and member first", "error"); return; }
  const btn = document.getElementById("confirmBorrowBtn");
  btn.disabled = true; btn.textContent = "Processing…";
  try {
    await apiFetch("/api/borrowings", {
      method: "POST",
      body: JSON.stringify({ book_id: state.selectedBook.id, member_id: state.selectedMember.id })
    });
    toast(`"${state.selectedBook.title}" borrowed by ${state.selectedMember.name}`, "success");
    resetBorrow();
  } catch (e) {
    toast(e.message, "error");
    btn.disabled = false; btn.textContent = "✓ Confirm Borrow";
  }
}

function resetBorrow() {
  state.selectedBook = null;
  state.selectedMember = null;
  renderBorrow();
}

// ════════════════════════════════════════════════
// RETURN BOOK
// ════════════════════════════════════════════════
function renderReturn() {
  document.getElementById("topbarActionBtn").style.display = "none";
  document.getElementById("content").innerHTML = `
    <div class="borrow-page">
      <div class="card">
        <div class="card-title">◇ Find Active Borrowing</div>
        <div class="search-bar">
          <input class="search-input" id="returnSearch" placeholder="Search by member name, member ID, or book title…" />
        </div>
        <div id="returnResults"></div>
      </div>
      <div id="returnDetailCard"></div>
    </div>
  `;

  let timer;
  document.getElementById("returnSearch").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => searchReturn(e.target.value), 350);
  });
}

async function searchReturn(q) {
  if (!q.trim()) { document.getElementById("returnResults").innerHTML = ""; return; }
  try {
    const borrowings = await apiFetch("/api/borrowings?status=borrowed");
    const filtered = borrowings.filter(b =>
      b.member_name.toLowerCase().includes(q.toLowerCase()) ||
      b.member_code.toLowerCase().includes(q.toLowerCase()) ||
      b.book_title.toLowerCase().includes(q.toLowerCase())
    );
    document.getElementById("returnResults").innerHTML = filtered.slice(0,6).map(b => {
      const overDays = daysOverdue(b.due_date);
      const fine = overDays * 5;
      return `
        <div class="result-card" style="cursor:pointer;margin-bottom:8px" onclick="selectReturn(${b.id})">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
            <div>
              <div class="result-title">${b.book_title}</div>
              <div class="result-sub">${b.member_name} · ${b.member_code}</div>
              <div class="result-sub" style="margin-top:4px">Due: ${fmtDate(b.due_date)}</div>
            </div>
            ${overDays > 0 ? `<span style="color:var(--danger);font-weight:700;font-size:14px">${overDays}d overdue · ৳${fine}</span>` : `<span style="color:var(--success);font-size:13px;font-weight:600">On time</span>`}
          </div>
        </div>
      `;
    }).join("") || '<p style="color:var(--fog-dim);font-size:14px;padding:10px 0">No active borrowings found</p>';
  } catch (e) { toast(e.message, "error"); }
}

async function selectReturn(borrowingId) {
  try {
    const borrowings = await apiFetch("/api/borrowings?status=borrowed");
    const b = borrowings.find(x => x.id === borrowingId);
    if (!b) return;
    state.selectedBorrowing = b;

    const overDays = daysOverdue(b.due_date);
    const fine = overDays * 5;

    document.getElementById("returnDetailCard").innerHTML = `
      <div class="card">
        <div class="card-title">◇ Return Summary</div>
        <div style="display:grid;gap:12px">
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--slate)">
            <span style="color:var(--fog-dim);font-size:13px">Book</span>
            <strong style="color:var(--white)">${b.book_title}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--slate)">
            <span style="color:var(--fog-dim);font-size:13px">Member</span>
            <strong style="color:var(--white)">${b.member_name} (${b.member_code})</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--slate)">
            <span style="color:var(--fog-dim);font-size:13px">Borrowed On</span>
            <span style="color:var(--fog)">${fmtDate(b.borrow_date)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--slate)">
            <span style="color:var(--fog-dim);font-size:13px">Due Date</span>
            <span style="color:${overDays > 0 ? "var(--danger)" : "var(--fog)"}">${fmtDate(b.due_date)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0">
            <span style="color:var(--fog-dim);font-size:13px">Return Date</span>
            <strong style="color:var(--white)">${fmtDate(new Date())}</strong>
          </div>
        </div>

        ${fine > 0 ? `
          <div class="fine-box">
            <div>
              <div class="fine-label">⚠ Fine Applicable</div>
              <div style="font-size:12px;color:var(--fog-dim);margin-top:4px">${overDays} day${overDays>1?"s":""} overdue × ৳5/day</div>
            </div>
            <div class="fine-value">৳${fine}</div>
          </div>
          <div style="margin-top:16px">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;color:var(--fog)">
              <input type="checkbox" id="finePaidCheck" style="width:16px;height:16px;accent-color:var(--teal)" />
              Mark fine as collected (৳${fine})
            </label>
          </div>
        ` : `
          <div class="no-fine-box">✓ Returned on time — no fine applies</div>
        `}

        <div style="margin-top:20px;display:flex;gap:10px">
          <button class="btn btn-ghost" onclick="document.getElementById('returnDetailCard').innerHTML='';document.getElementById('returnSearch').value=''">Cancel</button>
          <button class="btn btn-amber" onclick="confirmReturn(${b.id}, ${fine})">✓ Confirm Return</button>
        </div>
      </div>
    `;
  } catch (e) { toast(e.message, "error"); }
}

async function confirmReturn(borrowingId, fine) {
  const finePaid = document.getElementById("finePaidCheck")?.checked || false;
  try {
    await apiFetch("/api/borrowings", {
      method: "PUT",
      body: JSON.stringify({ id: borrowingId, fine_paid: finePaid })
    });
    const msg = fine > 0 ? `Book returned. Fine: ৳${fine} ${finePaid ? "(collected)" : "(pending)"}` : "Book returned successfully — no fine";
    toast(msg, "success");
    renderReturn();
  } catch (e) { toast(e.message, "error"); }
}

// ════════════════════════════════════════════════
// ALL BORROWINGS
// ════════════════════════════════════════════════
async function renderBorrowings() {
  const el = document.getElementById("content");
  el.innerHTML = loading();
  document.getElementById("topbarActionBtn").style.display = "none";

  try {
    state.borrowings = await apiFetch("/api/borrowings");
    renderBorrowingsTable(state.borrowings, "all");
  } catch (e) {
    el.innerHTML = emptyState("⚠", "Error loading borrowings", e.message);
  }
}

function renderBorrowingsTable(all, activeFilter) {
  const el = document.getElementById("content");
  const filters = ["all", "borrowed", "returned", "overdue"];

  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">Borrowings (${all.length})</div>
    </div>
    <div class="filter-tabs">
      ${filters.map(f => `<button class="filter-tab ${f===activeFilter?"active":""}" onclick="filterBorrowings('${f}')">${f.charAt(0).toUpperCase()+f.slice(1)}</button>`).join("")}
    </div>
    <div class="search-bar">
      <input class="search-input" id="borrowSearch" placeholder="Search by book, member…" />
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Book</th>
          <th>Member</th>
          <th class="hide-mobile">Borrowed</th>
          <th>Due</th>
          <th>Status</th>
          <th>Fine</th>
          <th class="hide-mobile">Returned</th>
        </tr></thead>
        <tbody id="borrowingsBody">
          ${getBorrowingRows(all, activeFilter)}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("borrowSearch").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = q ? all.filter(b =>
      b.book_title.toLowerCase().includes(q) || b.member_name.toLowerCase().includes(q) || b.member_code.toLowerCase().includes(q)
    ) : all;
    document.getElementById("borrowingsBody").innerHTML = getBorrowingRows(filtered, activeFilter);
  });
}

function filterBorrowings(filter) {
  renderBorrowingsTable(state.borrowings, filter);
}

function getBorrowingRows(borrowings, filter) {
  let rows = borrowings;
  if (filter === "borrowed") rows = borrowings.filter(b => b.status === "borrowed");
  else if (filter === "returned") rows = borrowings.filter(b => b.status === "returned");
  else if (filter === "overdue") rows = borrowings.filter(b => b.status === "borrowed" && daysOverdue(b.due_date) > 0);

  if (!rows.length) return `<tr><td colspan="7">${emptyState("▣", "No borrowings", "No records match this filter")}</td></tr>`;

  return rows.map(b => {
    const overDays = b.status === "borrowed" ? daysOverdue(b.due_date) : 0;
    const isOverdue = b.status === "borrowed" && overDays > 0;
    const fine = b.status === "borrowed" ? overDays * 5 : b.fine_amount;
    const statusClass = isOverdue ? "badge-overdue" : b.status === "borrowed" ? "badge-borrowed" : "badge-returned";
    const statusText = isOverdue ? "Overdue" : b.status === "borrowed" ? "Borrowed" : "Returned";

    return `<tr>
      <td><strong style="color:var(--white)">${b.book_title}</strong></td>
      <td>${b.member_name}<br><span style="color:var(--fog-dim);font-size:11px">${b.member_code}</span></td>
      <td class="hide-mobile" style="font-size:12px;color:var(--fog-dim)">${fmtDate(b.borrow_date)}</td>
      <td style="font-size:13px;color:${isOverdue?"var(--danger)":"var(--fog)"}">${fmtDate(b.due_date)}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td style="color:${fine>0?"var(--amber)":"var(--fog-dim)"};font-weight:${fine>0?"700":"400"}">
        ${fine > 0 ? `৳${fine}${b.fine_paid ? ' <span style="color:var(--success);font-size:11px">✓paid</span>' : ''}` : "—"}
      </td>
      <td class="hide-mobile" style="font-size:12px;color:var(--fog-dim)">${fmtDate(b.return_date)}</td>
    </tr>`;
  }).join("");
}

// ════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
  // Nav
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(link.dataset.page);
    });
  });

  // Sidebar toggle
  document.getElementById("menuBtn").addEventListener("click", openSidebar);
  document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
  document.getElementById("overlay").addEventListener("click", closeSidebar);

  // Modal close
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalBackdrop").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalBackdrop")) closeModal();
  });

  // Init DB & load dashboard
  await initDB();
  navigate("dashboard");
});
