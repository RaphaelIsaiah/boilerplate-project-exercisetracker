document.getElementById("exercise-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const userId = document.getElementById("uid").value;
  const form = e.target;
  form.action = `/api/users/${userId}/exercises`;

  // Submit programmatically
  form.submit();
});
