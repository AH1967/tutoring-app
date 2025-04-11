// User Authentication Handling
const userRole = localStorage.getItem("userRole");
const userName = localStorage.getItem("userName");

if (!userRole) {
    alert("Please log in first!");
    window.location.href = "auth.html";
} else {
    document.getElementById("username").textContent = userName;
    document.getElementById("user-role").textContent = userRole === "student" ? "Student" : "Tutor";

    // Show the correct menu options
    if (userRole === "student") {
        document.getElementById("student-menu").style.display = "block";
        document.getElementById("student-resources").style.display = "block";
        document.getElementById("menu-view-sessions").style.display = "block"; // Show View Sessions for students
        document.getElementById("view-sessions-section").style.display = "block";
        
    } else if (userRole === "tutor") {
        document.getElementById("tutor-profile-section").style.display = "block";
        document.getElementById("tutor-menu").style.display = "block";
        document.getElementById("tutor-materials").style.display = "block";
        document.getElementById("menu-view-sessions").style.display = "none"; // Hide View Sessions for tutors
        document.getElementById("view-sessions-section").style.display = "block";
    loadTutorSessions();
    }
}











let tutors = []; // Will be filled dynamically from the backend

async function displayTutors() {
    let tutorList = document.getElementById("tutor-list");
    tutorList.innerHTML = "";

    try {
        const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/tutors");
        const data = await response.json();
        tutors = data; // Save to global variable for filtering/sorting

        data.forEach(tutor => {
            let availabilityHTML = "";

            if (tutor.availability && Object.keys(tutor.availability).length > 0) {
                availabilityHTML = "<p><strong>📅 Available Slots:</strong></p><ul>";
                for (let day in tutor.availability) {
                    availabilityHTML += `<li><strong>${day}:</strong> ${tutor.availability[day].join(", ")}</li>`;
                }
                availabilityHTML += "</ul>";
            } else {
                availabilityHTML = "<p>📅 <em>No availability set</em></p>";
            }

            let tutorCard = `<div class='tutor-card'>
                <img src='${tutor.image}' class='tutor-image' alt='Tutor Image'>
                <h3>${tutor.name}</h3>
                <p>📚 Subject: ${tutor.subject || "N/A"}</p>
                <p>⭐ Rating: ${tutor.rating}</p>
                <p>💰 Price: $${tutor.price}/hour</p>
                ${availabilityHTML}
                <button onclick="bookSession('${tutor.name}')">📅 Book Session</button>
            </div>`;

            tutorList.innerHTML += tutorCard;
        });

    } catch (error) {
        console.error("❌ Failed to load tutors:", error);
        tutorList.innerHTML = "<p>Failed to load tutors. Please try again later.</p>";
    }
}


function filterTutors() {
    const query = document.getElementById("searchTutor").value.toLowerCase();
    const filteredTutors = tutors.filter(tutor =>
        tutor.subject && tutor.subject.toLowerCase().includes(query)
    );

    const tutorList = document.getElementById("tutor-list");
    tutorList.innerHTML = "";

    filteredTutors.forEach(tutor => {
        let availabilityHTML = "";

        if (tutor.availability && Object.keys(tutor.availability).length > 0) {
            availabilityHTML = "<p><strong>📅 Available Slots:</strong></p><ul>";
            for (let day in tutor.availability) {
                availabilityHTML += `<li><strong>${day}:</strong> ${tutor.availability[day].join(", ")}</li>`;
            }
            availabilityHTML += "</ul>";
        } else {
            availabilityHTML = "<p>📅 <em>No availability set</em></p>";
        }

        const tutorCard = `<div class='tutor-card'>
            <img src='${tutor.image}' class='tutor-image' alt='Tutor Image'>
            <h3>${tutor.name}</h3>
            <p>📚 Subject: ${tutor.subject}</p>
            <p>⭐ Rating: ${tutor.rating}</p>
            <p>💰 Price: $${tutor.price}/hour</p>
            ${availabilityHTML}
            <button onclick="bookSession('${tutor.name}')">📅 Book Session</button>
        </div>`;

        tutorList.innerHTML += tutorCard;
    });
}




