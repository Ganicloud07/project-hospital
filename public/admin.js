// LOGIN
function login() {
  fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        location.href = "admin-dashboard.html";
      } else {
        alert("Invalid login");
      }
    });
}

// LOAD APPOINTMENTS
if (document.getElementById("list")) {
  fetch("/api/admin/appointments")
    .then(res => res.json())
    .then(data => {
      list.innerHTML = "";
      data.forEach(a => {
        list.innerHTML += `
          <tr>
            <td>${a.name}</td>
            <td>${a.mobile}</td>
            <td>${a.department}</td>
            <td>${a.date}</td>
            <td>
              <button onclick="deleteAp(${a.id})">Delete</button>
            </td>
          </tr>`;
      });
    });
}

// DELETE
function deleteAp(id) {
  fetch("/api/admin/appointment/" + id, { method: "DELETE" })
    .then(() => location.reload());
}



fetch("http://localhost:3000/api/appointments")
  .then(res => res.json())
  .then(data => {
    const tbody = document.getElementById("patientTable");

    data.forEach(p => {
      const row = `
        <tr>
          <td>${p.appointment_id}</td>
          <td>${p.name}</td>
          <td>${p.mobile}</td>
          <td>${p.department}</td>
          <td>${p.doctor}</td>
          <td>${p.appointment_date}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  });
