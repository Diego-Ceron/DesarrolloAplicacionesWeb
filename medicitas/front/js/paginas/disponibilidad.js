const DOCTORS_KEY = "medicitas-doctors";
const AVAILABILITY_KEY = "medicitas-availability";
const APPOINTMENTS_KEY = "medicitas-appointments";
const SESSION_KEY = "medicitas-session";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FIRST_HOUR = 8;
const LAST_HOUR = 17;

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

if (session.role !== "admin" && session.role !== "doctor") {
  location.href = "login.html";
}

const isDoctor = session.role === "doctor";

const form = document.getElementById("availability-form");
const doctorSelect = document.getElementById("doctor-select");
const scheduleBody = document.getElementById("schedule-body");
const message = document.getElementById("availability-message");

function loadList(key, initialList) {
  return JSON.parse(localStorage.getItem(key)) || initialList;
}

function loadAvailability() {
  return JSON.parse(localStorage.getItem(AVAILABILITY_KEY)) || {};
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

function getHourOptions() {
  let options = "";

  for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
    const text = `${String(hour).padStart(2, "0")}:00`;
    options += `<option value="${text}">${text}</option>`;
  }

  return options;
}

function getDefaultSchedule() {
  const schedule = [];

  for (let i = 0; i < 7; i++) {
    schedule.push({ works: i < 5, start: "09:00", end: "14:00" });
  }

  return schedule;
}

function getDoctorSchedule(doctorId) {
  return loadAvailability()[doctorId] || getDefaultSchedule();
}

function renderSchedule() {
  const schedule = getDoctorSchedule(doctorSelect.value);
  const hourOptions = getHourOptions();

  scheduleBody.innerHTML = "";

  DAYS.forEach((day, index) => {
    scheduleBody.innerHTML += `
      <tr id="day-${index}">
        <td data-label="Día">${day}</td>
        <td><input type="checkbox" name="works-${index}" aria-label="Atiende el ${day}"></td>
        <td><select name="start-${index}" aria-label="Hora de inicio del ${day}">${hourOptions}</select></td>
        <td><select name="end-${index}" aria-label="Hora de fin del ${day}">${hourOptions}</select></td>
      </tr>`;
  });

  schedule.forEach((day, index) => {
    form[`works-${index}`].checked = day.works;
    form[`start-${index}`].value = day.start;
    form[`end-${index}`].value = day.end;
    updateDayRow(index);
  });
}

function updateDayRow(index) {
  const works = form[`works-${index}`].checked;
  const row = document.getElementById(`day-${index}`);

  form[`start-${index}`].disabled = !works;
  form[`end-${index}`].disabled = !works;
  row.classList.toggle("is-day-off", !works);
}

function readScheduleFromForm() {
  const schedule = [];

  for (let i = 0; i < 7; i++) {
    schedule.push({
      works: form[`works-${i}`].checked,
      start: form[`start-${i}`].value,
      end: form[`end-${i}`].value,
    });
  }

  return schedule;
}

function findInvalidDay(schedule) {
  for (let i = 0; i < 7; i++) {
    const row = document.getElementById(`day-${i}`);
    row.classList.remove("is-invalid");

    if (schedule[i].works && schedule[i].end <= schedule[i].start) {
      row.classList.add("is-invalid");
      return DAYS[i];
    }
  }

  return "";
}

function countAppointmentsOutside(doctorId, schedule) {
  const appointments = loadList(APPOINTMENTS_KEY, INITIAL_APPOINTMENTS);
  let count = 0;

  appointments.forEach((item) => {
    if (item.doctorId !== doctorId || item.status !== "pending") {
      return;
    }

    const [date, time] = item.date.split(" ");
    const dayIndex = (new Date(`${date}T00:00:00`).getDay() + 6) % 7;
    const day = schedule[dayIndex];

    if (!day.works || time < day.start || time >= day.end) {
      count++;
    }
  });

  return count;
}

function fillDoctorSelect() {
  const doctors = loadList(DOCTORS_KEY, INITIAL_DOCTORS);

  doctors.forEach((doctor) => {
    doctorSelect.innerHTML += `<option value="${doctor.id}">${escapeHtml(doctor.name)}</option>`;
  });

  if (isDoctor) {
    doctorSelect.value = session.doctorId;
    doctorSelect.disabled = true;
  }
}

scheduleBody.addEventListener("change", (event) => {
  if (event.target.type === "checkbox") {
    const index = Number(event.target.name.replace("works-", ""));
    updateDayRow(index);
  }
});

doctorSelect.addEventListener("change", () => {
  message.hidden = true;
  renderSchedule();
});

document.getElementById("copy-button").addEventListener("click", () => {
  for (let i = 1; i < 5; i++) {
    form[`works-${i}`].checked = form["works-0"].checked;
    form[`start-${i}`].value = form["start-0"].value;
    form[`end-${i}`].value = form["end-0"].value;
    updateDayRow(i);
  }

  showMessage("Se copió el horario del lunes al resto de la semana (martes a viernes).", false);
});

document.getElementById("discard-button").addEventListener("click", () => {
  renderSchedule();
  showMessage("Se descartaron los cambios.", false);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const doctorId = Number(doctorSelect.value);
  const schedule = readScheduleFromForm();

  const invalidDay = findInvalidDay(schedule);
  if (invalidDay !== "") {
    showMessage(`Revisa el ${invalidDay}: la hora de fin debe ser mayor que la de inicio.`, true);
    return;
  }

  const availability = loadAvailability();
  availability[doctorId] = schedule;
  localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(availability));

  const outside = countAppointmentsOutside(doctorId, schedule);
  if (outside > 0) {
    showMessage(`Horario guardado. Hay ${outside} cita(s) pendiente(s) fuera del nuevo horario.`, true);
  } else {
    showMessage("Horario guardado.", false);
  }
});

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
});

if (isDoctor) {
  document.getElementById("user-role").textContent = "Doctor";
  document.getElementById("panel-link").href = "doctor.html";
} else {
  document.getElementById("user-role").textContent = "Administrador";
}

fillDoctorSelect();
renderSchedule();
