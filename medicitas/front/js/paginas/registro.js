const registerForm = document.getElementById("register-form");
const birthDate = document.getElementById("birth-date");
const password = document.getElementById("password");
const passwordConfirmation = document.getElementById("password-confirmation");
const registerMessage = document.getElementById("register-message");

function validateBirthDate() {
  const selectedDate = new Date(`${birthDate.value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (birthDate.value && selectedDate > today) {
    birthDate.setCustomValidity("La fecha de nacimiento no puede ser futura.");
    return false;
  }

  birthDate.setCustomValidity("");
  return true;
}

function validatePasswordConfirmation() {
  const passwordsMatch = password.value === passwordConfirmation.value;

  passwordConfirmation.setCustomValidity(
    passwordsMatch ? "" : "Las contraseñas deben coincidir."
  );

  return passwordsMatch;
}

birthDate.addEventListener("change", validateBirthDate);
password.addEventListener("input", validatePasswordConfirmation);
passwordConfirmation.addEventListener("input", validatePasswordConfirmation);

registerForm.addEventListener("submit", (event) => {
  const validBirthDate = validateBirthDate();
  const validPassword = validatePasswordConfirmation();

  if (!validBirthDate || !validPassword || !registerForm.checkValidity()) {
    event.preventDefault();
    registerForm.reportValidity();
    registerMessage.hidden = false;
    registerMessage.textContent = "Revisa los datos ingresados.";
  }
});