// Function to sort tutors by rating or price
function sortTutors() {
    let sortBy = document.getElementById("sortTutors").value;
    let tutorList = document.getElementById("tutor-list");
    tutorList.innerHTML = ""; // Clear current list

    let sortedTutors = [...tutors];
    sortedTutors.sort((a, b) => {
        return sortBy === "rating" ? b.rating - a.rating : a.price - b.price;
    });

    sortedTutors.forEach(tutor => {
        let availabilityHTML = "";

        if (tutor.availability && Object.keys(tutor.availability).length > 0) {
            availabilityHTML = "<p><strong>📅 Available Slots:</strong></p><ul>";
            for (let day in tutor.availability) {
                availabilityHTML += `<li><strong>${day}:</strong> ${tutor.availability[day].join(", ")}</li>`;
            }
            availabilityHTML += "</ul>";
        } else {
            availabilityHTML = "<p>📅 <em>No availability set</em></p>";
        }

        let tutorCard = `<div class='tutor-card'>
                            <img src='${tutor.image}' class='tutor-image' alt='Tutor Image'>
                            <h3>${tutor.name}</h3>
                            <p>📚 Subject: ${tutor.subject || "N/A"}</p>
                            <p>⭐ Rating: ${tutor.rating}</p>
                            <p>💰 Price: $${tutor.price}/hour</p>
                            ${availabilityHTML}
                            <button onclick="bookSession('${tutor.name}')">📅 Book Session</button>
                         </div>`;
        tutorList.innerHTML += tutorCard;
    });
}


document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ DOM fully loaded");

    const saveBtn = document.getElementById("saveProfileBtn");
    if (!saveBtn) {
        console.error("❌ Save Profile button not found!");
        return;
    }

    console.log("✅ Save Profile button found");

    saveBtn.addEventListener("click", async function () {
        console.log("👆 Save button clicked");

        const subject = document.getElementById("tutor-subject").value.trim();
        const price = parseFloat(document.getElementById("tutor-price").value.trim());
        const imageInput = document.getElementById("tutor-image");

        if (!subject || isNaN(price) || imageInput.files.length === 0) {
            alert("❌ Please fill in all fields and select an image.");
            return;
        }

        const file = imageInput.files[0];
        const reader = new FileReader();

        reader.onloadend = async function () {
            console.log("📸 Image converted to Base64");

            const base64Image = reader.result;
            const token = localStorage.getItem("token");
            console.log("🔑 Token:", token);

            const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/tutors/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ subject, price, image: base64Image }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Profile saved successfully!");
            } else {
                console.error("❌ Server response error:", data);
                alert(data.message || "❌ Failed to save profile.");
            }
        };

        reader.readAsDataURL(file);
    });
});



// Function to book a tutor session
async function bookSession(tutorName) {
    const tutor = tutors.find(t => t.name === tutorName);
    const availableSlots = tutor.availability;

    if (Object.keys(availableSlots).length === 0) {
        alert("⚠️ No available time slots for this tutor.");
        return;
    }

    let selectedDay = prompt(`Booking with ${tutorName}\nEnter a day (e.g., Monday):`);
    if (!selectedDay || !availableSlots[selectedDay]) {
        alert("❌ Invalid day. Please enter a valid day from the list.");
        return;
    }

    let selectedTime = prompt(`Available times for ${selectedDay}: ${availableSlots[selectedDay].join(", ")}\nEnter a time slot (e.g., 9 AM):`);
    if (!selectedTime || !availableSlots[selectedDay].includes(selectedTime)) {
        alert("❌ Invalid time slot. Please enter a valid time.");
        return;
    }

    const token = localStorage.getItem("token");
    const studentName = localStorage.getItem("userName");

    try {
        const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/sessions/book", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                tutorName,
                tutorId: tutor._id,
                studentName,
                day: selectedDay,
                time: selectedTime,
                subject: tutor.subject
            })
        });

        const data = await response.json();

        if (response.ok) {
            const sessionId = data._id || data.sessionId; // Make sure your backend sends this
            localStorage.setItem("currentSessionId", sessionId); // ✅ Save it
            alert(`✅ Session booked with ${tutorName} on ${selectedDay} at ${selectedTime}!`);
        
        
        } else {
            alert("❌ Booking failed: " + data.message);
        }
    } catch (error) {
        console.error("❌ Error booking session:", error);
        alert("❌ Failed to book session.");
    }
}




