(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form[data-confirm]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        if (!window.confirm(form.getAttribute('data-confirm') || 'Are you sure?')) {
          event.preventDefault();
        }
      });
    });

    document.querySelectorAll('form[data-submit-once]').forEach(function (form) {
      form.addEventListener('submit', function () {
        var button = form.querySelector('button[type="submit"]');
        if (button) {
          button.disabled = true;
          button.textContent = button.getAttribute('data-loading-text') || 'Please wait...';
        }
      });
    });

    document.querySelectorAll('[data-password-toggle]').forEach(function (button) {
      var input = document.getElementById(button.getAttribute('data-password-toggle'));
      if (!input) return;
      button.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.textContent = show ? 'Hide' : 'Show';
        button.setAttribute('aria-pressed', String(show));
        button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });
  });
})();

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var addButton = document.querySelector('[data-add-prescription]');
    var template = document.getElementById('prescription-row-template');
    var rows = document.getElementById('prescription-rows');
    if (addButton && template && rows) {
      addButton.addEventListener('click', function () {
        var clone = template.content.cloneNode(true);
        rows.appendChild(clone);
      });
    }
  });
})();
