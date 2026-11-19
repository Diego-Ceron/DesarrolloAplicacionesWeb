
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

    const SEARCH_KEY = "medicitas-recepcion-busqueda";

    // OBTENER NOMBRES

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

    function doctorName(id) {

        const doctor = B.getDoctors().find(d =>
            String(d.id) === String(id)
        );

        return doctor?.nombre || doctor?.name || "Doctor";
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

    // VALIDAR PERMISOS

    function checkAccess() {

        const allowedRoles = [
            "recepcion",
            "recepción",
            "admin",
            "administrador"
        ];

        if (!session || !allowedRoles.includes(role)) {

            $("mensaje-acceso").hidden = false;

            $("mensaje-acceso").textContent =
                "Acceso restringido. Inicia sesión con una cuenta de recepción.";

            document.querySelector(".resumen").hidden = true;
            document.querySelector(".panel").hidden = true;

            return false;
        }

        return true;
    }

    // GUARDAR BÚSQUEDA

    function saveSearch() {

        localStorage.setItem(
            SEARCH_KEY,
            $("buscar-paciente").value
        );
    }

    function loadSearch() {

        $("buscar-paciente").value =
            localStorage.getItem(SEARCH_KEY) || "";
    }

    // OBTENER CITAS DEL DÍA

    function getTodayAppointments() {

        return B.getAppointments()
            .filter(c =>
                c.fecha === today &&
                normalizeStatus(c.estado) !== "cancelada"
            )
            .sort((a, b) =>
                String(a.hora).localeCompare(String(b.hora))
            );
    }

    // ACTUALIZAR CONTADORES

    function renderSummary() {

        const appointments = getTodayAppointments();

        const expected = appointments.filter(c =>
            normalizeStatus(c.estado) === "pendiente"
        ).length;

        const arrived = appointments.filter(c =>
            ["asistio", "atendida"].includes(
                normalizeStatus(c.estado)
            )
        ).length;

        const missed = appointments.filter(c =>
            normalizeStatus(c.estado) === "no-asistio"
        ).length;

        $("total-esperadas").textContent = expected;
        $("total-llegaron").textContent = arrived;
        $("total-faltaron").textContent = missed;
    }

    // DETERMINAR SI YA PASÓ LA HORA DE LA CITA

    function appointmentTimePassed(cita) {

        const appointmentDate = new Date(
            `${cita.fecha}T${cita.hora}:00`
        );

        return new Date() >= appointmentDate;
    }

    // MOSTRAR TABLA

    function renderTable() {

        const query = $("buscar-paciente")
            .value
            .trim()
            .toLowerCase();

        const appointments = getTodayAppointments()
            .filter(c =>
                patientName(c.pacienteId)
                    .toLowerCase()
                    .includes(query)
            );

        $("tabla-recepcion").innerHTML = appointments.map(c => {

            const status = normalizeStatus(c.estado);

            const arrived = [
                "asistio",
                "atendida"
            ].includes(status);

            const missed = status === "no-asistio";

            const canUpdate = B.can("citas.estado");

            const canMarkNoShow =
                canUpdate &&
                status === "pendiente" &&
                appointmentTimePassed(c);

            const canMarkArrived =
                canUpdate &&
                status === "pendiente";

            let actions = "—";

            if (canMarkArrived || canMarkNoShow) {

                actions = `
                    ${canMarkArrived ? `
                        <button
                            type="button"
                            class="btn verde"
                            data-arrived="${safe(c.id)}"
                        >
                            Llegó
                        </button>
                    ` : ""}

                    ${canMarkNoShow ? `
                        <button
                            type="button"
                            class="btn rojo"
                            data-missed="${safe(c.id)}"
                        >
                            No asistió
                        </button>
                    ` : ""}
                `;
            }

            return `
                <tr class="${
                    arrived
                        ? "fila-llego"
                        : missed
                            ? "fila-falto"
                            : ""
                }">

                    <td>${safe(c.hora)}</td>

                    <td>${safe(patientName(c.pacienteId))}</td>

                    <td>${safe(doctorName(c.doctorId))}</td>

                    <td>
                        <span class="estado ${safe(status)}">
                            ${safe(status)}
                        </span>
                    </td>

                    <td class="no-print">
                        <div class="acciones">
                            ${actions}
                        </div>
                    </td>

                </tr>
            `;

        }).join("");

        $("sin-resultados").hidden = appointments.length > 0;

        bindActions();
    }

    // REGISTRAR ACCIONES

    function bindActions() {

        // REGISTRAR LLEGADA

        $("tabla-recepcion")
            .querySelectorAll("[data-arrived]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    if (!B.can("citas.estado")) {

                        B.notify("No tienes permiso para cambiar el estado.");

                        return;
                    }

                    B.updateAppointment(
                        button.dataset.arrived,
                        { estado: "asistio" }
                    );

                    render();
                });

            });

        // REGISTRAR INASISTENCIA

        $("tabla-recepcion")
            .querySelectorAll("[data-missed]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    if (!B.can("citas.estado")) {

                        B.notify("No tienes permiso para cambiar el estado.");

                        return;
                    }

                    const cita = B.getAppointments().find(c =>
                        String(c.id) === String(button.dataset.missed)
                    );

                    if (!cita || !appointmentTimePassed(cita)) {

                        B.notify(
                            "Solo puedes marcar la inasistencia después de la hora de la cita."
                        );

                        return;
                    }

                    const confirmacion = confirm(
                        "¿Confirmas que el paciente no asistió?"
                    );

                    if (!confirmacion) return;

                    B.updateAppointment(
                        button.dataset.missed,
                        { estado: "no-asistio" }
                    );

                    render();
                });

            });
    }

    // ACTUALIZAR PANTALLA

    function render() {

        renderSummary();
        renderTable();
    }

    // INICIALIZACIÓN

    $("fecha-hoy").textContent =
        new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

    if (!checkAccess()) {
        return;
    }

    loadSearch();

    $("buscar-paciente").addEventListener("input", () => {

        saveSearch();
        renderTable();

    });

    render();

})();
