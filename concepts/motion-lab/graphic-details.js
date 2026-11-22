import './graphic-details.css';
import {setupScatteredAccents} from './scattered-accents.js';

// Extend the Photomodes art direction without adding controls or reading order.
// All marks are decorative, ignore pointer input, and never change layout height.
const regions = [
  ['.stage', '', 'hero'],
  ['.statement', '01', 'section', 'pair'],
  ['.work-stage', '02', 'work'],
  ['.wallpaper-callout', '', 'compact'],
  ['.collaborate', '03', 'section', 'pair'],
  ['.audience', '', 'markers'],
  ['.partners', '04', 'section', 'pair'],
  ['.recognition', '', 'markers', 'left'],
  ['.social-section', '', 'markers'],
  ['.media-section', '05', 'section', 'pair'],
  ['.faq-section', '', 'markers', 'left'],
  ['.contact-section', '06', 'section', 'pair'],
  ['.vault-intro', '01', 'intro'],
  ['.library', '', 'markers', 'left'],
  ['.usage-section', '02'],
  ['.photomodes-intro', '', 'intro'],
  ['.photomode-terms', '', 'markers'],
  ['.photomodes-library', '', 'markers', 'left'],
  ['.site-footer', '', 'compact'],
];

for (const [selector, number, variant = 'section', accent] of regions) {
  for (const region of document.querySelectorAll(selector)) {
    if (region.querySelector(':scope > .frame-details')) continue;
    region.classList.add('frame-accent', `frame-accent--${variant}`);
    const details = document.createElement('span');
    details.className = 'frame-details';
    details.setAttribute('aria-hidden', 'true');
    // New regions get only a cross; preserve their existing backgrounds and spacing.
    if (accent === 'left') details.classList.add('frame-details--left');
    for (const name of variant === 'markers' ? ['reticle'] : ['corner-start', 'corner-end', 'reticle']) {
      const mark = document.createElement('span');
      mark.className = `frame-${name}`;
      details.append(mark);
    }
    if (accent === 'pair') {
      const secondary = document.createElement('span');
      secondary.className = 'frame-reticle frame-reticle--secondary';
      details.append(secondary);
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

setupScatteredAccents();
