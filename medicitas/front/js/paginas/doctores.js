const SPECIALTIES_KEY = "medicitas-specialties";
const DOCTORS_KEY = "medicitas-doctors";
const APPOINTMENTS_KEY = "medicitas-appointments";
const SESSION_KEY = "medicitas-session";

const INITIAL_SPECIALTIES = [
  { id: 1, name: "Medicina general", description: "Consulta y seguimiento de padecimientos comunes." },
  { id: 2, name: "Pediatría", description: "Atención médica de bebés, niños y adolescentes." },
  { id: 3, name: "Cardiología", description: "Diagnóstico y tratamiento del corazón." },
  { id: 4, name: "Dermatología", description: "Cuidado de la piel, el cabello y las uñas." },
];

const INITIAL_DOCTORS = [
  { id: 1, name: "Laura Méndez Ríos", license: "7845123", specialtyId: 1, phone: "5512345678" },
  { id: 2, name: "Jorge Castillo Peña", license: "8523641", specialtyId: 2, phone: "5523456789" },
  { id: 3, name: "Ana Sofía Herrera", license: "9632587", specialtyId: 3, phone: "5534567890" },
  { id: 4, name: "Ricardo Pacheco Díaz", license: "7412589", specialtyId: 3, phone: "5545678901" },
];

const INITIAL_APPOINTMENTS = [
  { id: 1, patientId: 1, doctorId: 1, doctor: "Dra. Laura Méndez", date: "2026-11-10 09:00", reason: "Revisión general", status: "attended" },
  { id: 2, patientId: 1, doctorId: 1, doctor: "Dra. Laura Méndez", date: "2026-11-20 10:00", reason: "Resultados", status: "pending" },
  { id: 3, patientId: 1, doctorId: 2, doctor: "Dr. Jorge Castillo", date: "2026-11-28 12:00", reason: "Dolor de espalda", status: "pending" },
  { id: 4, patientId: 3, doctorId: 2, doctor: "Dr. Jorge Castillo", date: "2026-11-25 12:00", reason: "Presión alta", status: "pending" },
];

const session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: "admin" };

if (session.role !== "admin") {
  location.href = "login.html";
}

const form = document.getElementById("doctor-form");
const formTitle = document.getElementById("form-title");
const message = document.getElementById("doctors-message");
const searchInput = document.getElementById("search-input");
const specialtyFilter = document.getElementById("specialty-filter");
const tableBody = document.getElementById("doctors-table-body");

function loadList(key, initialList) {
  return JSON.parse(localStorage.getItem(key)) || initialList;
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
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

function getSpecialty(id) {
  return loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES).find((item) => item.id === id);
}

function countPendingAppointments(doctorId) {
  return loadList(APPOINTMENTS_KEY, INITIAL_APPOINTMENTS).filter((item) => {
    return item.doctorId === doctorId && item.status === "pending";
  }).length;
}

function fillSpecialtySelects() {
  const specialties = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES);

  form.specialty.innerHTML = `<option value="">Selecciona una especialidad</option>`;
  specialtyFilter.innerHTML = `<option value="">Todas</option>`;

  specialties.forEach((specialty) => {
    const option = `<option value="${specialty.id}">${escapeHtml(specialty.name)}</option>`;
    form.specialty.innerHTML += option;
    specialtyFilter.innerHTML += option;
  });
}

function renderDoctors() {
  const search = searchInput.value.trim().toLowerCase();
  const specialtyId = Number(specialtyFilter.value);

  const doctors = loadList(DOCTORS_KEY, INITIAL_DOCTORS).filter((doctor) => {
    const matchesText = `${doctor.name} ${doctor.license}`.toLowerCase().includes(search);
    const matchesSpecialty = !specialtyId || doctor.specialtyId === specialtyId;
    return matchesText && matchesSpecialty;
  });

  tableBody.innerHTML = "";

  if (doctors.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">No se encontraron doctores.</td></tr>`;
    return;
  }

  for (const doctor of doctors) {
    const specialty = getSpecialty(doctor.specialtyId);
    let specialtyName = "Sin especialidad";

    if (specialty) {
      specialtyName = specialty.name;
    }

    tableBody.innerHTML += `
      <tr>
        <td data-label="Doctor">${escapeHtml(doctor.name)}</td>
        <td data-label="Cédula">${escapeHtml(doctor.license)}</td>
        <td data-label="Especialidad"><span class="doctors-badge color-${doctor.specialtyId % 5}">${escapeHtml(specialtyName)}</span></td>
        <td data-label="Teléfono">${escapeHtml(doctor.phone)}</td>
        <td data-label="Citas pendientes">${countPendingAppointments(doctor.id)}</td>
        <td>
          <button type="button" data-action="edit" data-id="${doctor.id}">Editar</button>
          <button type="button" class="doctors-button-danger" data-action="delete" data-id="${doctor.id}">Eliminar</button>
        </td>
      </tr>`;
  }
}