// Function to show booked sessions with a cancel option
// Function to show booked sessions with day & time
async function viewBookedSessionsFromDB() {
    console.log("📢 viewBookedSessionsFromDB() called");

    hideAllSections();
    document.getElementById("view-sessions-section").style.display = "block";

    const sessionList = document.getElementById("booked-sessions-list");
    sessionList.innerHTML = "Loading...";

    try {
        const token = localStorage.getItem("token");
        console.log("🔐 Token from localStorage:", token);

        const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/sessions/my", {
            headers: { Authorization: "Bearer " + token }
        });

        console.log("📬 Fetch status:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Something went wrong");
        }

        const sessions = await response.json();
        console.log("📦 Sessions fetched:", sessions);

        sessionList.innerHTML = "";

        if (sessions.length === 0) {
            sessionList.innerHTML = "<p>No sessions booked yet.</p>";
            return;
        }

        sessions.forEach(session => {
            const li = document.createElement("li");
            li.innerHTML = `
    <div class="session-card" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        📚 <strong>${session.subject}</strong> with <strong>${session.tutorName}</strong> |
        📅 ${session.day}, ⏰ ${session.time}
        <button onclick="cancelSession('${session._id}')">❌ Cancel</button>
    </div>
`;

            sessionList.appendChild(li);
        });

    } catch (err) {
        console.error("❌ Error loading sessions:", err.message);
        sessionList.innerHTML = "<p>❌ Failed to load sessions.</p>";
    }
}



