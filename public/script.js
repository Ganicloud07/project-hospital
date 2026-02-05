// ===============================
// Department → Doctor Mapping
// ===============================
const doctorMap = {
  "Pediatrics": "Dr. Saeed Gani (MD Pediatrics)",
  "Dermatologist Specialist": "Dr. Salman Gani (Dermatologist Specialist)",
  "Psychiatric Doctor": "Dr. Shakeel Gani (Psychiatric Doctor)"
};

// ===============================
// Department → OPD Timing Mapping
// ===============================
const opdTimingMap = {
  "Pediatrics": "10:00 AM – 2:00 PM",
  "Dermatologist Specialist": "11:00 AM – 3:00 PM",
  "Psychiatric Doctor": "9:00 AM – 1:00 PM"
};

// ===============================
// Modal Functions
// ===============================
function showModal() {
  document.getElementById("successModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("successModal").style.display = "none";
}

// Preload logo image
const logo = new Image();
logo.crossOrigin = "Anonymous";
logo.src = "img/logo.png";

// ===============================
// Main Form Handler
// ===============================
document.addEventListener("DOMContentLoaded", function () {
  const appointmentForm = document.getElementById("appointmentForm");

  if (!appointmentForm) {
    console.error("Appointment form not found!");
    return;
  }

  appointmentForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // ---------- GET FORM VALUES ----------
    const name = document.getElementById("pname").value;
    const email = document.getElementById("pemail").value;
    const mobile = document.getElementById("pmobile").value;
    const department = document.getElementById("department").value;
    const dateValue = document.getElementById("date").value;


    // ---------- VALIDATION ----------
    if (!name || !mobile || !department || !dateValue) {
      alert("Please fill all required fields");
      return;
    }

    // Mobile validation (mandatory)
    if (!/^\d{10}$/.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    // Email validation (OPTIONAL)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address");
      return;
    }


    // ---------- DATE VALIDATION ----------
    const appointmentDate = new Date(dateValue);
    const today = new Date();
    const maxDate = new Date();

    // Start of day set karo (time ignore karne ke liye)
    appointmentDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // aaj + 3 din
    maxDate.setDate(today.getDate() + 3);
    maxDate.setHours(0, 0, 0, 0);

    // ❌ Past date not allowed
    if (appointmentDate < today) {
      alert("Cannot book appointment for past dates.");
      return;
    }

    // ❌ 3 din se zyada future not allowed
    if (appointmentDate > maxDate) {
      alert("Appointment sirf aaj se 3 din ke andar hi book ho sakta hai.");
      return;
    }

    // ✅ Valid date (aaj, aaj+1, aaj+2, aaj+3)




    // ---------- GET DOCTOR & TIMING ----------
    const doctorName = doctorMap[department] || "Assigned at Hospital";
    const opdTiming = opdTimingMap[department] || "As per hospital schedule";
    const validTill = new Date(today);

    // ---------- APPOINTMENT ID ----------
    // const appointmentId = "GH-" + Date.now().toString().slice(-1);
    const appointmentId =
      "GH-" +
      Date.now().toString().slice(-4) +
      Math.floor(Math.random() * 10);

    // ---------- PDF GENERATION ----------
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF library not loaded. Please refresh the page.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // doc.text("Appointment Booked Successfully!", 20, 20);
    // doc.save("appointment.pdf");



    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ---------- BACKGROUND LOGO (WATERMARK) ----------
    // Try to add logo as background watermark
    const addLogoAsBackground = () => {
      try {
        // Logo size and position (centered, slightly transparent)
        const logoWidth = 120;
        const logoHeight = 120;
        const x = (pageWidth - logoWidth) / 2;
        const y = (pageHeight - logoHeight) / 2;

        // Add logo with transparency (0.08 = 8% opacity)
        doc.addImage(logo, "PNG", x, y, logoWidth, logoHeight, "", "FAST", 0.08);
      } catch (error) {
        console.log("Could not add background logo:", error);
      }
    };

    // Function to generate the main PDF content
    function generatePDFContent() {
      // // Add logo if it's already loaded
      // if (logo.complete && logo.naturalWidth > 0) {
      //   addLogoAsBackground();
      // }

      // ---------- HEADER ----------
      doc.setFillColor(10, 78, 163);
      doc.rect(0, 0, 210, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("GANI HOSPITAL", 105, 18, { align: "center" });
      doc.setFontSize(11);
      doc.text("Appointment Slip", 105, 25, { align: "center" });
      doc.setTextColor(0, 0, 0);

      // ---------- BODY ----------
      let y = 45;
      const labelX = 20;
      const valueX = 90;

      doc.setFontSize(11);

      // Appointment details
      const details = [
        ["Appointment ID", appointmentId],
        ["Patient Name", name],
        ["Email", email || "Not Provided"],
        ["Mobile Number", mobile],
        ["Department", department],
        ["Consulting Doctor", doctorName],
        ["OPD Timing", opdTiming],
        ["Appointment Date", appointmentDate.toDateString()],
        ["Valid Till", validTill.toDateString()]
      ];


      details.forEach(([label, value]) => {
        doc.text(label, labelX, y);
        if (label === "Valid Till") {
          doc.setTextColor(200, 0, 0);
          doc.text(": " + value, valueX, y);
          doc.setTextColor(0, 0, 0);
        } else {
          doc.text(": " + value, valueX, y);
        }
        y += 10;
      });

      // Divider
      y += 5;
      doc.line(20, y, 190, y);

      // Instructions
      y += 12;
      doc.setFontSize(10);
      doc.text("• Please reach the hospital 30 minutes before your appointment time.", 20, y);
      doc.text("• This slip is valid only for today.", 20, y + 7);
      doc.text("• Bring this slip and your ID proof.", 20, y + 14);


      // ---------- ADDRESS BOX ----------
      y += 22;
      doc.setDrawColor(10, 78, 163);
      doc.rect(15, y - 12, 180, 55);

      doc.setFontSize(11);
      doc.text("Hospital Address", 20, y);

      doc.setFontSize(10);
      doc.text("Gani Hospital", 20, y + 10);
      doc.text("Main Road, Bardahi Bazar", 20, y + 18);
      doc.text("Uttar Pradesh, India", 20, y + 26);
      doc.text("Contact: 9554017568", 20, y + 36);

      // ---------- FOOTER ----------
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        "This is a computer-generated appointment slip. No signature required.",
        105,
        285,
        { align: "center" }
      );

      // ---------- SAVE PDF ----------
      // YEH LINE SAHI KAREN - dono backticks (`) use karen
      doc.save(`Appointment-${appointmentId}.pdf`);



      // ---------- SHOW MODAL ----------
      showModal();

      // ---------- RESET FORM ----------
      appointmentForm.reset();
    }

    // Start generating PDF content
    generatePDFContent();
  });
});




fetch("http://localhost:3000/api/appointments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    appointmentId,
    name,
    email,
    mobile,
    department,
    doctorName,
    opdTiming,
    appointmentDate,
    validTill
  })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    generatePDFContent(); // ✅ PDF AFTER DB SAVE
  } else {
    alert("Appointment not saved");
  }
});
