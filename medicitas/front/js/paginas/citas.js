(() => {
    "use strict";

    const B = window.MedicitasBridge;

    const $ = id => document.getElementById(id);

    const form = $("form-cita");

    const today = B.dateLocal(new Date());

    let selectedTime = "";
    let cancelId = null;

    const patientName = id =>
        B.getPatients().find(p => String(p.id) === String(id))?.nombre || "Paciente";

    const doctorName = id =>
        B.getDoctors().find(d => String(d.id) === String(id))?.nombre || "Doctor";

    const clean = value =>
        String(value ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);

    const role = B.getRole();
    const session = B.getSession();

    // VALIDAR ACCESO

    function allowed() {

        if (!session) {
            $("mensaje-permisos").hidden = false;

            $("mensaje-permisos").textContent =
                "No se detectó una sesión. Inicia sesión para continuar.";

            form.hidden = true;

            return false;
        }

        if (!B.can("citas.ver")) {
            $("mensaje-permisos").hidden = false;

            $("mensaje-permisos").textContent =
                "Tu cuenta no tiene permiso para consultar esta sección.";

            form.hidden = true;

            return false;
        }

        return true;
    }

    // CARGAR PACIENTES Y DOCTORES

    function fillSelects() {

        const patientSelect = $("paciente");
        const doctorSelect = $("doctor");

        const patients = B.getPatients();
        const doctors = B.getDoctors();

        patientSelect.innerHTML =
            '<option value="">Selecciona un paciente</option>' +
            patients.map(p =>
                `<option value="${clean(p.id)}">
                    ${clean(p.nombre)}
                </option>`
            ).join("");

        doctorSelect.innerHTML =
            '<option value="">Selecciona un doctor</option>' +
            doctors.map(d =>
                `<option value="${clean(d.id)}">
                    ${clean(d.nombre)} - ${clean(d.especialidad || "")}
                </option>`
            ).join("");

        $("filtro-doctor").innerHTML =
            '<option value="">Todos los doctores</option>' +
            doctors.map(d =>
                `<option value="${clean(d.id)}">${clean(d.nombre)}</option>`
            ).join("");

        if (role === "paciente") {

            const ownId =
                session.pacienteId ??
                session.personaId ??
                session.idPaciente;

            if (ownId != null) {
                patientSelect.value = ownId;
            }

            patientSelect.disabled = true;
        }

        if (role === "doctor") {

            $("doctor").value =
                session.doctorId ??
                session.personaId ??
                session.idDoctor ??
                "";

            $("doctor").disabled = true;
        }
    }

    // GENERAR HORARIOS

    function slotsFor(doctorId, date) {

        if (!doctorId || !date) {
            return [];
        }

        const ranges = B.getDoctorAvailability(doctorId, date);

        const slots = [];

        ranges.forEach(range => {

            const start =
                range.inicio ||
                range.horaInicio ||
                range.start;

            const end =
                range.fin ||
                range.horaFin ||
                range.end;

            if (!start || !end) return;

            const [h, m] = start.split(":").map(Number);
            const [eh, em] = end.split(":").map(Number);

            let cursor = h * 60 + m;
            const finish = eh * 60 + em;

            while (cursor + 30 <= finish) {

                const hora =
                    String(Math.floor(cursor / 60)).padStart(2, "0");

                const minutos =
                    String(cursor % 60).padStart(2, "0");

                slots.push(`${hora}:${minutos}`);

                cursor += 30;
            }
        });

        return [...new Set(slots)].sort();
    }

    function renderSlots() {

        const doctorId = $("doctor").value;
        const date = $("fecha").value;

        const container = $("cita-horas");

        selectedTime = "";
        $("hora-seleccionada").value = "";

        if (!doctorId || !date) {

            container.innerHTML =
                '<p class="muted">Selecciona doctor y fecha.</p>';

            return;
        }

        if (date < today) {

            container.innerHTML =
                '<p class="muted">No se permiten fechas pasadas.</p>';

            return;
        }

        const slots = slotsFor(doctorId, date);

        if (!slots.length) {

            container.innerHTML =
                '<p class="muted">No hay horario configurado para este doctor.</p>';

            return;
        }

        const editingId = $("cita-id").value;

        const occupied = B.getAppointments()
            .filter(c =>
                String(c.doctorId) === String(doctorId) &&
                c.fecha === date &&
                c.estado !== "cancelada" &&
                String(c.id) !== String(editingId)
            )
            .map(c => c.hora);

        container.innerHTML = slots.map(time => {

            const busy = occupied.includes(time);

            return `
                <button
                    type="button"
                    class="hora ${busy ? "ocupada" : ""}"
                    data-hora="${time}"
                    ${busy ? "disabled" : ""}
                >
                    ${time}
                </button>
            `;

        }).join("");

        container.querySelectorAll("[data-hora]").forEach(button => {

            button.addEventListener("click", () => {

                container.querySelectorAll(".hora")
                    .forEach(b => b.classList.remove("seleccionada"));

                button.classList.add("seleccionada");

                selectedTime = button.dataset.hora;

                $("hora-seleccionada").value = selectedTime;

            });

        });
    }

    // MOSTRAR CITAS

    function renderAppointments() {

        const text = $("filtro-paciente").value.trim().toLowerCase();
        const doctor = $("filtro-doctor").value;
        const date = $("filtro-fecha").value;

        let list = B.getAppointments();

        if (role === "paciente") {

            const id =
                session.pacienteId ??
                session.personaId ??
                session.idPaciente;

            list = list.filter(c =>
                String(c.pacienteId) === String(id)
            );
        }

        if (role === "doctor") {

            const id =
                session.doctorId ??
                session.personaId ??
                session.idDoctor;

            list = list.filter(c =>
                String(c.doctorId) === String(id)
            );
        }

        list = list.filter(c => {

            return (
                (!text || patientName(c.pacienteId).toLowerCase().includes(text)) &&
                (!doctor || String(c.doctorId) === doctor) &&
                (!date || c.fecha === date)
            );

        });

        list.sort((a, b) =>
            `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
        );

        $("tabla-citas").innerHTML = list.map(c => {

            const status = (c.estado || "pendiente").toLowerCase();

            const canCancel =
                B.can("citas.cancelar") &&
                status !== "cancelada";

            const canEdit =
                B.can("citas.editar") &&
                status === "pendiente";

            return `
                <tr>

                    <td>${clean(c.fecha)}</td>

                    <td>${clean(c.hora)}</td>

                    <td>${clean(patientName(c.pacienteId))}</td>

                    <td>${clean(doctorName(c.doctorId))}</td>

                    <td>
                        <span class="estado ${clean(status).replace(/\s/g, "-")}">
                            ${clean(status)}
                        </span>
                    </td>

                    <td class="no-print">

                        ${canEdit
                            ? `<button class="btn secundario" data-edit="${clean(c.id)}">Editar</button>`
                            : ""
                        }

                        ${canCancel
                            ? `<button class="btn peligro" data-cancel="${clean(c.id)}">Cancelar</button>`
                            : ""
                        }

                    </td>

                </tr>
            `;

        }).join("");

        $("sin-citas").hidden = list.length > 0;

        $("tabla-citas").querySelectorAll("[data-cancel]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    openCancel(button.dataset.cancel);
                });
            });

        $("tabla-citas").querySelectorAll("[data-edit]")
            .forEach(button => {
                button.addEventListener("click", () => {
                    editAppointment(button.dataset.edit);
                });
            });
    }

    // EDITAR CITA

    function editAppointment(id) {

        const cita = B.getAppointments().find(
            c => String(c.id) === String(id)
        );

        if (!cita) return;

        $("cita-id").value = cita.id;
        $("paciente").value = cita.pacienteId;
        $("doctor").value = cita.doctorId;
        $("fecha").value = cita.fecha;
        $("motivo").value = cita.motivo || "";

        $("titulo-formulario").textContent = "Editar cita";

        renderSlots();

        setTimeout(() => {

            const button = [
                ...$("cita-horas").querySelectorAll("button")
            ].find(b => b.dataset.hora === cita.hora);

            if (button && !button.disabled) {
                button.click();
            }

        }, 0);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // CANCELAR CITA

    function openCancel(id) {

        cancelId = id;

        $("modal-cancelar").classList.add("abierto");
    }

    function closeCancel() {

        cancelId = null;

        $("modal-cancelar").classList.remove("abierto");
    }

    $("confirmar-cancelacion").addEventListener("click", () => {

        if (cancelId !== null && B.can("citas.cancelar")) {

            B.updateAppointment(cancelId, {
                estado: "cancelada"
            });

            B.notify("La cita fue cancelada correctamente.");

            renderSlots();
            renderAppointments();
        }

        closeCancel();

    });

    $("cerrar-modal").addEventListener("click", closeCancel);

    // GUARDAR CITA

    form.addEventListener("submit", event => {

        event.preventDefault();

        const editingId = $("cita-id").value;

        const permiso = editingId
            ? "citas.editar"
            : "citas.crear";

        if (!B.can(permiso)) {

            B.notify("No tienes permiso para realizar esta acción.");

            return;
        }

        const patientId = $("paciente").value;
        const doctorId = $("doctor").value;
        const date = $("fecha").value;
        const reason = $("motivo").value.trim();

        const time =
            selectedTime ||
            $("hora-seleccionada").value;

        if (!patientId || !doctorId || !date || !time || !reason) {

            B.notify("Completa todos los campos y selecciona una hora.");

            return;
        }

        if (date < today) {

            B.notify("No puedes registrar citas en fechas pasadas.");

            return;
        }

        const conflict = B.getAppointments().some(c =>

            String(c.id) !== String(editingId) &&
            c.estado !== "cancelada" &&
            c.fecha === date &&
            c.hora === time &&
            String(c.doctorId) === String(doctorId)

        );

        if (conflict) {

            B.notify("Ese horario ya está ocupado.");

            return;
        }

        if (!slotsFor(doctorId, date).includes(time)) {

            B.notify("La hora está fuera del horario del doctor.");

            return;
        }

        if (editingId) {

            B.updateAppointment(editingId, {
                pacienteId: patientId,
                doctorId,
                fecha: date,
                hora: time,
                motivo: reason
            });

            B.notify("Cita actualizada correctamente.");

        } else {

            B.saveAppointment({
                pacienteId: patientId,
                doctorId,
                fecha: date,
                hora: time,
                motivo: reason,
                estado: "pendiente"
            });

            B.notify("Cita registrada correctamente.");
        }

        form.reset();

        $("cita-id").value = "";

        $("titulo-formulario").textContent = "Agendar cita";

        selectedTime = "";

        fillSelects();
        renderSlots();
        renderAppointments();

    });

    // EVENTOS

    $("doctor").addEventListener("change", renderSlots);

    $("fecha").addEventListener("change", renderSlots);

    [
        "filtro-paciente",
        "filtro-doctor",
        "filtro-fecha"
    ].forEach(id => {

        $(id).addEventListener("input", renderAppointments);

        $(id).addEventListener("change", renderAppointments);

    });

    $("limpiar").addEventListener("click", () => {

        setTimeout(() => {

            $("cita-id").value = "";

            $("titulo-formulario").textContent = "Agendar cita";

            selectedTime = "";

            renderSlots();

        }, 0);

    });

    // INICIALIZACIÓN

    if (allowed()) {

        fillSelects();

        $("fecha").min = today;

        renderSlots();

        renderAppointments();

    }

})();