const SPECIALTIES_KEY = "medicitas-specialties";
const DOCTORS_KEY = "medicitas-doctors";
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

const session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: "admin" };

if (session.role !== "admin") {
  location.href = "login.html";
}

const form = document.getElementById("specialty-form");
const formTitle = document.getElementById("form-title");
const message = document.getElementById("specialties-message");
const searchInput = document.getElementById("search-input");
const tableBody = document.getElementById("specialties-table-body");

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

function countDoctors(specialtyId) {
  return loadList(DOCTORS_KEY, INITIAL_DOCTORS).filter((doctor) => doctor.specialtyId === specialtyId).length;
}

function renderSpecialties() {
  const search = searchInput.value.trim().toLowerCase();

  const specialties = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES).filter((specialty) => {
    return `${specialty.name} ${specialty.description}`.toLowerCase().includes(search);
  });

  tableBody.innerHTML = "";

  if (specialties.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4">No se encontraron especialidades.</td></tr>`;
    return;
  }

  for (const specialty of specialties) {
    tableBody.innerHTML += `
      <tr>
        <td data-label="Especialidad"><span class="specialties-badge color-${specialty.id % 5}">${escapeHtml(specialty.name)}</span></td>
        <td data-label="Descripción">${escapeHtml(specialty.description)}</td>
        <td data-label="Doctores">${countDoctors(specialty.id)}</td>
        <td>
          <button type="button" data-action="edit" data-id="${specialty.id}">Editar</button>
          <button type="button" class="specialties-button-danger" data-action="delete" data-id="${specialty.id}">Eliminar</button>
        </td>
      </tr>`;
  }
}

function validateSpecialty(specialty) {
  if (specialty.name.length < 3) {
    return "Escribe el nombre de la especialidad (mínimo 3 letras).";
  }

  const specialties = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES);
  const nameExists = specialties.some((item) => {
    return item.name.toLowerCase() === specialty.name.toLowerCase() && item.id !== specialty.id;
  });

  if (nameExists) {
    return "Ya existe una especialidad con ese nombre.";
  }

  return "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isNew = form.specialty_id.value === "";

  const specialty = {
    id: Number(form.specialty_id.value) || Date.now(),
    name: form.specialty_name.value.trim(),
    description: form.description.value.trim(),
  };

  const error = validateSpecialty(specialty);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  const specialties = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES).filter((item) => item.id !== specialty.id);
  specialties.push(specialty);
  saveList(SPECIALTIES_KEY, specialties);

  if (isNew) {
    showMessage("Especialidad registrada.", false);
  } else {
    showMessage("Especialidad actualizada.", false);
  }

  form.reset();
});

form.addEventListener("reset", () => {
  form.specialty_id.value = "";
  formTitle.textContent = "Nueva especialidad";
  setTimeout(renderSpecialties);
});

function editSpecialty(id) {
  const specialty = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES).find((item) => item.id === id);

  form.specialty_id.value = specialty.id;
  form.specialty_name.value = specialty.name;
  form.description.value = specialty.description;
  formTitle.textContent = "Editar especialidad";
  form.specialty_name.focus();
}

function deleteSpecialty(id) {
  const specialty = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES).find((item) => item.id === id);
  const doctorCount = countDoctors(id);

  if (doctorCount > 0) {
    showMessage(`No se puede eliminar "${specialty.name}": tiene ${doctorCount} doctor(es) asignado(s). Cámbialos de especialidad primero.`, true);
    return;
  }

  if (!confirm(`¿Eliminar la especialidad "${specialty.name}"?`)) {
    return;
  }

  const otherSpecialties = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES).filter((item) => item.id !== id);
  saveList(SPECIALTIES_KEY, otherSpecialties);
  form.reset();
  showMessage("Especialidad eliminada.", false);
}

tableBody.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (action === "edit") {
    editSpecialty(id);
  } else if (action === "delete") {
    deleteSpecialty(id);
  }
});

searchInput.addEventListener("input", renderSpecialties);

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
});

renderSpecialties();
