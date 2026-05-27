export default function decorate(block) {
  const regions = [];
  const rows = [...block.children];

  // Group rows by region header (single-cell row = region name, multi-cell = contact data)
  let currentRegion = null;

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 1) {
      // region header row
      currentRegion = { name: cells[0].textContent.trim(), offices: [] };
      regions.push(currentRegion);
    } else if (currentRegion && cells.length >= 2) {
      // office row: [city/name, address/contact details]
      const [nameCell, detailCell] = cells;
      currentRegion.offices.push({
        name: nameCell.textContent.trim(),
        details: detailCell.innerHTML,
      });
    }
  });

  block.innerHTML = '';

  regions.forEach(({ name, offices }, ri) => {
    const section = document.createElement('div');
    section.className = 'location-region';

    if (name) {
      const heading = document.createElement('h3');
      heading.className = 'location-region-heading';
      heading.textContent = name;
      section.append(heading);
    }

    const grid = document.createElement('ul');
    grid.className = 'location-offices';

    offices.forEach(({ name: officeName, details }) => {
      const li = document.createElement('li');
      li.className = 'location-office';

      const officeHead = document.createElement('button');
      officeHead.className = 'location-office-trigger';
      officeHead.setAttribute('aria-expanded', ri === 0 ? 'true' : 'false');
      officeHead.textContent = officeName;

      const detail = document.createElement('div');
      detail.className = 'location-office-detail';
      detail.innerHTML = details;
      detail.hidden = ri !== 0;

      officeHead.addEventListener('click', () => {
        const expanded = officeHead.getAttribute('aria-expanded') === 'true';
        officeHead.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        detail.hidden = expanded;
      });

      li.append(officeHead, detail);
      grid.append(li);
    });

    section.append(grid);
    block.append(section);
  });
}
