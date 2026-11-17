// Poster preview popup + filter behaviour for the admin poster dashboard
(function () {
  const modal = document.getElementById("poster-modal");
  const frame = document.getElementById("poster-modal-frame");
  const externalLink = document.getElementById("poster-modal-external");
  const titleElement = document.getElementById("poster-modal-title");
  const postersBase = String(window.POSTERS_BASE || "").replace(/\/+$/, "");

  function posterUrl(posterId) {
    // from_admin=true tells the poster app not to count this as a real view
    return `${postersBase}/event/poster/${encodeURIComponent(posterId)}?from_admin=true`;
  }

  function openPoster(posterId, posterTitle) {
    if (!modal || !frame || !posterId) return;

    const url = posterUrl(posterId);
    titleElement.textContent = posterTitle || "Poster preview";
    frame.src = url;
    externalLink.href = url;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("poster-modal-open");
  }

  function closePoster() {
    if (!modal || !frame) return;

    frame.src = "about:blank";
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("poster-modal-open");
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-view-poster]");

    if (trigger) {
      event.preventDefault();
      openPoster(trigger.getAttribute("data-poster-id"), trigger.getAttribute("data-poster-title"));
      return;
    }

    if (event.target.closest("[data-close-modal]")) {
      closePoster();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && modal && modal.classList.contains("is-open")) {
      closePoster();
    }
  });

  // Changing a filter reloads page 1 with the new filter applied
  const filterForm = document.getElementById("poster-filters");

  if (filterForm) {
    filterForm.querySelectorAll("select").forEach(function (select) {
      select.addEventListener("change", function () {
        filterForm.submit();
      });
    });
  }

  window.openPosterPreview = openPoster;
  window.closePosterPreview = closePoster;
})();
