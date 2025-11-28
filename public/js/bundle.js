// public/js/bundle.js
// Self-contained IIFE bundle — exposes showToast and setLoading on window
(function () {
  // -------- utils (no exports) --------
  function showToast(message, isError) {
    isError = !!isError;
    var toast = document.getElementById("toast");
    if (!toast) return console.warn("toast element missing");
    var icon = toast.querySelector("#toast-icon");
    var toastMsg = document.getElementById("toast-message");
    if (!icon || !toastMsg) return console.warn("toast sub-elements missing");

    var container = toast.firstElementChild;
    if (container) {
      container.className =
        "px-6 py-3 rounded-lg shadow-md text-white font-medium flex items-center " +
        (isError ? "bg-red-500" : "bg-green-500");
    }

    icon.innerHTML = isError
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />';

    toastMsg.textContent = message || "";

    toast.classList.remove("hidden", "toast-exit");
    toast.classList.add("toast-enter");

    setTimeout(function () {
      toast.classList.remove("toast-enter");
      toast.classList.add("toast-exit");
      setTimeout(function () {
        toast.classList.add("hidden");
      }, 300);
    }, 3000);

    if (message && message.length > 30) {
      toastMsg.classList.add("whitespace-pre-line", "text-left");
    } else {
      toastMsg.classList.remove("whitespace-pre-line", "text-left");
    }
  }

  function setLoading(isLoading) {
    var spinner = document.getElementById("spinner");
    var text = document.getElementById("submit-text");
    if (!spinner || !text) return;
    if (isLoading) {
      spinner.classList.remove("hidden");
      text.textContent = "Processing...";
    } else {
      spinner.classList.add("hidden");
      text.textContent = "Add Exercise";
    }
  }

  // expose to global
  window.showToast = showToast;
  window.setLoading = setLoading;

  // -------- user form logic (uses window.showToast) --------
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector("form[action='/api/users']");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        (async function () {
          try {
            var username = e.target.username.value.trim();
            if (!username) throw new Error("Username is required");
            var response = await fetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: username }),
            });
            if (!response.ok) {
              var err = null;
              try {
                err = await response.json();
              } catch (e) {}
              throw new Error((err && err.error) || "User creation failed");
            }
            var data = await response.json();
            var _id = data._id || "";
            if (navigator.clipboard && _id) {
              try {
                await navigator.clipboard.writeText(_id);
              } catch (err) {
                console.warn("clipboard failed", err);
              }
            }
            window.showToast("User created! ID copied: " + _id);
            e.target.reset();
          } catch (error) {
            window.showToast(error.message || "Error", true);
          }
        })();
      });
    }
  });

  // -------- exercise form logic (uses window.showToast & window.setLoading) --------
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("exercise-form");
    function validateForm() {
      var userIdEl = document.getElementById("uid");
      var descEl = document.getElementById("desc");
      var durEl = document.getElementById("dur");
      var dateEl = document.getElementById("date");
      if (!userIdEl || !descEl || !durEl || !dateEl)
        return "Form elements missing";
      var userId = userIdEl.value.trim();
      var description = descEl.value.trim();
      var durationInput = durEl.value.trim();
      var date = dateEl.value.trim();
      if (!userId) return "User ID is required";
      if (!description || !durationInput)
        return "Description and duration are required";
      var duration = parseFloat(durationInput);
      if (Number.isNaN(duration)) return "Duration must be a number";
      if (duration <= 0) return "Duration must be positive";
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
        return "Date must be YYYY-MM-DD";
      return null;
    }

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        window.setLoading(true);
        (async function () {
          try {
            var errMsg = validateForm();
            if (errMsg) throw new Error(errMsg);
            var userId = document.getElementById("uid").value.trim();
            var payload = {
              description: document.getElementById("desc").value.trim(),
              duration: parseFloat(document.getElementById("dur").value.trim()),
              date: document.getElementById("date").value.trim() || undefined,
            };
            var response = await fetch(
              "/api/users/" + encodeURIComponent(userId) + "/exercises",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              }
            );
            if (!response.ok) {
              var err = null;
              try {
                err = await response.json();
              } catch (e) {}
              throw new Error((err && err.error) || "Submission failed");
            }
            window.showToast("Exercise logged successfully!");
            e.target.reset();
          } catch (error) {
            window.showToast(error.message || "Error", true);
          } finally {
            window.setLoading(false);
          }
        })();
      });
    }
  });
})();
