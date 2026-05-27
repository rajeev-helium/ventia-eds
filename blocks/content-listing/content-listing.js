import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULT_PAGE_SIZE = 12;

function parseConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [keyCell, valCell] = [...row.children];
    if (!keyCell || !valCell) return;
    const key = keyCell.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    config[key] = valCell.textContent.trim();
  });
  return config;
}

function buildCard(item) {
  const li = document.createElement('li');
  li.className = 'content-listing-card';

  if (item.image) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'content-listing-card-image';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || '';
    img.loading = 'lazy';
    img.width = 750;
    img.height = 422;
    const pic = createOptimizedPicture(item.image, item.title || '', false, [{ width: '750' }]);
    imageDiv.append(pic);
    li.append(imageDiv);
  }

  const body = document.createElement('div');
  body.className = 'content-listing-card-body';

  if (item.category) {
    const cat = document.createElement('span');
    cat.className = 'content-listing-card-eyebrow';
    cat.textContent = item.category;
    body.append(cat);
  }

  const title = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = item.path;
  titleLink.textContent = item.title || 'Untitled';
  title.append(titleLink);
  body.append(title);

  if (item.description) {
    const desc = document.createElement('p');
    desc.textContent = item.description;
    body.append(desc);
  }

  if (item.date) {
    const date = document.createElement('time');
    date.className = 'content-listing-card-date';
    const d = new Date(item.date * 1000);
    const [isoDate] = d.toISOString().split('T');
    date.dateTime = isoDate;
    date.textContent = d.toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    body.append(date);
  }

  li.append(body);
  return li;
}

export default async function decorate(block) {
  const config = parseConfig(block);
  const source = config.source || '/query-index.json';
  const filterType = config.filter;
  const pageSize = parseInt(config['page-size'] || DEFAULT_PAGE_SIZE, 10);

  block.innerHTML = '<div class="content-listing-loading" aria-live="polite">Loading...</div>';

  try {
    const resp = await fetch(source);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    let items = json.data || [];
    if (filterType) {
      const [key, val] = filterType.includes('=') ? filterType.split('=') : ['type', filterType];
      items = items.filter((i) => (i[key] || '').toLowerCase() === val.toLowerCase());
    }

    block.innerHTML = '';

    if (!items.length) {
      block.innerHTML = '<p class="content-listing-empty">No items found.</p>';
      return;
    }

    let page = 0;
    const ul = document.createElement('ul');
    ul.className = 'content-listing-grid';

    const renderPage = () => {
      const slice = items.slice(page * pageSize, (page + 1) * pageSize);
      slice.forEach((item) => ul.append(buildCard(item)));
      page += 1;
    };

    renderPage();
    block.append(ul);

    if (items.length > pageSize) {
      const loadMore = document.createElement('button');
      loadMore.className = 'button primary content-listing-load-more';
      loadMore.textContent = 'Load more';

      loadMore.addEventListener('click', () => {
        renderPage();
        if (page * pageSize >= items.length) loadMore.remove();
      });

      block.append(loadMore);
    }
  } catch (err) {
    block.innerHTML = '<p class="content-listing-error">Unable to load content. Please try again later.</p>';
    // eslint-disable-next-line no-console
    console.error('content-listing error:', err);
  }
}