async function loadTutorSessions() {
    const token = localStorage.getItem("token");
    const list = document.getElementById("booked-sessions-list");
    list.innerHTML = "";

    const res = await fetch("https://tutoring-app-v9e9.onrender.com/api/sessions/tutor", {
        headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();

    if (data.length === 0) {
        list.innerHTML = "<li>No sessions booked yet.</li>";
        return;
    }

    data.forEach(session => {
        list.innerHTML += `
            <li>
                <strong>👤 Student:</strong> ${session.studentName} |
                <strong>📚 Subject:</strong> ${session.subject} |
                <strong>📅 ${session.day}</strong>, ⏰ ${session.time}
            </li>
        `;
    });
}



function viewSessions() {
    hideAllSections();
    document.getElementById("view-sessions-section").style.display = "block";
  
    const list = document.getElementById("booked-sessions-list");
    list.innerHTML = "";
  
    fetch("https://tutoring-app-v9e9.onrender.com/api/sessions/student", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    })
    .then(res => res.json())
    .then(data => {
      data.forEach((session, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
          <div class="session-card">
            <p><strong>👤 Student:</strong> ${session.studentName} |
               <strong>📚 Subject:</strong> ${session.subject} |
               <strong>📅 ${session.day}</strong>, <span>⏰ ${session.time}</span>
            </p>
            <button onclick="cancelSession('${session._id}')">❌ Cancel</button>
          </div>
        `;
        list.appendChild(li);
      });
    });
  }

  async function cancelSession(sessionId) {
    const confirmCancel = confirm("Are you sure you want to cancel this session?");
    if (!confirmCancel) return;
  
    try {
      const response = await fetch(`https://tutoring-app-v9e9.onrender.com/api/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message);
        viewSessions(); // refresh the list
      } else {
        alert("❌ Failed to cancel session: " + data.message);
      }
    } catch (error) {
      alert("❌ Server error");
      console.error(error);
    }
  }
  










// Function to show the Find Tutors section
function viewTutors() {
    hideAllSections(); // Hide other sections
    document.getElementById("find-tutors-section").style.display = "block"; // Show Find Tutors

    fetch("https://tutoring-app-v9e9.onrender.com/api/tutors")
        .then(res => res.json())
        .then(data => {
            tutors = data; // Store the tutors globally
            displayTutors(); // Now call this to render tutor cards
        })
        .catch(error => {
            console.error("❌ Failed to fetch tutors:", error);
            alert("Failed to load tutors. Please try again later.");
        });
}


// Function to hide all sections before switching
function hideAllSections() {
    document.querySelectorAll("section").forEach(section => {
        section.style.display = "none";
    });
}




// Function to show the Home section
function viewDashboard() {
    hideAllSections(); // Hide all sections
    document.getElementById("dashboard-section").style.display = "block"; // Show Home
}
















// Function to display study resources
async function viewResources() {
    hideAllSections();
    document.getElementById("study-resources-section").style.display = "block";

    const resourceList = document.getElementById("resources-list");
    resourceList.innerHTML = "Loading...";

    try {
        const token = localStorage.getItem("token");

        const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/materials", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const materials = await response.json();

        if (!response.ok) {
            throw new Error(materials.message || "Unauthorized");
        }

        if (materials.length === 0) {
            resourceList.innerHTML = "<p>No study resources found.</p>";
            return;
        }

        resourceList.innerHTML = "";
        materials.forEach(material => {
            const item = document.createElement("div");
            item.classList.add("resource-card");

            item.innerHTML = `
                <h3>${material.title}</h3>
                <p>📚 Subject: ${material.subject}</p>
                <a href="${material.fileData}" download="${material.fileName}" class="download-btn">⬇️ Download</a>
            `;

            resourceList.appendChild(item);
        });
    } catch (error) {
        console.error("❌ Failed to load study resources:", error);
        resourceList.innerHTML = "<p>❌ Error loading study materials.</p>";
    }
}








// Function to show Manage Schedule section
function setAvailability() {
    hideAllSections(); // Hide all other sections
    document.getElementById("manage-schedule-section").style.display = "block"; // Show Manage Schedule

    generateSchedule(); // Create the schedule grid

    // Ensure only one event listener is assigned
    document.getElementById("save-schedule").onclick = saveSchedule;
    document.getElementById("reset-schedule").onclick = resetSchedule;

}



// Function to generate the 6-day schedule dynamically
function generateSchedule() {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const times = ["9 AM", "11 AM", "2 PM", "4 PM", "6 PM"];

    let scheduleGrid = document.getElementById("schedule-grid");
    scheduleGrid.innerHTML = ""; // Clear previous content

    days.forEach(day => {
        let dayColumn = document.createElement("div");
        dayColumn.classList.add("day-column");

        let dayTitle = document.createElement("h3");
        dayTitle.textContent = day;
        dayColumn.appendChild(dayTitle);

        let timeSlotContainer = document.createElement("div");
        timeSlotContainer.classList.add("time-slots");

        times.forEach(time => {
            let slotButton = document.createElement("button");
            slotButton.textContent = time;
            slotButton.setAttribute("data-day", day);
            slotButton.setAttribute("data-time", time);
            slotButton.classList.add("slot");

            // Restore previously selected slots from localStorage
            let savedSlots = JSON.parse(localStorage.getItem("savedSchedule")) || [];
            if (savedSlots.some(slot => slot.day === day && slot.time === time)) {
                slotButton.classList.add("selected");
            }

            slotButton.addEventListener("click", function () {
                this.classList.toggle("selected");
            });

            timeSlotContainer.appendChild(slotButton);
        });

        dayColumn.appendChild(timeSlotContainer);
        scheduleGrid.appendChild(dayColumn);
    });
}

// Function to save selected schedule slots
async function saveSchedule() {
    let selectedSlots = [];
    document.querySelectorAll(".slot.selected").forEach(slot => {
        selectedSlots.push({
            day: slot.getAttribute("data-day"),
            time: slot.getAttribute("data-time")
        });
    });

    if (selectedSlots.length === 0) {
        alert("⛔ No time slots selected!");
        return;
    }

    const availability = {};

    selectedSlots.forEach(slot => {
        if (!availability[slot.day]) {
            availability[slot.day] = [];
        }
        availability[slot.day].push(slot.time);
    });

    const token = localStorage.getItem("token");

    const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/tutors/availability", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ availability }),
    });

    const data = await response.json();

    if (response.ok) {
        alert("✅ Schedule saved to backend!");
    } else {
        alert("❌ Failed to save schedule: " + data.message);
    }
}

// Function to reset schedule
function resetSchedule() {
    document.querySelectorAll(".slot.selected").forEach(slot => slot.classList.remove("selected"));
    localStorage.removeItem("savedSchedule");
    alert("🔄 Schedule has been reset!");
}




// Function to show Upload Materials section
function uploadMaterials() {
    hideAllSections();
    document.getElementById("upload-materials-section").style.display = "block";
    displayMaterials(); 
 // Show existing materials
}

// Function to upload study material
async function uploadMaterial() {
    let title = document.getElementById("materialTitle").value.trim();
    let subject = document.getElementById("materialSubject").value.trim();
    let fileInput = document.getElementById("materialFile");

    if (title === "" || subject === "" || fileInput.files.length === 0) {
        alert("❌ Please fill in all fields and select a file.");
        return;
    }

    let file = fileInput.files[0];
    let reader = new FileReader();

    reader.onload = async function (event) {
        let fileData = event.target.result; // Base64 string

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("https://tutoring-app-v9e9.onrender.com/api/materials/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    title,
                    subject,
                    fileName: file.name,
                    fileData
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("✅ Material uploaded!");
                displayMaterials(); // Refresh
                document.getElementById("materialTitle").value = "";
                document.getElementById("materialSubject").value = "";
                fileInput.value = "";
            } else {
                alert("❌ Upload failed: " + data.message);
            }
        } catch (err) {
            console.error("❌ Upload error:", err);
            alert("❌ Error uploading material.");
        }
    };

    reader.readAsDataURL(file);
}


