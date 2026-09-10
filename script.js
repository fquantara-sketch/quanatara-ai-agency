// ===== Quanatara — shared site behaviour =====

document.addEventListener('DOMContentLoaded', () => {
  // Sticky nav shadow on scroll
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu toggle
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // Scroll reveal
  const revealTargets = document.querySelectorAll(
    '.service-card, .step, .feature, .metric, .value-item, .info-card, .detail-inner, .form-card'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const siblings = Array.from(el.parentElement ? el.parentElement.children : []);
          const idx = siblings.indexOf(el);
          el.style.transitionDelay = (Math.min(idx, 5) * 70) + 'ms';
          el.classList.add('visible');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('visible'));
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Contact form
  const form = document.getElementById('contactForm');
  if (form) {
    const success = document.getElementById('formSuccess');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (form.querySelector('#name') || {}).value || '';
      const email = (form.querySelector('#email') || {}).value || '';
      const company = (form.querySelector('#company') || {}).value || '';
      const service = (form.querySelector('#service') || {}).value || '';
      const message = (form.querySelector('#message') || {}).value || '';

      const subject = encodeURIComponent(`New project enquiry — ${service || 'Quanatara'}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nService: ${service}\n\n${message}`
      );

      // Open the user's mail client pre-filled, addressed to the Quanatara inbox.
      window.location.href = `mailto:hello@quanatara.com?subject=${subject}&body=${body}`;

      if (success) {
        success.classList.add('show');
        success.textContent = "Thanks — opening your email app to send this. If nothing opens, email hello@quanatara.com directly.";
      }
      form.reset();
    });
  }
});
