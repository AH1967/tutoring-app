// Example: Real-time search filter for tutors
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.querySelector('.search-bar input');
    const tutorCards = document.querySelectorAll('.tutor-profiles .card');
  
    searchInput.addEventListener('input', function () {
      const searchTerm = searchInput.value.toLowerCase();
      tutorCards.forEach(card => {
        const tutorName = card.querySelector('.card-title').textContent.toLowerCase();
        if (tutorName.includes(searchTerm)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });