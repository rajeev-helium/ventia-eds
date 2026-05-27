import { createOptimizedPicture } from '../../scripts/aem.js';

function buildVideo(src) {
  const video = document.createElement('video');
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'metadata');
  const source = document.createElement('source');
  source.src = src;
  source.type = src.endsWith('.webm') ? 'video/webm' : 'video/mp4';
  video.append(source);
  return video;
}

export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const [mediaCell, contentCell] = [...row.children];

  if (mediaCell) {
    // Check for video link (mp4/webm) before falling back to picture
    const link = mediaCell.querySelector('a');
    const videoSrc = link?.href;
    const isVideo = videoSrc && /\.(mp4|webm)(\?|$)/i.test(videoSrc);

    if (isVideo) {
      mediaCell.innerHTML = '';
      mediaCell.append(buildVideo(videoSrc));
    } else {
      const pic = mediaCell.querySelector('picture');
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
    }
    mediaCell.className = 'hero-image';
  }

  if (contentCell) {
    contentCell.className = 'hero-content';
  }
}
