// public/js/user-form.js
import { showToast } from "/js/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form[action='/api/users']");
  if (!form) return console.warn("user form not found");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const username = e.target.username.value.trim();
      if (!username) throw new Error("Username is required");

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error((err && err.error) || "User creation failed");
      }

      const data = await response.json();
      const _id = data._id || "";

      // Copy User ID to clipboard (defensive)
      if (navigator.clipboard && _id) {
        try {
          await navigator.clipboard.writeText(_id);
        } catch (err) {
          console.warn("clipboard write failed", err);
        }
      }

      // Show success toast
      showToast(`User created! ID copied: ${_id}`);

      // Clear form
      e.target.reset();
    } catch (error) {
      showToast(error.message || "Error", true);
    }
  });
});
