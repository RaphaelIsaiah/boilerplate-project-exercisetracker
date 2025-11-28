// public/js/exercise-form.js
import { showToast, setLoading } from "/js/utils.js";

function validateForm() {
  const userIdEl = document.getElementById("uid");
  const descEl = document.getElementById("desc");
  const durEl = document.getElementById("dur");
  const dateEl = document.getElementById("date");

  if (!userIdEl || !descEl || !durEl || !dateEl) return "Form elements missing";

  const userId = userIdEl.value.trim();
  const description = descEl.value.trim();
  const durationInput = durEl.value.trim();
  const date = dateEl.value.trim();

  if (!userId) return "User ID is required";
  if (!description || !durationInput)
    return "Description and duration are required";

  const duration = parseFloat(durationInput);
  if (Number.isNaN(duration)) return "Duration must be a number";
  if (duration <= 0) return "Duration must be positive";

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "Date must be YYYY-MM-DD";
  }

  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("exercise-form");
  if (!form) return console.warn("exercise-form not found");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const error = validateForm();
      if (error) throw new Error(error);

      const userId = document.getElementById("uid").value.trim();
      const formData = {
        description: document.getElementById("desc").value.trim(),
        duration: parseFloat(document.getElementById("dur").value.trim()),
        date: document.getElementById("date").value.trim() || undefined,
      };

      const response = await fetch(`/api/users/${userId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error((err && err.error) || "Submission failed");
      }

      showToast("Exercise logged successfully!");
      e.target.reset();
    } catch (error) {
      showToast(error.message || "Error", true);
    } finally {
      setLoading(false);
    }
  });
});
