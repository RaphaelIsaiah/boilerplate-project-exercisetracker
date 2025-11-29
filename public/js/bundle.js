// Self-contained IIFE bundle — exposes showToast and setLoading on window
(function () {
  // -------- utility: small inline spinner SVG --------
  function spinnerSVG(size) {
    size = size || 16;
    return (
      '<svg aria-hidden="true" focusable="false" width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" style="vertical-align:middle; margin-right:8px; display:inline-block;">' +
      '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" opacity="0.25"></circle>' +
      '<path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" style="transform-origin:12px 12px; animation:spin 1s linear infinite;"></path>' +
      "<style>@keyframes spin{100%{transform:rotate(360deg)}}</style>" +
      "</svg>"
    );
  }

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

  // Generic: toggle loading state on a form's submit button
  function setFormLoading(form, isLoading, loadingText) {
    if (!form) return;
    var btn = form.querySelector("button[type='submit'], input[type='submit']");
    if (!btn) return;
    // store original HTML if not stored
    if (isLoading) {
      if (btn.dataset._origHtml === undefined) {
        btn.dataset._origHtml = btn.innerHTML;
      }
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      btn.setAttribute("aria-disabled", "true");
      var text = loadingText || "Processing...";
      btn.innerHTML =
        spinnerSVG(16) +
        '<span style="vertical-align:middle;">' +
        text +
        "</span>";
    } else {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.removeAttribute("aria-disabled");
      if (btn.dataset._origHtml !== undefined) {
        btn.innerHTML = btn.dataset._origHtml;
        delete btn.dataset._origHtml;
      }
    }
  }

  // Backwards-compatible setLoading (keeps a function similar to the previous API)
  // If passed a form element, it delegates to setFormLoading; otherwise does nothing.
  function setLoading(arg) {
    // call signature: setLoading(isLoading) was in original code, but we now use setFormLoading(form, isLoading, text)
    // Keep this for compatibility in case other code uses window.setLoading(boolean)
    // We'll do nothing here to avoid ambiguity; prefer setFormLoading usage below.
    console.warn(
      "setLoading used without form context — use setFormLoading(form, isLoading, loadingText) instead."
    );
  }

  // expose to global
  window.showToast = showToast;
  window.setFormLoading = setFormLoading;
  window.setLoading = setLoading; // legacy stub to avoid breaking code

  // -------- user form logic (uses window.showToast and setFormLoading) --------
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector("form[action='/api/users']");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        (async function () {
          // locate submit button and set loading state
          try {
            setFormLoading(form, true, "Creating...");
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
              } catch (errParsing) {
                // ignore parsing error
              }
              throw new Error((err && err.error) || "User creation failed");
            }

            var data = await response.json();
            var _id = data._id || "";

            if (navigator.clipboard && _id) {
              try {
                await navigator.clipboard.writeText(_id);
              } catch (errClipboard) {
                // do not crash — clipboard optional
                console.warn("clipboard write failed", errClipboard);
              }
            }

            window.showToast("User created! ID copied: " + _id);
            e.target.reset();
          } catch (error) {
            window.showToast(error.message || "Error", true);
          } finally {
            setFormLoading(form, false);
          }
        })();
      });
    }
  });

  // -------- exercise form logic (uses window.showToast & setFormLoading) --------
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("exercise-form");

    function validateFormInner() {
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
        // Use our form-based loading UI
        setFormLoading(form, true, "Processing...");
        (async function () {
          try {
            var errMsg = validateFormInner();
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
              } catch (errParsing) {
                // ignore parsing error
              }
              throw new Error((err && err.error) || "Submission failed");
            }

            window.showToast("Exercise logged successfully!");
            e.target.reset();
          } catch (error) {
            window.showToast(error.message || "Error", true);
          } finally {
            setFormLoading(form, false);
          }
        })();
      });
    }
  });
})();
