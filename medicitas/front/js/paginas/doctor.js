
(() => {

    "use strict";

    const B = window.MedicitasBridge;

    const $ = id => document.getElementById(id);

    if (!B) {
        console.error("No se encontró MedicitasBridge.");
        return;
    }

    const session = B.getSession();
    const role = B.getRole();

    const today = B.dateLocal(new Date());

    const doctorId =
        session?.doctorId ??
        session?.personaId ??
        session?.idDoctor ??
        session?.id;

    const doctorRecord = B.getDoctors().find(d =>
        String(d.id) === String(doctorId)
    );

    // OBTENER NOMBRE DEL PACIENTE

    function patientName(id) {

        const patient = B.getPatients().find(p =>
            String(p.id) === String(id)
        );

        if (!patient) return "Paciente";

        return patient.nombre ||
            [patient.firstName, patient.lastName]
                .filter(Boolean)
                .join(" ") ||
            "Paciente";
    }

    // PROTEGER CONTENIDO HTML

    function safe(value) {

        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    // NORMALIZAR ESTADOS

    function normalizeStatus(status) {

        const value = String(status || "pendiente")
            .toLowerCase()
            .trim();

        const states = {
            pending: "pendiente",
            pendiente: "pendiente",

            arrived: "asistio",
            asistio: "asistio",
            "asistió": "asistio",

            attended: "atendida",
            atendida: "atendida",

            "no-show": "no-asistio",
            "no_show": "no-asistio",
            "no asistio": "no-asistio",
            "no asistió": "no-asistio",
            "no-asistio": "no-asistio",

            cancelled: "cancelada",
            cancelada: "cancelada"
        };

        return states[value] || value;
    }

    // VALIDAR ACCESO

    function checkAccess() {

        if (
            !session ||
            role !== "doctor" ||
            doctorId == null ||
            !doctorRecord
        ) {

            $("mensaje-acceso").hidden = false;

            $("mensaje-acceso").textContent =
                "Acceso restringido. Inicia sesión con la cuenta de un doctor.";

            document.querySelector(".resumen").hidden = true;

            document.querySelectorAll(".panel").forEach(panel => {
                panel.hidden = true;
            });

            $("aviso-horario").hidden = true;

            return false;
        }

        return true;
    }

    // COMPROBAR DISPONIBILIDAD DEL DOCTOR

    function hasAvailability() {

        if (typeof B.getDoctorAvailability !== "function") {
            return null;
        }

        const startDate = new Date();

        for (let i = 0; i < 7; i++) {

            const date = new Date(startDate);

            date.setDate(startDate.getDate() + i);

            const localDate = B.dateLocal(date);

            const ranges = B.getDoctorAvailability(
                doctorId,
                localDate
            ) || [];

            if (ranges.length > 0) {
                return true;
            }
        }

        return false;
    }

    // OBTENER CITAS PROPIAS

    function getDoctorAppointments() {

        return B.getAppointments().filter(c =>

            String(c.doctorId) === String(doctorId) &&
            normalizeStatus(c.estado) !== "cancelada"

        );
    }

    // MOSTRAR AGENDA

    localStorage.setItem("medicitas-doctor-ultima-visita", today);

    function render() {

        const all = getDoctorAppointments();

        const todayList = all
            .filter(c => c.fecha === today)
            .sort((a, b) =>
                String(a.hora).localeCompare(String(b.hora))
            );

        const future = all
            .filter(c => c.fecha > today)
            .sort((a, b) =>
                `${a.fecha} ${a.hora}`.localeCompare(
                    `${b.fecha} ${b.hora}`
                )
            );

        // RESUMEN

        $("total-hoy").textContent = todayList.length;

        $("total-pendientes").textContent =
            todayList.filter(c =>
                normalizeStatus(c.estado) === "pendiente"
            ).length;

        $("total-atendidas").textContent =
            todayList.filter(c =>
                normalizeStatus(c.estado) === "atendida"
            ).length;

        // AGENDA DEL DÍA

        $("agenda-hoy").innerHTML = todayList.length

            ? todayList.map((c, index) => {

                const status = normalizeStatus(c.estado);

                const canMarkAttended =
                    status === "asistio" &&
                    B.can("citas.estado");

                const statusText = safe(status);

                return `

                    <article class="cita ${
                        index === 0 ? "siguiente" : ""
                    }">

                        <div class="hora">
                            ${safe(c.hora)}
                        </div>

                        <div class="detalle">

                            <h3>
                                ${safe(patientName(c.pacienteId))}
                            </h3>

                            <p>
                                ${safe(c.motivo || "Sin motivo especificado")}
                            </p>

                            <span class="estado ${safe(status)}">
                                ${statusText}
                            </span>

                        </div>

                        <div class="acciones no-print">

                            ${
                                canMarkAttended
                                ? `
                                    <button
                                        type="button"
                                        class="btn"
                                        data-done="${safe(c.id)}"
                                    >
                                        Atendida
                                    </button>
                                `
                                : status === "atendida"
                                    ? `
                                        <span class="muted">
                                            Finalizada
                                        </span>
                                    `
                                    : ""
                            }

                            <a
                                class="btn secundario"
                                href="pacientes.html?id=${encodeURIComponent(c.pacienteId)}#archivos"
                            >
                                Ver archivos
                            </a>

                        </div>

                    </article>

                `;

            }).join("")

            : `
                <p class="muted">
                    No tienes citas programadas para hoy.
                </p>
            `;

        // PRÓXIMAS CITAS

        $("agenda-proximas").innerHTML = future.map(c => {

            const status = normalizeStatus(c.estado);

            return `

                <tr>

                    <td>${safe(c.fecha)}</td>

                    <td>${safe(c.hora)}</td>

                    <td>
                        ${safe(patientName(c.pacienteId))}
                    </td>

                    <td>
                        ${safe(c.motivo || "—")}
                    </td>

                    <td>
                        <span class="estado ${safe(status)}">
                            ${safe(status)}
                        </span>
                    </td>

                </tr>

            `;

        }).join("");

        $("sin-proximas").hidden = future.length > 0;

        // MARCAR CITA ATENDIDA

        $("agenda-hoy")
            .querySelectorAll("[data-done]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    if (!B.can("citas.estado")) {

                        B.notify(
                            "No tienes permiso para cambiar el estado."
                        );

                        return;
                    }

                    const cita = B.getAppointments().find(c =>
                        String(c.id) === String(button.dataset.done)
                    );

                    if (
                        !cita ||
                        String(cita.doctorId) !== String(doctorId) ||
                        normalizeStatus(cita.estado) !== "asistio"
                    ) {

                        B.notify(
                            "Solo puedes marcar como atendida una cita que recepción registró como asistida."
                        );

                        return;
                    }

                    B.updateAppointment(
                        button.dataset.done,
                        { estado: "atendida" }
                    );

                    render();

                });

            });

    }

    // INICIALIZACIÓN

    $("fecha-agenda").textContent =
        new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    if (!checkAccess()) {
        return;
    }

    $("saludo-doctor").textContent =
        `Mi agenda · ${doctorRecord.nombre || doctorRecord.name}`;

    const availability = hasAvailability();

    if (availability === false) {
        $("aviso-horario").hidden = false;
    }

    render();

})();
