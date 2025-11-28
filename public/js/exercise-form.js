import { showToast, setLoading } from "/js/utils.js";

// ======================
// Form Validation
// ======================

function validateForm() {
  const userId = document.getElementById("uid").value.trim();
  const description = document.getElementById("desc").value.trim();
  const durationInput = document.getElementById("dur").value.trim();
  const date = document.getElementById("date").value.trim();

  // 1. Basic presence checks
  if (!userId) return "User ID is required";
  if (!description || !durationInput)
    return "Description and duration are required";

  // 2. Convert duration to number
  const duration = parseFloat(durationInput);
  if (isNaN(duration)) return "Duration must be a number";
  if (duration <= 0) return "Duration must be positive";

  // 3. Date format check
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Date must be YYYY-MM-DD";
  }

  return null;
}

// ======================
// Main Form Handler
// ======================

document
  .getElementById("exercise-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      const error = validateForm();
      if (error) throw new Error(error);

      // Prepare data with proper types
      const userId = document.getElementById("uid").value.trim();
      const formData = {
        description: document.getElementById("desc").value.trim(),
        duration: parseFloat(document.getElementById("dur").value.trim()),
        date: document.getElementById("date").value.trim() || undefined,
      };

      // Submit to API
      const response = await fetch(`/api/users/${userId}/exercises`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Submission failed");
      }

      // Success
      showToast("Exercise logged successfully!");
      e.target.reset();
    } catch (error) {
      showToast(error.message, true);
    } finally {
      setLoading(false);
    }
  });
