const form = document.querySelector(".login_form");
const email = document.getElementById("email");
const password = document.getElementById("password");

form.getElementById("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    console.log("correo:", email.value);
    console.log("Contraseña:", password.value);
})