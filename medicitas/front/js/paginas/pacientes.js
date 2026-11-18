const PATIENTS_KEY = "medicitas-patients";
const SESSION_KEY = "medicitas-session";

const INITIAL_PATIENTS = [
  { id: 1, firstName: "Carlos", lastName: "Ramírez López", phone: "5511122233", birthDate: "1985-03-14", email: "carlos@correo.com" },
  { id: 2, firstName: "Fernanda", lastName: "Gómez Torres", phone: "5522233344", birthDate: "1992-07-22", email: "fer@correo.com" },
  { id: 3, firstName: "Luis", lastName: "Martínez Vega", phone: "5533344455", birthDate: "1978-11-05", email: "luis@correo.com" },
];

const appointments = [
  { patientId: 1, doctorId: 1, date: "2026-11-10 09:00", reason: "Revisión general", status: "Atendida" },
  { patientId: 1, doctorId: 1, date: "2026-11-20 10:00", reason: "Resultados", status: "Pendiente" },
  { patientId: 3, doctorId: 2, date: "2026-11-25 12:00", reason: "Presión alta", status: "Pendiente" },
];

const session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: "reception" };

if (session.role === "patient") {
  location.href = "paciente.html";
}

const canEdit = session.role === "admin" || session.role === "reception";
const isDoctor = session.role === "doctor";

const form = document.getElementById("patient-form");
const formTitle = document.getElementById("form-title");
const message = document.getElementById("patients-message");
const searchInput = document.getElementById("search-input");
const tableBody = document.getElementById("patients-table-body");

let selectedId = null;

function loadPatients() {
  return JSON.parse(localStorage.getItem(PATIENTS_KEY)) || INITIAL_PATIENTS;
}

function savePatients(patients) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

function getFullName(patient) {
  return `${patient.firstName} ${patient.lastName}`;
}

function calculateAge(birthDate) {
  const milliseconds = Date.now() - new Date(`${birthDate}T00:00:00`);
  const years = milliseconds / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years);
}

function escapeHtml(text) {
  const element = document.createElement("div");
  element.textContent = text;
  return element.innerHTML;
}

function showMessage(text, isError) {
  message.textContent = text;
  message.classList.toggle("is-error", isError);
  message.hidden = false;
}

function getVisiblePatients() {
  const patients = loadPatients();

  if (!isDoctor) {
    return patients;
  }

  return patients.filter((patient) => {
    return appointments.some((item) => item.patientId === patient.id && item.doctorId === session.doctorId);
  });
}

function renderPatients() {
  const search = searchInput.value.trim().toLowerCase();

  const patients = getVisiblePatients().filter((patient) => {
    const text = `${getFullName(patient)} ${patient.phone} ${patient.email}`.toLowerCase();
    return text.includes(search);
  });

  tableBody.innerHTML = "";

  if (patients.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">No se encontraron pacientes.</td></tr>`;
    return;
  }

  for (const patient of patients) {
    let buttons = "";

    if (canEdit) {
      buttons += `<button type="button" data-action="view" data-id="${patient.id}">Editar</button>`;
    } else {
      buttons += `<button type="button" data-action="view" data-id="${patient.id}">Ver archivos</button>`;
    }

    buttons += `<button type="button" class="patients-button-secondary" data-action="print" data-id="${patient.id}">Ficha</button>`;

    if (canEdit) {
      buttons += `<button type="button" class="patients-button-danger" data-action="delete" data-id="${patient.id}">Eliminar</button>`;
    }

    let rowClass = "";
    if (patient.id === selectedId) {
      rowClass = "is-selected";
    }

    tableBody.innerHTML += `
      <tr class="${rowClass}">
        <td data-label="Paciente">${escapeHtml(getFullName(patient))}</td>
        <td data-label="Edad">${calculateAge(patient.birthDate)}</td>
        <td data-label="Teléfono">${escapeHtml(patient.phone)}</td>
        <td data-label="Correo">${escapeHtml(patient.email)}</td>
        <td data-label="Archivos">${getPatientFiles(patient.id).length}</td>
        <td>${buttons}</td>
      </tr>`;
  }
}

