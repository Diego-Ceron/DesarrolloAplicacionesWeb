const PATIENTS_KEY = "medicitas-patients";
const APPOINTMENTS_KEY = "medicitas-appointments";
const FILES_KEY = "medicitas-files";
const SESSION_KEY = "medicitas-session";

const INITIAL_PATIENTS = [
  { id: 1, firstName: "Carlos", lastName: "Ramírez López", phone: "5511122233", birthDate: "1985-03-14", email: "carlos@correo.com" },
  { id: 2, firstName: "Fernanda", lastName: "Gómez Torres", phone: "5522233344", birthDate: "1992-07-22", email: "fer@correo.com" },
  { id: 3, firstName: "Luis", lastName: "Martínez Vega", phone: "5533344455", birthDate: "1978-11-05", email: "luis@correo.com" },
];

const INITIAL_APPOINTMENTS = [
  { id: 1, patientId: 1, doctor: "Dra. Laura Méndez", date: "2026-11-10 09:00", reason: "Revisión general", status: "attended" },
  { id: 2, patientId: 1, doctor: "Dra. Laura Méndez", date: "2026-11-20 10:00", reason: "Resultados", status: "pending" },
  { id: 3, patientId: 1, doctor: "Dr. Jorge Castillo", date: "2026-11-28 12:00", reason: "Dolor de espalda", status: "pending" },
  { id: 4, patientId: 3, doctor: "Dr. Jorge Castillo", date: "2026-11-25 12:00", reason: "Presión alta", status: "pending" },
];

const STATUS_NAMES = {
  pending: "Pendiente",
  arrived: "Asistió",
  attended: "Atendida",
  missed: "No asistió",
  cancelled: "Cancelada",
};

const session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: "patient", patientId: 1 };

if (session.role !== "patient") {
  location.href = "login.html";
}

const form = document.getElementById("account-form");
const formActions = document.getElementById("form-actions");
const editButton = document.getElementById("edit-button");
const message = document.getElementById("account-message");
const upcomingList = document.getElementById("upcoming-list");
const historyList = document.getElementById("history-list");
const filesList = document.getElementById("files-list");

