const PATIENTS_KEY = "medicitas-patients";
const DOCTORS_KEY = "medicitas-doctors";
const SPECIALTIES_KEY = "medicitas-specialties";
const APPOINTMENTS_KEY = "medicitas-appointments";
const SESSION_KEY = "medicitas-session";

const INITIAL_PATIENTS = [
  { id: 1, firstName: "Carlos", lastName: "Ramírez López", phone: "5511122233", birthDate: "1985-03-14", email: "carlos@correo.com" },
  { id: 2, firstName: "Fernanda", lastName: "Gómez Torres", phone: "5522233344", birthDate: "1992-07-22", email: "fer@correo.com" },
  { id: 3, firstName: "Luis", lastName: "Martínez Vega", phone: "5533344455", birthDate: "1978-11-05", email: "luis@correo.com" },
];

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
  { id: 4, patientId: 3, doctorId: 2, doctor: "Dr. Jorge Castillo", date: "2026-11-25 12:00", reason: "Presión alta", status: "cancelled" },
];

const session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || { role: "reception" };

const message = document.getElementById("receipt-message");
const sheet = document.getElementById("receipt-sheet");
const printButton = document.getElementById("print-button");

function loadList(key, initialList) {
  return JSON.parse(localStorage.getItem(key)) || initialList;
}

function showError(text) {
  message.textContent = text;
  message.hidden = false;
  sheet.hidden = true;
  printButton.disabled = true;
}

function formatDate(dateText) {
  const [date, time] = dateText.split(" ");
  const fullDate = new Date(`${date}T00:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `${fullDate} · ${time} h`;
}

function createFolio(id) {
  return `C-${String(id).padStart(5, "0")}`;
}

function showReceipt() {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));

  const appointment = loadList(APPOINTMENTS_KEY, INITIAL_APPOINTMENTS).find((item) => item.id === id);

  if (!appointment) {
    showError("No se encontró la cita. Revisa que el enlace sea correcto.");
    return;
  }

  if (session.role === "patient" && appointment.patientId !== session.patientId) {
    showError("No tienes permiso para ver este comprobante.");
    return;
  }

  const patient = loadList(PATIENTS_KEY, INITIAL_PATIENTS).find((item) => item.id === appointment.patientId);
  const doctor = loadList(DOCTORS_KEY, INITIAL_DOCTORS).find((item) => item.id === appointment.doctorId);

  let doctorName = appointment.doctor || "Sin doctor";
  let specialtyName = "Sin especialidad";

  if (doctor) {
    doctorName = doctor.name;
    const specialty = loadList(SPECIALTIES_KEY, INITIAL_SPECIALTIES).find((item) => item.id === doctor.specialtyId);

    if (specialty) {
      specialtyName = specialty.name;
    }
  }

  document.getElementById("folio").textContent = createFolio(appointment.id);
  document.getElementById("appointment-date").textContent = formatDate(appointment.date);
  document.getElementById("doctor-name").textContent = doctorName;
  document.getElementById("specialty-name").textContent = specialtyName;
  document.getElementById("reason").textContent = appointment.reason;

  if (patient) {
    document.getElementById("patient-name").textContent = `${patient.firstName} ${patient.lastName}`;
    document.getElementById("patient-phone").textContent = patient.phone;
  }

  document.getElementById("cancelled-stamp").hidden = appointment.status !== "cancelled";
  sheet.hidden = false;
}

printButton.addEventListener("click", () => {
  window.print();
});

document.getElementById("back-button").addEventListener("click", () => {
  history.back();
});

document.getElementById("logout-button").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.href = "login.html";
});

showReceipt();