function validatePatient(patient) {
  const namePattern = /^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{2,}$/;
  const phonePattern = /^\d{10}$/;
  const emailPattern = /^\S+@\S+\.\S{2,}$/;
  const age = calculateAge(patient.birthDate);

  if (!namePattern.test(patient.firstName)) {
    return "Escribe un nombre válido (solo letras).";
  }

  if (!namePattern.test(patient.lastName)) {
    return "Escribe apellidos válidos (solo letras).";
  }

  if (!phonePattern.test(patient.phone)) {
    return "El teléfono debe tener 10 dígitos.";
  }

  if (isNaN(age) || age < 0 || age > 120) {
    return "Escribe una fecha de nacimiento válida.";
  }

  if (!emailPattern.test(patient.email)) {
    return "Escribe un correo válido.";
  }

  const emailExists = loadPatients().some((item) => item.email === patient.email && item.id !== patient.id);
  if (emailExists) {
    return "Ya existe un paciente con ese correo.";
  }

  return "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isNew = form.patient_id.value === "";

  const patient = {
    id: Number(form.patient_id.value) || Date.now(),
    firstName: form.first_name.value.trim(),
    lastName: form.last_name.value.trim(),
    phone: form.phone.value.trim(),
    birthDate: form.birth_date.value,
    email: form.email.value.trim().toLowerCase(),
  };

  const error = validatePatient(patient);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  const patients = loadPatients().filter((item) => item.id !== patient.id);
  patients.push(patient);
  savePatients(patients);

  if (isNew) {
    showMessage("Paciente registrado. Ya puedes subir sus archivos.", false);
  } else {
    showMessage("Paciente actualizado.", false);
  }

  selectPatient(patient.id);
});

form.addEventListener("reset", () => {
  form.patient_id.value = "";
  formTitle.textContent = "Nuevo paciente";
  selectedId = null;
  closeFiles();
  renderPatients();
});

form.phone.addEventListener("input", () => {
  form.phone.value = form.phone.value.replace(/\D/g, "");
});

function selectPatient(id) {
  const patient = getVisiblePatients().find((item) => item.id === id);
  selectedId = id;

  if (canEdit) {
    form.patient_id.value = patient.id;
    form.first_name.value = patient.firstName;
    form.last_name.value = patient.lastName;
    form.phone.value = patient.phone;
    form.birth_date.value = patient.birthDate;
    form.email.value = patient.email;
    formTitle.textContent = "Editar paciente";
  }

  openFiles(patient, canEdit);
  renderPatients();
}

function deletePatient(id) {
  const patient = loadPatients().find((item) => item.id === id);

  const hasPending = appointments.some((item) => item.patientId === id && item.status === "Pendiente");
  if (hasPending) {
    showMessage(`No se puede eliminar a ${patient.firstName}: tiene citas pendientes.`, true);
    return;
  }

  if (!confirm(`¿Eliminar a ${getFullName(patient)} y todos sus archivos?`)) {
    return;
  }

  const otherPatients = loadPatients().filter((item) => item.id !== id);
  savePatients(otherPatients);
  deletePatientFiles(id);

  form.reset();
  showMessage("Paciente eliminado.", false);
}

function printPatientSheet(id) {
  const patient = getVisiblePatients().find((item) => item.id === id);

  let appointmentRows = "";
  appointments.forEach((item) => {
    const isFromPatient = item.patientId === id;
    const doctorCanSee = !isDoctor || item.doctorId === session.doctorId;

    if (isFromPatient && doctorCanSee) {
      appointmentRows += `<tr><td>${item.date}</td><td>${item.reason}</td><td>${item.status}</td></tr>`;
    }
  });

  let fileItems = "";
  getPatientFiles(id).forEach((file) => {
    fileItems += `<li>${escapeHtml(file.name)}</li>`;
  });

  if (fileItems === "") {
    fileItems = "<li>Sin archivos</li>";
  }

  document.getElementById("patient-sheet").innerHTML = `
    <h1>Ficha del paciente</h1>
    <p><strong>Nombre:</strong> ${escapeHtml(getFullName(patient))}</p>
    <p><strong>Edad:</strong> ${calculateAge(patient.birthDate)} años</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(patient.phone)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(patient.email)}</p>

    <h2>Citas</h2>
    <table>
      <tr><th>Fecha</th><th>Motivo</th><th>Estado</th></tr>
      ${appointmentRows}
    </table>

    <h2>Archivos</h2>
    <ul>${fileItems}</ul>`;

  window.print();
}

tableBody.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (action === "view") {
    selectPatient(id);
  } else if (action === "print") {
    printPatientSheet(id);
  } else if (action === "delete") {
    deletePatient(id);
  }
});

searchInput.addEventListener("input", renderPatients);

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
});

const roleNames = {
  admin: "Administrador",
  reception: "Recepción",
  doctor: "Doctor",
};

document.getElementById("user-role").textContent = roleNames[session.role];

if (!canEdit) {
  document.getElementById("form-section").hidden = true;
}

renderPatients();