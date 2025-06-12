import { showToast } from "./utils.js";

document
  .querySelector("form[action='/api/users']")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const username = e.target.username.value.trim();
      if (!username) throw new Error("Username is required");

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) throw new Error("User creation failed");

      const { _id } = await response.json();

      // Copy User ID to clipboard
      await navigator.clipboard.writeText(_id);

      // Show success toast
      showToast(`User created! ID copied: ${_id}`);

      // Clear form
      e.target.reset();
    } catch (error) {
      showToast(error.message, true);
    }
  });
