export default function decorate(block) {
  const items = [];
  const rows = [...block.children];

  // Pair rows: each pair is [question row, answer row]
  for (let i = 0; i < rows.length; i += 2) {
    const questionRow = rows[i];
    const answerRow = rows[i + 1];
    if (!questionRow) break;

    const question = questionRow.querySelector('div')?.textContent.trim()
      || questionRow.textContent.trim();
    const answerContent = answerRow?.querySelector('div') || answerRow;

    items.push({ question, answerContent });
  }

  block.innerHTML = '';

  items.forEach(({ question, answerContent }, index) => {
    const id = `accordion-item-${index}`;
    const panelId = `accordion-panel-${index}`;

    const item = document.createElement('div');
    item.className = 'accordion-item';

    const heading = document.createElement('h3');
    heading.className = 'accordion-heading';

    const button = document.createElement('button');
    button.className = 'accordion-trigger';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', panelId);
    button.id = id;
    button.innerHTML = `<span>${question}</span><span class="accordion-icon" aria-hidden="true"></span>`;

    heading.append(button);

    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', id);
    panel.hidden = true;

    const inner = document.createElement('div');
    inner.className = 'accordion-panel-inner';
    if (answerContent) {
      while (answerContent.firstElementChild) inner.append(answerContent.firstElementChild);
    }
    panel.append(inner);

    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.hidden = expanded;
      item.classList.toggle('is-open', !expanded);
    });

    item.append(heading, panel);
    block.append(item);
  });
}
