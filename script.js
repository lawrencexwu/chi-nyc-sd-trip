// Persist booking-checklist state locally so progress survives a refresh.
// Keyed by position so the markup stays clean (no per-item ids needed).
(function () {
  var boxes = document.querySelectorAll('.checklist-items input[type="checkbox"]');
  boxes.forEach(function (box, i) {
    var key = 'chi-nyc-sd-la-2026:chk:' + i;
    var saved = localStorage.getItem(key);
    if (saved === '1') box.checked = true;
    else if (saved === '0') box.checked = false;
    box.addEventListener('change', function () {
      localStorage.setItem(key, box.checked ? '1' : '0');
    });
  });
})();
