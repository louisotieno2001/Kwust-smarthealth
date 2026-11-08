(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var sidebar = document.getElementById('portal-sidebar');
    var toggle = document.getElementById('portal-menu-toggle');
    var overlay = document.getElementById('portal-overlay');
    if (!sidebar || !toggle || !overlay) return;

    function setOpen(open) {
      sidebar.classList.toggle('open', open);
      overlay.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('portal-menu-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(!sidebar.classList.contains('open'));
    });

    overlay.addEventListener('click', function () {
      setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) setOpen(false);
    });
  });
})();
