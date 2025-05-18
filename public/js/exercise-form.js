// Toast helper function
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  const toastContent = toast.querySelector("div");

  // Set styles based on error/success
  toastContent.className = `px-t py-3 rounde-lg shadow-mdd text-white font-medium ${
    isError ? "bg-red-500" : "bg-green-500"
  }`;
  toastContent.textContent = message;

  // Show animation
  toast.classList.remove("hidden", "toast-animate-out");
  toast.classList.add("toast-animate-in");

  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("toast-animate-in");
    toast.classList.add("toast-animate-out");
    setTimeout(() => toast.classList.add("hidden"), 3000);
  }, 3000);
}

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
      showToast("Exercise added successfully!");
      e.target.reset(); // Clear form
    } catch (error) {
      console.error("Error:", error);
      showToast("Error: " + error.message);
    } finally {
      // Reset button (runs on success and failure)
      submitBtn.disabled = false;
      submitBtn.textContent = "Add Exercise";
    }
  });
