const VIDEO_PROVIDERS = {
  youtube: {
    pattern: /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    embed: (id) => `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
    thumbnail: (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
  },
  vimeo: {
    pattern: /vimeo\.com\/(?:video\/)?(\d+)/,
    embed: (id) => `https://player.vimeo.com/video/${id}?autoplay=1`,
    thumbnail: null,
  },
};

function detectProvider(url) {
  const found = Object.entries(VIDEO_PROVIDERS).find(([, cfg]) => cfg.pattern.test(url));
  if (!found) return null;
  const [name, cfg] = found;
  const match = url.match(cfg.pattern);
  return { name, id: match[1], cfg };
}

export default function decorate(block) {
  const rows = [...block.children];
  const [urlCell, posterCell, captionCell] = rows.map((r) => r.querySelector('div') || r);

  const videoUrl = urlCell?.querySelector('a')?.href || urlCell?.textContent.trim();
  if (!videoUrl) return;

  const provider = detectProvider(videoUrl);

  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'video-embed-wrapper';

  // poster image
  const posterSrc = posterCell?.querySelector('img')?.src
    || (provider?.name === 'youtube' ? provider.cfg.thumbnail(provider.id) : null);

  const playArea = document.createElement('div');
  playArea.className = 'video-embed-play-area';

  if (posterSrc) {
    const img = document.createElement('img');
    img.src = posterSrc;
    img.alt = 'Video preview';
    img.loading = 'lazy';
    img.className = 'video-embed-poster';
    playArea.append(img);
  }

  const playBtn = document.createElement('button');
  playBtn.className = 'video-embed-play-btn';
  playBtn.setAttribute('aria-label', 'Play video');
  playBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="rgb(0 72 37 / 75%)"/>
    <polygon points="10,8 18,12 10,16" fill="white"/>
  </svg>`;

  playArea.append(playBtn);
  wrapper.append(playArea);

  if (captionCell?.textContent.trim()) {
    const caption = document.createElement('p');
    caption.className = 'video-embed-caption';
    caption.textContent = captionCell.textContent.trim();
    wrapper.append(caption);
  }

  playBtn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'video-embed-iframe';
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = captionCell?.textContent.trim() || 'Video';

    if (provider) {
      iframe.src = provider.cfg.embed(provider.id);
    } else {
      iframe.src = videoUrl;
    }

    playArea.replaceWith(iframe);
  }, { once: true });

  block.append(wrapper);
}
