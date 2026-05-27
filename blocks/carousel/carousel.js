import { createOptimizedPicture } from '../../scripts/aem.js';

function buildSlide(row) {
  const cells = [...row.children];
  const slide = document.createElement('li');
  slide.className = 'carousel-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');

  const [imgCell, ...contentCells] = cells;

  if (imgCell?.querySelector('picture')) {
    const pic = imgCell.querySelector('picture');
    const img = pic.querySelector('img');
    const optimized = createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '1200' },
      { width: '750' },
    ]);
    pic.replaceWith(optimized);
    const imageDiv = document.createElement('div');
    imageDiv.className = 'carousel-slide-image';
    imageDiv.append(imgCell.querySelector('picture'));
    slide.append(imageDiv);
  }

  const content = document.createElement('div');
  content.className = 'carousel-slide-content';
  contentCells.forEach((cell) => {
    while (cell.firstElementChild) content.append(cell.firstElementChild);
  });
  slide.append(content);

  return slide;
}

function goToSlide(track, dots, index) {
  const slides = [...track.children];
  slides.forEach((s, i) => {
    s.setAttribute('aria-hidden', i !== index);
    s.classList.toggle('is-active', i === index);
  });
  dots?.forEach((d, i) => d.classList.toggle('is-active', i === index));
  track.style.transform = `translateX(${-index * 100}%)`;
}

export default function decorate(block) {
  const isAuto = block.classList.contains('auto');
  const slides = [...block.children].map(buildSlide);

  block.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'carousel-container';
  container.setAttribute('aria-roledescription', 'carousel');

  const track = document.createElement('ul');
  track.className = 'carousel-track';
  slides.forEach((slide, i) => {
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${slides.length}`);
    track.append(slide);
  });

  // prev/next buttons
  const prev = document.createElement('button');
  prev.className = 'carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';

  const next = document.createElement('button');
  next.className = 'carousel-next';
  next.setAttribute('aria-label', 'Next slide');
  next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

  // dot nav
  const dotsNav = document.createElement('div');
  dotsNav.className = 'carousel-dots';

  let current = 0;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => {
      current = i;
      goToSlide(track, dots, current);
      resetAutoplay(); // eslint-disable-line no-use-before-define
    });
    dotsNav.append(dot);
    return dot;
  });

  container.append(track, prev, next, dotsNav);
  block.append(container);

  goToSlide(track, dots, 0);

  const total = slides.length;

  prev.addEventListener('click', () => {
    current = (current - 1 + total) % total;
    goToSlide(track, dots, current);
    resetAutoplay(); // eslint-disable-line no-use-before-define
  });

  next.addEventListener('click', () => {
    current = (current + 1) % total;
    goToSlide(track, dots, current);
    resetAutoplay(); // eslint-disable-line no-use-before-define
  });

  // touch/swipe
  let touchStartX = 0;
  container.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend', (e) => {
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      current = delta > 0 ? (current + 1) % total : (current - 1 + total) % total;
      goToSlide(track, dots, current);
    }
  });

  // autoplay
  let timer;
  function resetAutoplay() {
    clearInterval(timer);
    if (isAuto) {
      timer = setInterval(() => {
        current = (current + 1) % total;
        goToSlide(track, dots, current);
      }, 5000);
    }
  }
  resetAutoplay();

  // pause autoplay on hover/focus
  if (isAuto) {
    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', resetAutoplay);
    container.addEventListener('focusin', () => clearInterval(timer));
    container.addEventListener('focusout', resetAutoplay);
  }
}
