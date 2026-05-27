import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const li = document.createElement('li');
    li.className = 'team-profile-card';

    // cells: [image, name, title, bio, link?]
    const [imgCell, nameCell, titleCell, bioCell, linkCell] = cells;

    if (imgCell?.querySelector('picture')) {
      const pic = imgCell.querySelector('picture');
      const img = pic.querySelector('img');
      const optimized = createOptimizedPicture(img.src, img.alt || nameCell?.textContent.trim() || '', false, [{ width: '400' }]);
      const imageDiv = document.createElement('div');
      imageDiv.className = 'team-profile-image';
      imageDiv.append(optimized);
      li.append(imageDiv);
    }

    const body = document.createElement('div');
    body.className = 'team-profile-body';

    if (nameCell) {
      const name = document.createElement('h3');
      name.className = 'team-profile-name';
      name.textContent = nameCell.textContent.trim();
      body.append(name);
    }

    if (titleCell) {
      const title = document.createElement('p');
      title.className = 'team-profile-title';
      title.textContent = titleCell.textContent.trim();
      body.append(title);
    }

    if (bioCell) {
      const bio = document.createElement('p');
      bio.className = 'team-profile-bio';
      bio.textContent = bioCell.textContent.trim();
      body.append(bio);
    }

    if (linkCell) {
      const href = linkCell.querySelector('a')?.href || linkCell.textContent.trim();
      if (href) {
        const link = document.createElement('a');
        link.className = 'team-profile-link';
        link.href = href;
        link.textContent = 'View profile';
        body.append(link);
      }
    }

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
