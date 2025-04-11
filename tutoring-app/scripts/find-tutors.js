let tutors = [];

window.onload = loadTutors;

async function loadTutors() {
    const tutorList = document.getElementById("tutor-list");
    tutorList.innerHTML = "Loading...";

    try {
        const res = await fetch("http://localhost:5000/api/tutors");
        tutors = await res.json();

        displayTutors(tutors);

       
        const params = new URLSearchParams(window.location.search);
        const subjectQuery = params.get("subject");
        if (subjectQuery) {
            document.getElementById("searchTutor").value = subjectQuery;
            filterTutors(); // Filter automatically based on query
        }

    } catch (error) {
        console.error("❌ Error fetching tutors:", error);
        tutorList.innerHTML = "<p>❌ Failed to load tutors.</p>";
    }
}


function displayTutors(data) {
    const tutorList = document.getElementById("tutor-list");
    tutorList.innerHTML = "";

    data.forEach(tutor => {
        const card = document.createElement("div");
        card.classList.add("tutor-card");
        card.setAttribute("data-subject", tutor.subject?.toLowerCase());
        card.setAttribute("data-rating", tutor.rating);
        card.setAttribute("data-price", tutor.price);

        card.innerHTML = `
            <img src="${tutor.image}" class="tutor-image" alt="Tutor Image">
            <h3>${tutor.name}</h3>
            <p><strong>📚 Subject:</strong> ${tutor.subject || "N/A"}</p>
            <p><strong>⭐ Rating:</strong> ${tutor.rating}</p>
            <p><strong>💰 Rate:</strong> $${tutor.price}/hour</p>
            <button onclick="redirectToSignup()">📅 Book Session</button>
        `;

        tutorList.appendChild(card);
    });
}


function filterTutors() {
    const query = document.getElementById("searchTutor").value.toLowerCase();
    const filtered = tutors.filter(t =>
        t.subject && t.subject.toLowerCase().includes(query)
    );
    displayTutors(filtered);
}

function sortTutors() {
    const sortBy = document.getElementById("sortTutors").value;
    const sorted = [...tutors].sort((a, b) => {
        return sortBy === "rating" ? b.rating - a.rating : a.price - b.price;
    });
    displayTutors(sorted);
}

function redirectToSignup() {
    alert("Please sign up first to book a tutor.");
    window.location.href = "auth.html";
}
