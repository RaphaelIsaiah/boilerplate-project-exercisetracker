// public/js/utils.js
export function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return console.warn("toast element missing");

  const icon = toast.querySelector("#toast-icon");
  const toastMsg = document.getElementById("toast-message");

  // Defensive check in case structure differs
  if (!icon || !toastMsg) return console.warn("toast sub-elements missing");

  // Set styles
  const container = toast.firstElementChild;
  if (container) {
    container.className = `px-6 py-3 rounded-lg shadow-md text-white font-medium flex items-center ${
      isError ? "bg-red-500" : "bg-green-500"
    }`;
  }

  // Set icon
  icon.innerHTML = isError
    ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`
    : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`;

  toastMsg.textContent = message;

  // Show toast
  toast.classList.remove("hidden", "toast-exit");
  toast.classList.add("toast-enter");

  // Auto-hide
  setTimeout(() => {
    toast.classList.remove("toast-enter");
    toast.classList.add("toast-exit");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 3000);

  // Add line break if message is long
  if (message && message.length > 30) {
    toastMsg.classList.add("whitespace-pre-line", "text-left");
  } else {
    toastMsg.classList.remove("whitespace-pre-line", "text-left");
  }
}

export function setLoading(isLoading) {
  const spinner = document.getElementById("spinner");
  const text = document.getElementById("submit-text");

  // Defensive checks
  if (!spinner || !text) return;

  if (isLoading) {
    spinner.classList.remove("hidden");
    text.textContent = "Processing...";
  } else {
    spinner.classList.add("hidden");
    text.textContent = "Add Exercise";
  }
}
