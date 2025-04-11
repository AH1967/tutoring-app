// Get buttons for switching between Sign Up & Login
const signupBtn = document.getElementById("show-signup");
const loginBtn = document.getElementById("show-login");

// Get form elements
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");

// Toggle between Sign Up & Login forms
signupBtn.addEventListener("click", function () {
    signupForm.style.display = "block";
    loginForm.style.display = "none";
    signupBtn.classList.add("active");
    loginBtn.classList.remove("active");
});

loginBtn.addEventListener("click", function () {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
    loginBtn.classList.add("active");
    signupBtn.classList.remove("active");
});

// Handle Login Submission (Connect to Backend)
document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form refresh

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);
        localStorage.setItem("userId", data.user.id); 
        window.location.href = "dashboard.html";
    } else {
        alert(data.message);
    }
});

// Handle Sign-Up Submission (Connect to Backend)
document.getElementById("signupForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form refresh

    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const role = document.getElementById("signup-role").value;

    const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
        alert("Sign-up successful! You can now log in.");
        loginBtn.click(); // Switch to login form
    } else {
        alert(data.message);
    }
});
