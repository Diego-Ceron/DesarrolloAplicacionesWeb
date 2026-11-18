const USERS_KEY = "medicitas-users";
const SESSION_KEY = "medicitas-session";

const INITIAL_USERS = [
  { id: 1, name: "Administrador", username: "admin", password: "admin123", role: "admin", doctorId: null, active: true },
  { id: 2, name: "Recepción", username: "recepcion", password: "recep123", role: "reception", doctorId: null, active: true },
  { id: 3, name: "Dra. Laura Méndez", username: "dr.mendez", password: "doctor123", role: "doctor", doctorId: 1, active: true },
  { id: 4, name: "Carlos Ramírez", username: "carlos", password: "paciente123", role: "patient", doctorId: null, active: true },
];

const doctors = [
  { id: 1, name: "Laura Méndez Ríos" },
  { id: 2, name: "Jorge Castillo Peña" },
  { id: 3, name: "Ana Sofía Herrera" },
];

const ROLE_NAMES = {
  admin: "Administrador",
  reception: "Recepción",
  doctor: "Doctor",
  patient: "Paciente",
};

const session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: "admin", username: "admin" };

if (session.role !== "admin") {
  location.href = "login.html";
}

const form = document.getElementById("user-form");
const formTitle = document.getElementById("form-title");
const saveButton = document.getElementById("save-button");
const doctorField = document.getElementById("doctor-field");
const message = document.getElementById("users-message");
const searchInput = document.getElementById("search-input");
const roleFilter = document.getElementById("role-filter");
const tableBody = document.getElementById("users-table-body");

function loadUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY)) || INITIAL_USERS;
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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

function isValidPassword(password) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function createTemporaryPassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  let password = "";

  for (let i = 0; i < 7; i++) {
    password += letters[Math.floor(Math.random() * letters.length)];
  }

  for (let i = 0; i < 3; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return password;
}

function isLastActiveAdmin(user) {
  const activeAdmins = loadUsers().filter((item) => item.role === "admin" && item.active);
  return user.role === "admin" && user.active && activeAdmins.length === 1;
}

function fillDoctorSelect(selectedDoctorId) {
  const editingId = Number(form.user_id.value);
  const usedDoctors = loadUsers()
    .filter((item) => item.role === "doctor" && item.id !== editingId)
    .map((item) => item.doctorId);

  form.doctor.innerHTML = `<option value="">Selecciona un doctor</option>`;

  doctors.forEach((doctor) => {
    if (!usedDoctors.includes(doctor.id)) {
      form.doctor.innerHTML += `<option value="${doctor.id}">${escapeHtml(doctor.name)}</option>`;
    }
  });

  form.doctor.value = selectedDoctorId || "";
}

function toggleDoctorField() {
  doctorField.hidden = form.role.value !== "doctor";
}

function renderUsers() {
  const search = searchInput.value.trim().toLowerCase();
  const role = roleFilter.value;

  const users = loadUsers().filter((user) => {
    const matchesText = `${user.name} ${user.username}`.toLowerCase().includes(search);
    const matchesRole = role === "" || user.role === role;
    return matchesText && matchesRole;
  });

  tableBody.innerHTML = "";

  if (users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5">No se encontraron cuentas.</td></tr>`;
    return;
  }

  for (const user of users) {
    let name = escapeHtml(user.name);
    if (user.username === session.username) {
      name += " (tú)";
    }

    let statusText = "Activa";
    let statusButton = `<button type="button" class="users-button-danger" data-action="status" data-id="${user.id}">Desactivar</button>`;
    let rowClass = "";

    if (!user.active) {
      statusText = "Inactiva";
      statusButton = `<button type="button" data-action="status" data-id="${user.id}">Activar</button>`;
      rowClass = "is-inactive";
    }

    let editButton = "";
    if (user.role !== "patient") {
      editButton = `<button type="button" class="users-button-secondary" data-action="edit" data-id="${user.id}">Editar</button>`;
    }

    tableBody.innerHTML += `
      <tr class="${rowClass}">
        <td data-label="Nombre">${name}</td>
        <td data-label="Usuario">${escapeHtml(user.username)}</td>
        <td data-label="Rol"><span class="users-role role-${user.role}">${ROLE_NAMES[user.role]}</span></td>
        <td data-label="Estado">${statusText}</td>
        <td>
          ${editButton}
          <button type="button" class="users-button-secondary" data-action="password" data-id="${user.id}">Restablecer clave</button>
          ${statusButton}
        </td>
      </tr>`;
  }
}

