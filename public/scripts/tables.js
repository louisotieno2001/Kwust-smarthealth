(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-table-filter]').forEach(function (input) {
      var targetSelector = input.getAttribute('data-table-filter');
      var table = document.querySelector(targetSelector);
      if (!table) return;
      input.addEventListener('input', function () {
        var term = input.value.trim().toLowerCase();
        table.querySelectorAll('tbody tr').forEach(function (row) {
          row.hidden = term.length > 0 && !row.textContent.toLowerCase().includes(term);
        });
      });
    });
  });
})();
