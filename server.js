const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = 3000; // ✅ MUST

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./hospital.db");

/* routes here */

app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});



/* ================= DATABASE ================= */

db.serialize(() => {

  // ---------- APPOINTMENTS TABLE ----------
  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      mobile TEXT,
      department TEXT,
      appointment_date TEXT
    )
  `);

  // ---------- ADMIN TABLE ----------
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      username TEXT,
      password TEXT,
      email TEXT,
      otp TEXT
    )
  `);

  // ---------- DEFAULT ADMIN ----------
  db.run(`
    INSERT OR IGNORE INTO admin (rowid, username, password, email)
    VALUES (1, 'gani', 'gani@2025', 'ganicloud07@gmail.com')
  `);

  // ---------- SAFE MIGRATION ----------
  db.run(`ALTER TABLE appointments ADD COLUMN appointment_id TEXT`);
  db.run(`ALTER TABLE appointments ADD COLUMN doctor TEXT`);
  db.run(`ALTER TABLE appointments ADD COLUMN opd_timing TEXT`);
  db.run(`ALTER TABLE appointments ADD COLUMN valid_till TEXT`);
  db.run(`ALTER TABLE appointments ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP`);
});

/* ================= API : SAVE APPOINTMENT ================= */

app.post("/api/appointments", (req, res) => {
  const {
    appointmentId,
    name,
    email,
    mobile,
    department,
    doctorName,
    opdTiming,
    appointmentDate,
    validTill
  } = req.body;

  const sql = `
    INSERT INTO appointments (
      appointment_id,
      name,
      email,
      mobile,
      department,
      doctor,
      opd_timing,
      appointment_date,
      valid_till,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      appointmentId,
      name,
      email || "Not Provided",
      mobile,
      department,
      doctorName,
      opdTiming,
      appointmentDate,
      validTill,
      new Date().toISOString()
    ],
    function (err) {
      if (err) {
        console.error("DB INSERT ERROR:", err.message);
        return res.json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

/* ================= API : ADMIN – GET ALL APPOINTMENTS ================= */

app.get("/api/appointments", (req, res) => {
  db.all(
    `
    SELECT 
      appointment_id,
      name,
      email,
      mobile,
      department,
      doctor,
      opd_timing,
      appointment_date,
      valid_till,
      created_at
    FROM appointments
    ORDER BY created_at DESC
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.json({ success: false });
      }
      res.json(rows);
    }
  );
});

/* ================= SERVER ================= */

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});



/* ================= EMAIL CONFIG ================= */

const EMAIL_USER = "ganicloud07@gmail.com";        // 🔴 CHANGE if needed
const EMAIL_PASS = "iamcloudengineer";            // 🔴 GMAIL APP PASSWORD ONLY

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS.replace(/\s/g, "")
  }
});

/* ===== VERIFY EMAIL CONFIG (VERY IMPORTANT) ===== */
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ EMAIL CONFIG ERROR:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

/* ================= API ================= */

// SAVE APPOINTMENT
app.post("/api/appointment", (req, res) => {
  const { name, email, mobile, department, date } = req.body;

  db.run(
    `INSERT INTO appointments (name,email,mobile,department,date)
     VALUES (?,?,?,?,?)`,
    [name, email, mobile, department, date],
    () => res.json({ success: true })
  );
});

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM admin WHERE username=? AND password=?",
    [username, password],
    (err, row) => {
      if (row) res.json({ success: true });
      else res.json({ success: false });
    }
  );
});

// ================= FORGOT PASSWORD – SEND OTP =================
app.post("/api/admin/forgot-password", (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log("🔐 OTP GENERATED:", otp);
  console.log("📧 SENDING TO:", email);

  // 1️⃣ Check email exists
  db.get("SELECT * FROM admin WHERE email=?", [email], (err, admin) => {
    if (!admin) {
      return res.json({ success: false, message: "Email not found" });
    }

    // 2️⃣ Save OTP
    db.run(
      "UPDATE admin SET otp=? WHERE email=?",
      [otp, email],
      function (err) {
        if (this.changes === 0) {
          return res.json({ success: false, message: "Email not found" });
        }

        // 3️⃣ Send email
        transporter.sendMail(
          {
            from: `"Gani Hospital" <${EMAIL_USER}>`,
            to: email,
            subject: "Admin Password Reset OTP",
            text: `Your OTP is ${otp}`
          },
          (error, info) => {
            if (error) {
              console.log("❌ EMAIL SEND ERROR:", error);
              return res.json({ success: false, message: "Email failed" });
            }

            console.log("✅ EMAIL SENT:", info.response);
            return res.json({ success: true });
          }
        );
      }
    );
  });
});


// ================= RESET PASSWORD =================
app.post("/api/admin/reset-password", (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const otp = req.body.otp;
  const newPassword = req.body.newPassword;

  db.get(
    "SELECT * FROM admin WHERE email=? AND otp=?",
    [email, otp],
    (err, admin) => {
      if (!admin) {
        return res.json({ success: false, message: "Invalid OTP" });
      }

      db.run(
        "UPDATE admin SET password=?, otp=NULL WHERE email=?",
        [newPassword, email],
        () => res.json({ success: true })
      );
    }
  );
});


// GET ALL APPOINTMENTS
app.get("/api/admin/appointments", (req, res) => {
  db.all("SELECT * FROM appointments ORDER BY id DESC", (err, rows) => {
    res.json(rows);
  });
});



// DELETE APPOINTMENT
app.delete("/api/admin/appointment/:id", (req, res) => {
  db.run("DELETE FROM appointments WHERE id=?", req.params.id, () => {
    res.json({ success: true });
  });
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
});
