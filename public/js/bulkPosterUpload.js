// Bulk poster upload page: previews the title and presenter email parsed from
// each file name before the batch is submitted. Files picked or dropped again
// are added to the list instead of replacing it, and any title/email the file
// name cannot carry can be typed in, removed, or cleared as a whole. The
// server repeats this parsing and is the source of truth.
(function () {
  var form = document.getElementById("bulk-upload-form");
  var input = document.getElementById("posters");
  var dropzone = document.getElementById("dropzone");
  var selection = document.getElementById("selection");
  var rows = document.getElementById("selection-rows");
  var submitButton = document.getElementById("upload-btn");
  var clearButton = document.getElementById("clear-all-btn");
  var overridesInput = document.getElementById("overrides");
  var note = document.getElementById("upload-note");

  if (!form || !input) return;

  var limits = window.BULK_POSTER_LIMITS || { maxFiles: 10, maxFileMb: 20 };
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // { file, parsed: { title, email, error }, manual: { title, email } }
  var items = [];
  var views = []; // parallel to items: { row, titleCell, emailCell, statusCell }
  var listWarning = "";
  var syncProblemMessage = "This browser could not update the file selection, so the upload could send files that are no longer on the list. " +
    "Reload the page and upload these files in one go.";

  // Extract whatever the file name holds; whether that is usable is decided in
  // effective(), so a bad email still leaves the parsed title on screen.
  function parseName(fileName) {
    var name = String(fileName || "");

    if (!/\.pdf$/i.test(name)) {
      return { title: "", email: "", error: "Not a PDF file" };
    }

    var base = name.replace(/\.pdf$/i, "");
    var separator = base.lastIndexOf("_");

    if (separator <= 0) {
      return { title: "", email: "", error: "Missing \"title_email@example.com\" format" };
    }

    return {
      title: base.slice(0, separator).replace(/_/g, " ").trim(),
      email: base.slice(separator + 1).trim().toLowerCase()
    };
  }

  // What the row will actually upload: the typed value wins, then the file name
  function effective(item) {
    var title = String(item.manual.title || "").trim() || String(item.parsed.title || "").trim();
    var email = String(item.manual.email || "").trim().toLowerCase() || String(item.parsed.email || "").trim().toLowerCase();
    var tooBig = item.file.size > limits.maxFileMb * 1024 * 1024;
    var error = null;

    if (!/\.pdf$/i.test(item.file.name)) {
      error = "Not a PDF file";
    } else if (tooBig) {
      error = "Larger than " + limits.maxFileMb + " MB";
    } else if (item.parsed.error && !title && !email) {
      error = item.parsed.error;
    } else if (!title) {
      error = "Title is missing";
    } else if (!emailPattern.test(email)) {
      error = "Email is missing or invalid";
    } else if (title.length > 255) {
      error = "Title is longer than 255 characters";
    }

    return { title: title, email: email, error: error };
  }

  function sameFile(a, b) {
    return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
  }

  // Keep the file input in step with the list so the form posts exactly these
  // files. Returns false when that is impossible, because the input would then
  // still hold files the list no longer shows.
  function syncInput() {
    try {
      var transfer = new DataTransfer();
      items.forEach(function (item) {
        transfer.items.add(item.file);
      });
      input.files = transfer.files;
    } catch (error) {
      return false;
    }

    // Some browsers accept the assignment but keep the old selection
    var files = input.files || [];
    if (files.length !== items.length) return false;

    return items.every(function (item, index) {
      return sameFile(files[index], item.file);
    });
  }

  function startEditing(item, field, cell) {
    var current = item.manual[field] || effective(item)[field] || "";
    var committed = false;

    cell.innerHTML = "";

    var editor = document.createElement("input");
    editor.type = "text";
    editor.className = "inline-input";
    editor.value = current;
    editor.placeholder = field === "email" ? "presenter@email.com" : "Poster title";

    function commit(save) {
      if (committed) return;
      committed = true;

      if (save) {
        var value = editor.value.trim();
        item.manual[field] = field === "email" ? value.toLowerCase() : value;
      }

      refreshItem(item);
      updateSummary();
    }

    editor.addEventListener("blur", function () {
      commit(true);
    });
    editor.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        commit(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        commit(false);
      }
    });

    cell.appendChild(editor);
    editor.focus();
    editor.select();
  }

  function fillEditable(cell, item, field, placeholder) {
    cell.className = field === "email" ? "email" : "title";
    cell.innerHTML = "";

    var value = effective(item)[field];
    var button = document.createElement("button");
    button.type = "button";
    button.className = "edit-field" + (value ? "" : " is-empty");
    button.textContent = value || placeholder;
    button.title = "Click to " + (value ? "change" : "add") + " the " + (field === "email" ? "presenter email" : "poster title");
    button.addEventListener("click", function () {
      startEditing(item, field, cell);
    });

    cell.appendChild(button);
  }

  function fillStatus(cell, state) {
    cell.innerHTML = "";

    if (state.error) {
      var invalid = document.createElement("span");
      invalid.className = "invalid";
      invalid.textContent = state.error;
      cell.appendChild(invalid);
      return;
    }

    var badge = document.createElement("span");
    badge.className = "badge badge--ok";
    badge.textContent = "Ready";
    cell.appendChild(badge);
  }

  // Update one row in place: rebuilding the whole table here would swallow a
  // click on another cell that arrives as this editor loses focus.
  function refreshItem(item) {
    var index = items.indexOf(item);
    if (index === -1) return;

    var view = views[index];
    fillEditable(view.titleCell, item, "title", "Add title");
    fillEditable(view.emailCell, item, "email", "Add email");
    fillStatus(view.statusCell, effective(item));
  }

  function updateSummary() {
    var readyCount = 0;

    items.forEach(function (item) {
      if (!effective(item).error) readyCount += 1;
    });

    selection.hidden = items.length === 0;
    if (clearButton) clearButton.hidden = items.length === 0;

    if (overridesInput) {
      overridesInput.value = JSON.stringify(
        items.map(function (item) {
          var state = effective(item);
          return { title: state.title, email: state.email };
        })
      );
    }

    var synced = syncInput();

    if (items.length === 0) {
      submitButton.disabled = true;
      note.classList.remove("note--error");
      note.textContent = "Select at least one PDF to continue.";
      return;
    }

    // Never upload a batch the list cannot vouch for: with the input out of
    // step, Remove and Clear all would not change what gets posted.
    if (!synced) {
      submitButton.disabled = true;
      note.classList.add("note--error");
      note.textContent = syncProblemMessage;
      return;
    }

    note.classList.remove("note--error");
    submitButton.disabled = readyCount === 0;
    note.textContent = (readyCount === 0
      ? "Click a title or email to type it, remove the file, or fix the file names before uploading."
      : readyCount + " of " + items.length + " file(s) ready to upload.") + listWarning;
  }

  function render() {
    rows.innerHTML = "";
    views = [];

    items.forEach(function (item) {
      var row = document.createElement("tr");

      var fileCell = document.createElement("td");
      fileCell.className = "file";
      fileCell.textContent = item.file.name;

      var titleCell = document.createElement("td");
      var emailCell = document.createElement("td");
      var statusCell = document.createElement("td");

      var actionsCell = document.createElement("td");
      var removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "link-btn";
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", function () {
        var index = items.indexOf(item);
        if (index === -1) return;
        items.splice(index, 1);
        render();
      });
      actionsCell.appendChild(removeButton);

      row.appendChild(fileCell);
      row.appendChild(titleCell);
      row.appendChild(emailCell);
      row.appendChild(statusCell);
      row.appendChild(actionsCell);
      rows.appendChild(row);

      views.push({ row: row, titleCell: titleCell, emailCell: emailCell, statusCell: statusCell });
      fillEditable(titleCell, item, "title", "Add title");
      fillEditable(emailCell, item, "email", "Add email");
      fillStatus(statusCell, effective(item));
    });

    updateSummary();
  }

  function addFiles(fileList) {
    var duplicates = 0;
    var overflow = 0;

    Array.prototype.forEach.call(fileList || [], function (file) {
      var duplicate = items.some(function (item) {
        return sameFile(item.file, file);
      });

      if (duplicate) {
        duplicates += 1;
        return;
      }
      if (items.length >= limits.maxFiles) {
        overflow += 1;
        return;
      }

      items.push({
        file: file,
        parsed: parseName(file.name),
        manual: { title: "", email: "" }
      });
    });

    listWarning = "";
    if (duplicates > 0) {
      listWarning += " " + duplicates + " file(s) were already on the list.";
    }
    if (overflow > 0) {
      listWarning += " Only " + limits.maxFiles + " PDFs can be uploaded at once.";
    }

    render();
  }

  input.addEventListener("change", function () {
    // Picking more files adds to the list; it never replaces it
    addFiles(input.files);
  });

  // Empty the picker before it opens so choosing the same file again still
  // reports a change; the list (and the posted files) survive that reset.
  function resetPicker() {
    try {
      input.value = "";
    } catch (error) {
      // Ignore: some browsers refuse to clear a file input this way
    }
  }

  if (dropzone) {
    ["dragenter", "dragover"].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (event) {
        event.preventDefault();
        dropzone.classList.add("is-dragging");
      });
    });

    ["dragleave", "drop"].forEach(function (eventName) {
      dropzone.addEventListener(eventName, function (event) {
        dropzone.classList.remove("is-dragging");
      });
    });

    dropzone.addEventListener("drop", function (event) {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        addFiles(event.dataTransfer.files);
      }
    });

    // Fires before the file dialog opens, whether the label or the input was clicked
    dropzone.addEventListener("click", resetPicker);
  }

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      items = [];
      listWarning = "";
      resetPicker();
      render();
    });
  }

  form.addEventListener("submit", function (event) {
    if (submitButton.disabled) {
      event.preventDefault();
      return;
    }

    // A cancelled picker can empty the input without touching the list
    if (!syncInput()) {
      event.preventDefault();
      submitButton.disabled = true;
      note.classList.add("note--error");
      note.textContent = syncProblemMessage;
      return;
    }

    note.classList.remove("note--error");
    submitButton.disabled = true;
    submitButton.textContent = "Uploading…";
    note.textContent = "Checking accounts and creating posters. Keep this page open.";
  });
})();