function validateDoctor(doctor) {
  const namePattern = /^[A-Za-zÁÉÍÓÚÑáéíóúñ. ]{3,}$/;
  const licensePattern = /^\d{7,8}$/;
  const phonePattern = /^\d{10}$/;

  if (!namePattern.test(doctor.name)) {
    return "Escribe un nombre válido (solo letras).";
  }

  if (!licensePattern.test(doctor.license)) {
    return "La cédula debe tener 7 u 8 dígitos.";
  }

  const doctors = loadList(DOCTORS_KEY, INITIAL_DOCTORS);
  const licenseExists = doctors.some((item) => item.license === doctor.license && item.id !== doctor.id);
  if (licenseExists) {
    return "Ya existe un doctor con esa cédula.";
  }

  if (!doctor.specialtyId) {
    return "Selecciona una especialidad.";
  }

  if (!phonePattern.test(doctor.phone)) {
    return "El teléfono debe tener 10 dígitos.";
  }

  return "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isNew = form.doctor_id.value === "";

  const doctor = {
    id: Number(form.doctor_id.value) || Date.now(),
    name: form.doctor_name.value.trim(),
    license: form.license.value.trim(),
    specialtyId: Number(form.specialty.value),
    phone: form.phone.value.trim(),
  };

  const error = validateDoctor(doctor);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  const doctors = loadList(DOCTORS_KEY, INITIAL_DOCTORS).filter((item) => item.id !== doctor.id);
  doctors.push(doctor);
  saveList(DOCTORS_KEY, doctors);

  if (isNew) {
    showMessage("Doctor registrado.", false);
  } else {
    showMessage("Doctor actualizado.", false);
  }

  form.reset();
});

form.addEventListener("reset", () => {
  form.doctor_id.value = "";
  formTitle.textContent = "Nuevo doctor";
  setTimeout(renderDoctors);
});

form.license.addEventListener("input", () => {
  form.license.value = form.license.value.replace(/\D/g, "");
});

form.phone.addEventListener("input", () => {
  form.phone.value = form.phone.value.replace(/\D/g, "");
});

function editDoctor(id) {
  const doctor = loadList(DOCTORS_KEY, INITIAL_DOCTORS).find((item) => item.id === id);

  form.doctor_id.value = doctor.id;
  form.doctor_name.value = doctor.name;
  form.license.value = doctor.license;
  form.specialty.value = doctor.specialtyId;
  form.phone.value = doctor.phone;
  formTitle.textContent = "Editar doctor";
  form.doctor_name.focus();
}

function deleteDoctor(id) {
  const doctor = loadList(DOCTORS_KEY, INITIAL_DOCTORS).find((item) => item.id === id);
  const pending = countPendingAppointments(id);

  if (pending > 0) {
    showMessage(`No se puede eliminar a ${doctor.name}: tiene ${pending} cita(s) pendiente(s).`, true);
    return;
  }

  if (!confirm(`¿Eliminar al doctor ${doctor.name}?`)) {
    return;
  }

  const otherDoctors = loadList(DOCTORS_KEY, INITIAL_DOCTORS).filter((item) => item.id !== id);
  saveList(DOCTORS_KEY, otherDoctors);
  form.reset();
  showMessage("Doctor eliminado.", false);
}

tableBody.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (action === "edit") {
    editDoctor(id);
  } else if (action === "delete") {
    deleteDoctor(id);
  }
});

searchInput.addEventListener("input", renderDoctors);
specialtyFilter.addEventListener("change", renderDoctors);

document.getElementById("print-button").addEventListener("click", () => {
  window.print();
});

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
});

fillSpecialtySelects();
renderDoctors();
