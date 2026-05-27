function animateCount(el, target, duration = 1800) {
  const isFloat = target % 1 !== 0;
  const suffix = el.dataset.suffix || '';
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    // ease-out cubic
    const eased = 1 - (1 - progress) ** 3;
    const current = isFloat
      ? (eased * target).toFixed(1)
      : Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function parseStatValue(raw) {
  const cleaned = raw.trim();
  const suffix = cleaned.replace(/[\d.,]/g, '');
  const numeric = parseFloat(cleaned.replace(/[^\d.]/g, ''));
  return { numeric, suffix };
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const [valueCell, labelCell] = [...row.children];
    if (!valueCell || !labelCell) return;

    const rawValue = valueCell.textContent.trim();
    const { numeric, suffix } = parseStatValue(rawValue);

    const li = document.createElement('li');
    const numEl = document.createElement('span');
    numEl.className = 'stats-number';
    numEl.dataset.target = numeric;
    numEl.dataset.suffix = suffix;
    numEl.textContent = rawValue;

    const labelEl = document.createElement('span');
    labelEl.className = 'stats-label';
    labelEl.textContent = labelCell.textContent.trim();

    li.append(numEl, labelEl);
    ul.append(li);
  });

  block.replaceChildren(ul);

  // Animate numbers when they enter viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stats-number').forEach((el) => {
        animateCount(el, parseFloat(el.dataset.target));
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  observer.observe(block);
}
