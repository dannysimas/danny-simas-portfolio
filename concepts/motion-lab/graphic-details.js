import './graphic-details.css';

// Extend the Photomodes art direction without adding controls or reading order.
// All marks are decorative, ignore pointer input, and never change layout height.
const regions = [
  ['.stage', '', 'hero'],
  ['.statement', '01'],
  ['.work-stage', '02', 'work'],
  ['.wallpaper-callout', '', 'compact'],
  ['.collaborate', '03'],
  ['.partners', '04'],
  ['.media-section', '05'],
  ['.contact-section', '06'],
  ['.vault-intro', '01', 'intro'],
  ['.usage-section', '02'],
  ['.photomodes-intro', '', 'intro'],
  ['.site-footer', '', 'compact'],
];

for (const [selector, number, variant = 'section'] of regions) {
  for (const region of document.querySelectorAll(selector)) {
    if (region.querySelector(':scope > .frame-details')) continue;
    region.classList.add('frame-accent', `frame-accent--${variant}`);
    const details = document.createElement('span');
    details.className = 'frame-details';
    details.setAttribute('aria-hidden', 'true');
    for (const name of ['corner-start', 'corner-end', 'reticle']) {
      const mark = document.createElement('span');
      mark.className = `frame-${name}`;
      details.append(mark);
    }
    if (number) {
      const index = document.createElement('span');
      index.className = 'frame-index';
      index.textContent = number;
      details.append(index);
    }
    region.append(details);
  }
}
