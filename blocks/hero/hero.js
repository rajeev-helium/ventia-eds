import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const [imageCell, contentCell] = [...row.children];

  if (imageCell) {
    const pic = imageCell.querySelector('picture');
    if (pic) {
      const img = pic.querySelector('img');
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
      const optimized = createOptimizedPicture(img.src, img.alt, true, [
        { media: '(min-width: 900px)', width: '1440' },
        { width: '750' },
      ]);
      pic.replaceWith(optimized);
    }
    imageCell.className = 'hero-image';
  }

  if (contentCell) {
    contentCell.className = 'hero-content';
  }
}