function validateUser(user, isNew) {
  const namePattern = /^[A-Za-zÁÉÍÓÚÑáéíóúñ. ]{2,}$/;
  const usernamePattern = /^[a-z0-9._-]{3,30}$/;
  const users = loadUsers();

  if (!namePattern.test(user.name)) {
    return "Escribe un nombre válido (solo letras).";
  }

  if (!usernamePattern.test(user.username)) {
    return "El usuario debe tener de 3 a 30 caracteres: letras, números, punto o guion.";
  }

  if (users.some((item) => item.username === user.username && item.id !== user.id)) {
    return "Ese usuario ya existe.";
  }

  if (user.role === "") {
    return "Selecciona un rol.";
  }

  if (user.role === "doctor" && !user.doctorId) {
    return "Selecciona el doctor de esta cuenta.";
  }

  if (isNew && !isValidPassword(user.password)) {
    return "La contraseña debe tener mínimo 8 caracteres, con letras y números.";
  }

  if (!isNew && user.password !== "" && !isValidPassword(user.password)) {
    return "La contraseña debe tener mínimo 8 caracteres, con letras y números.";
  }

  const oldUser = users.find((item) => item.id === user.id);
  if (oldUser && isLastActiveAdmin(oldUser) && user.role !== "admin") {
    return "Debe quedar al menos un administrador activo.";
  }

  return "";
}

form.role.addEventListener("change", toggleDoctorField);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isNew = form.user_id.value === "";

  const user = {
    id: Number(form.user_id.value) || Date.now(),
    name: form.full_name.value.trim(),
    username: form.username.value.trim().toLowerCase(),
    role: form.role.value,
    doctorId: null,
    password: form.password.value,
  };

  if (user.role === "doctor") {
    user.doctorId = Number(form.doctor.value) || null;
  }

  const error = validateUser(user, isNew);
  if (error !== "") {
    showMessage(error, true);
    return;
  }

  const users = loadUsers();

  if (isNew) {
    user.active = true;
    users.push(user);
    showMessage(`Cuenta "${user.username}" creada.`, false);
  } else {
    const oldUser = users.find((item) => item.id === user.id);
    oldUser.name = user.name;
    oldUser.username = user.username;
    oldUser.role = user.role;
    oldUser.doctorId = user.doctorId;

    if (user.password !== "") {
      oldUser.password = user.password;
    }

    showMessage("Cuenta actualizada.", false);
  }

  saveUsers(users);
  form.reset();
});

form.addEventListener("reset", () => {
  form.user_id.value = "";
  formTitle.textContent = "Nueva cuenta";
  saveButton.textContent = "Crear cuenta";
  document.getElementById("password-label").textContent = "Contraseña";

  setTimeout(() => {
    fillDoctorSelect(null);
    toggleDoctorField();
    renderUsers();
  });
});

function editUser(id) {
  const user = loadUsers().find((item) => item.id === id);

  form.user_id.value = user.id;
  form.full_name.value = user.name;
  form.username.value = user.username;
  form.role.value = user.role;
  form.password.value = "";

  fillDoctorSelect(user.doctorId);
  toggleDoctorField();

  formTitle.textContent = `Editar: ${user.username}`;
  saveButton.textContent = "Guardar cambios";
  document.getElementById("password-label").textContent = "Nueva contraseña (déjala vacía para no cambiarla)";
  form.full_name.focus();
}

function changeStatus(id) {
  const users = loadUsers();
  const user = users.find((item) => item.id === id);

  if (user.active) {
    if (user.username === session.username) {
      showMessage("No puedes desactivar tu propia cuenta.", true);
      return;
    }

    if (isLastActiveAdmin(user)) {
      showMessage("No se puede desactivar al último administrador.", true);
      return;
    }

    if (!confirm(`¿Desactivar la cuenta "${user.username}"? Ya no podrá iniciar sesión.`)) {
      return;
    }
  }

  user.active = !user.active;
  saveUsers(users);

  if (user.active) {
    showMessage("Cuenta activada.", false);
  } else {
    showMessage("Cuenta desactivada.", false);
  }

  renderUsers();
}

function resetPassword(id) {
  const users = loadUsers();
  const user = users.find((item) => item.id === id);

  if (!confirm(`¿Crear una contraseña nueva para "${user.username}"? La anterior dejará de funcionar.`)) {
    return;
  }

  const newPassword = createTemporaryPassword();
  user.password = newPassword;
  saveUsers(users);

  document.getElementById("password-title").textContent = `Nueva contraseña para ${user.username}`;
  document.getElementById("password-value").textContent = newPassword;
  document.getElementById("password-box").hidden = false;
}

document.getElementById("password-close").addEventListener("click", () => {
  document.getElementById("password-box").hidden = true;
});

tableBody.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);

  if (action === "edit") {
    editUser(id);
  } else if (action === "status") {
    changeStatus(id);
  } else if (action === "password") {
    resetPassword(id);
  }
});

searchInput.addEventListener("input", renderUsers);
roleFilter.addEventListener("change", renderUsers);

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
});

fillDoctorSelect(null);
renderUsers();