function loadList(key, initialList) {
  return JSON.parse(localStorage.getItem(key)) || initialList;
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function getMyPatient() {
  return loadList(PATIENTS_KEY, INITIAL_PATIENTS).find((item) => item.id === session.patientId);
}

function getMyAppointments() {
  return loadList(APPOINTMENTS_KEY, INITIAL_APPOINTMENTS).filter((item) => item.patientId === session.patientId);
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

function setFormEditable(isEditable) {
  const inputs = form.querySelectorAll("input");

  inputs.forEach((input) => {
    input.disabled = !isEditable;
  });

  formActions.hidden = !isEditable;
  editButton.hidden = isEditable;
}

function fillForm() {
  const patient = getMyPatient();

  form.first_name.value = patient.firstName;
  form.last_name.value = patient.lastName;
  form.phone.value = patient.phone;
  form.birth_date.value = patient.birthDate;
  form.email.value = patient.email;

  document.getElementById("welcome-title").textContent = `Hola, ${patient.firstName}`;
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

  const patients = loadList(PATIENTS_KEY, INITIAL_PATIENTS);
  const emailExists = patients.some((item) => item.email === patient.email && item.id !== patient.id);
  if (emailExists) {
    return "Ese correo ya pertenece a otro paciente.";
  }

  return "";
}

function renderAppointments() {
  const appointments = getMyAppointments();
  const upcoming = appointments.filter((item) => item.status === "pending");
  const history = appointments.filter((item) => item.status !== "pending");

  upcomingList.innerHTML = "";
  historyList.innerHTML = "";

  if (upcoming.length === 0) {
    upcomingList.innerHTML = "<li>No tienes citas próximas.</li>";
  }

  if (history.length === 0) {
    historyList.innerHTML = "<li>Todavía no tienes citas pasadas.</li>";
  }

  upcoming.forEach((item) => {
    upcomingList.innerHTML += `
      <li class="account-item">
        <div class="account-item-info">
          <strong>${item.date}</strong>
          <small>${escapeHtml(item.doctor)} · ${escapeHtml(item.reason)}</small>
        </div>
        <span class="account-status status-${item.status}">${STATUS_NAMES[item.status]}</span>
        <button type="button" class="account-button-secondary" data-action="receipt" data-id="${item.id}">Comprobante</button>
        <button type="button" class="account-button-danger" data-action="cancel" data-id="${item.id}">Cancelar</button>
      </li>`;
  });

  history.forEach((item) => {
    historyList.innerHTML += `
      <li class="account-item">
        <div class="account-item-info">
          <strong>${item.date}</strong>
          <small>${escapeHtml(item.doctor)} · ${escapeHtml(item.reason)}</small>
        </div>
        <span class="account-status status-${item.status}">${STATUS_NAMES[item.status]}</span>
        <button type="button" class="account-button-secondary" data-action="receipt" data-id="${item.id}">Comprobante</button>
      </li>`;
  });
}

function renderFiles() {
  const files = loadList(FILES_KEY, []).filter((file) => file.patientId === session.patientId);
  filesList.innerHTML = "";

  if (files.length === 0) {
    filesList.innerHTML = "<li>Todavía no tienes archivos.</li>";
    return;
  }

  files.forEach((file) => {
    filesList.innerHTML += `
      <li class="account-item">
        <div class="account-item-info"><strong>${escapeHtml(file.name)}</strong></div>
        <button type="button" data-id="${file.id}">Descargar</button>
      </li>`;
  });
}

function cancelAppointment(id) {
  const appointments = loadList(APPOINTMENTS_KEY, INITIAL_APPOINTMENTS);
  const appointment = appointments.find((item) => item.id === id);

  if (appointment.patientId !== session.patientId || appointment.status !== "pending") {
    return;
  }

  if (!confirm(`¿Cancelar tu cita del ${appointment.date}?`)) {
    return;
  }

  appointment.status = "cancelled";
  saveList(APPOINTMENTS_KEY, appointments);
  showMessage("Tu cita fue cancelada.", false);
  renderAppointments();
}

editButton.addEventListener("click", () => {
  setFormEditable(true);
  form.first_name.focus();
});

document.getElementById("cancel-button").addEventListener("click", () => {
  fillForm();
  setFormEditable(false);
});

form.phone.addEventListener("input", () => {
  form.phone.value = form.phone.value.replace(/\D/g, "");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const patient = {
    id: session.patientId,
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

  const patients = loadList(PATIENTS_KEY, INITIAL_PATIENTS).filter((item) => item.id !== patient.id);
  patients.push(patient);
  saveList(PATIENTS_KEY, patients);

  fillForm();
  setFormEditable(false);
  showMessage("Tus datos se guardaron.", false);
});

upcomingList.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (action === "cancel") {
    cancelAppointment(id);
  }

  if (action === "receipt") {
    location.href = `comprobante.html?id=${id}`;
  }
});

historyList.addEventListener("click", (event) => {
  if (event.target.dataset.action === "receipt") {
    location.href = `comprobante.html?id=${event.target.dataset.id}`;
  }
});

filesList.addEventListener("click", (event) => {
  const id = Number(event.target.dataset.id);
  const file = loadList(FILES_KEY, []).find((item) => item.id === id);

  if (!file || file.patientId !== session.patientId) {
    return;
  }

  const link = document.createElement("a");
  link.href = file.data;
  link.download = file.name;
  link.click();
});

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
});

if (location.search.includes("aviso=permiso")) {
  showMessage("No tienes permiso para abrir esa página.", true);
}

fillForm();
setFormEditable(false);
renderAppointments();
renderFiles();