const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const FILES_KEY = "medicitas-files";

const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileError = document.getElementById("file-error");
const filePreview = document.getElementById("file-preview");
const uploadButton = document.getElementById("upload-button");
const filesList = document.getElementById("files-list");

let pendingFile = null;
let currentPatientId = null;
let canModifyFiles = false;

function loadFiles() {
  return JSON.parse(localStorage.getItem(FILES_KEY)) || [];
}

function saveFiles(files) {
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
}

function getPatientFiles(patientId) {
  return loadFiles().filter((file) => file.patientId === patientId);
}

function deletePatientFiles(patientId) {
  const otherFiles = loadFiles().filter((file) => file.patientId !== patientId);
  saveFiles(otherFiles);
}

function getFileHtml(file) {
  let icon = `<img class="patients-file-icon" src="${file.data}" alt="">`;

  if (file.type === "application/pdf") {
    icon = `<b class="patients-file-icon patients-file-icon-pdf">PDF</b>`;
  }

  return `${icon}<span>${escapeHtml(file.name)}</span>`;
}

function renderFiles() {
  const files = getPatientFiles(currentPatientId);
  filesList.innerHTML = "";

  if (files.length === 0) {
    filesList.innerHTML = "<li>Este paciente no tiene archivos.</li>";
    return;
  }

  files.forEach((file) => {
    let buttons = `<button type="button" data-action="download" data-id="${file.id}">Descargar</button>`;

    if (canModifyFiles) {
      buttons += `<button type="button" class="patients-button-danger" data-action="delete" data-id="${file.id}">Eliminar</button>`;
    }

    filesList.innerHTML += `<li class="patients-file">${getFileHtml(file)} ${buttons}</li>`;
  });
}

function clearPreview() {
  pendingFile = null;
  fileInput.value = "";
  filePreview.innerHTML = "";
  uploadButton.disabled = true;
}

function openFiles(patient, canModify) {
  currentPatientId = patient.id;
  canModifyFiles = canModify;

  document.getElementById("files-patient-name").textContent = `${patient.firstName} ${patient.lastName}`;
  document.getElementById("files-hint").hidden = true;
  document.getElementById("files-panel").hidden = false;

  document.getElementById("upload-section").hidden = !canModify;

  fileError.textContent = "";
  clearPreview();
  renderFiles();
}

function closeFiles() {
  document.getElementById("files-hint").hidden = false;
  document.getElementById("files-panel").hidden = true;
}

function chooseFile(file) {
  clearPreview();
  fileError.textContent = "";

  if (!ALLOWED_TYPES.includes(file.type)) {
    fileError.textContent = `"${file.name}" no es válido: solo se aceptan PDF, JPG o PNG.`;
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    const megabytes = (file.size / 1024 / 1024).toFixed(1);
    fileError.textContent = `"${file.name}" pesa ${megabytes} MB y el máximo es 2 MB.`;
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    pendingFile = {
      name: file.name,
      type: file.type,
      data: reader.result,
    };

    filePreview.innerHTML = `<div class="patients-file">${getFileHtml(pendingFile)}</div>`;
    uploadButton.disabled = false;
  });

  reader.readAsDataURL(file);
}

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    chooseFile(fileInput.files[0]);
  }
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");

  if (event.dataTransfer.files.length > 0) {
    chooseFile(event.dataTransfer.files[0]);
  }
});

uploadButton.addEventListener("click", () => {
  const files = loadFiles();

  files.push({
    id: Date.now(),
    patientId: currentPatientId,
    name: pendingFile.name,
    type: pendingFile.type,
    data: pendingFile.data,
  });

  try {
    saveFiles(files);
  } catch (error) {
    fileError.textContent = "No hay espacio en el navegador. Sube un archivo más pequeño.";
    return;
  }

  clearPreview();
  renderFiles();
  renderPatients();
});

filesList.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const id = Number(event.target.dataset.id);
  const file = loadFiles().find((item) => item.id === id);

  if (action === "download") {
    const link = document.createElement("a");
    link.href = file.data;
    link.download = file.name;
    link.click();
  }

  if (action === "delete") {
    if (!confirm(`¿Eliminar el archivo "${file.name}"?`)) {
      return;
    }

    const otherFiles = loadFiles().filter((item) => item.id !== id);
    saveFiles(otherFiles);
    renderFiles();
    renderPatients();
  }
});