// Function to display uploaded materials
async function displayMaterials() {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const materialsList = document.getElementById("materials-list");
    materialsList.innerHTML = "Loading...";

    try {
        const res = await fetch("https://tutoring-app-v9e9.onrender.com/api/materials", {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        const materials = await res.json();
        materialsList.innerHTML = "";

        if (materials.length === 0) {
            materialsList.innerHTML = "<li>No materials available</li>";
            return;
        }

        materials.forEach(material => {
            const li = document.createElement("li");

            li.innerHTML = `
                📖 <strong>${material.title}</strong> |
                📚 ${material.subject}
                <a href="${material.fileData}" download="${material.fileName}" class="download-btn">⬇️ Download</a>
                ${
                    material.uploadedBy === userId
                        ? `<button onclick="deleteMaterial('${material._id}')" class="delete-btn">❌ Remove</button>`
                        : ""
                }
            `;

            materialsList.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Failed to load materials:", error);
        materialsList.innerHTML = "<li>❌ Error fetching materials</li>";
    }
}


// Function to delete a material
async function deleteMaterial(id) {
    const confirmDelete = confirm("Are you sure you want to delete this material?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`https://tutoring-app-v9e9.onrender.com/api/materials/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ Material deleted.");
            displayMaterials(); // Refresh the list
        } else {
            alert("❌ Delete failed: " + data.message);
        }
    } catch (err) {
        console.error("❌ Error deleting material:", err);
    }
}


// Load materials when page opens
window.onload = displayMaterials;


















// Function to hide all sections before switching
function hideAllSections() {
    document.querySelectorAll("section").forEach(section => {
        section.style.display = "none";
    });
}



// Function to show the Ask a Question section
function askQuickQuestion() {
    hideAllSections(); // Hide all sections
    document.getElementById("ask-question-section").style.display = "block"; // Show Ask a Question section
}



// Global WebSocket variable to ensure only one connection is used
let socket;

document.addEventListener("DOMContentLoaded", function () {
    if (!socket) {
        initializeChat();
    }
});

function initializeChat() {
    socket = new WebSocket("wss://tutoring-app-v9e9.onrender.com");


    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    if (!chatBox || !messageInput || !sendButton) {
        console.error("❌ Chat elements not found!");
        return;
    }

    socket.onopen = function () {
        console.log("✅ Connected to WebSocket Server");
    };

    socket.onmessage = function (event) {
        const messageData = JSON.parse(event.data);
    
        if (!document.querySelector(`[data-message-id="${messageData.id}"]`)) {
            const newMessage = document.createElement("div");
            newMessage.setAttribute("data-message-id", messageData.id);
    
            const roleText = messageData.role === "tutor" ? "(Tutor)" : "(Student)";
            const color = messageData.role === "tutor" ? "green" : "blue";
    
            newMessage.classList.add(messageData.role === "tutor" ? "tutor-message" : "student-message");
            newMessage.innerHTML = `
            <strong style="color: ${color};">${messageData.senderName} ${roleText}:</strong>
             ${messageData.text}
            <span style="font-size: 12px; color: gray; margin-left: 10px;">🕓 ${messageData.time || ""}</span>
            `;

            chatBox.appendChild(newMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };
    

    function sendMessage() {
        const messageText = messageInput.value.trim();
    
        if (messageText !== "") {
            const messageObject = {
                id: Date.now(),
                sender: userRole, // "student" or "tutor"
                senderName: localStorage.getItem("userName"),
                role: userRole,
                text: messageText
            };
    
            socket.send(JSON.stringify(messageObject));
            messageInput.value = ""; // Just clear input
        }
    }
    

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
}


// ✅ Call initializeChat() only once
initializeChat();


document.addEventListener("DOMContentLoaded", function () {
    const logoutBtn = document.getElementById("logout-btn");
    console.log("Logout button ready:", logoutBtn);

  
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault(); // Prevent the link from jumping
        localStorage.clear(); // Clear session
        alert("Logging out...");
        window.location.href = "auth.html"; // Redirect
      });
    }
  });
  