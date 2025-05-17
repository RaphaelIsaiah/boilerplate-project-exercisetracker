// Get the form element and add submit event listener
document
  .getElementById("exercise-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector("[type='submit']");

    // Show loading state for visual feedback
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    try {
      // Prepare form data
      const userId = document.getElementById("uid").value;
      e.target.action = `/api/users/${userId}/exercises`;

      // Submit form using modern Fetch API submission
      const response = await fetch(e.target.action, {
        method: "POST",
        body: new FormData(e.target), // Automatically captures all the form fields
      });

      // Handle non-OK responses (HTTP errors)
      if (!response.ok) throw new Error("Submission failed");

      // Success feedback (optional)
      alert("Exercise added successfully!");
      e.target.reset(); // Clear form
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + error.message);
    } finally {
      // Reset button (runs on success and failure)
      submitBtn.disabled = false;
      submitBtn.textContent = "Add Exercise";
    }
  });
