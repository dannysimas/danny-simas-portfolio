import {chooseAccentPositions} from './accent-placement.mjs';

const arrangements = [
  ['.statement', [[.78, .52], [.46, .84]]],
  ['.work-stage', [[.55, .12]]],
  ['.collaborate', [[.47, .48], [.74, .12]]],
  ['.audience', [[.52, .48], [.62, .91]]],
  ['.partners', [[.53, .20], [.83, .70]]],
  ['.recognition', [[.63, .18], [.34, .70]]],
  ['.social-section', [[.59, .20]]],
  ['.media-section', [[.76, .38], [.52, .66]]],
  ['.faq-section', [[.40, .44], [.23, .77]]],
  ['.contact-section', [[.77, .42], [.48, .68]]],
  ['.vault-intro', [[.53, .66]]],
  ['.library', [[.62, .08], [.50, .92]]],
  ['.usage-section', [[.50, .58]]],
  ['.photomodes-intro', [[.53, .70]]],
  ['.photomode-terms', [[.35, .60], [.69, .45]]],
  ['.photomodes-library', [[.35, .40], [.67, .74]]]
];

export function setupScatteredAccents() {
  const entries = arrangements.flatMap(([selector, preferred], seed) => [...document.querySelectorAll(selector)].map(region => {
    const layer = region.querySelector(':scope > .frame-details');
    const marks = layer ? [...layer.querySelectorAll('.frame-reticle')] : [];
    if (!marks.length) return null;
    layer.classList.add('frame-details--scattered');
    marks.forEach(mark => {mark.hidden = true;});
    return {region, layer, marks, preferred, seed};
  }).filter(Boolean));
  if (!entries.length) return;

  function position({region, layer, marks, preferred, seed}) {
    const origin = layer.getBoundingClientRect();
    if (!origin.width || !origin.height) return;
    const obstacles = [];
    const addRect = (rect, element) => {
      if (!rect.width || !rect.height || rect.bottom < origin.top || rect.top > origin.bottom) return;
      // The reveal animation travels 35px vertically; keep its entire path clear.
      const travel = element?.closest('.reveal') ? 35 : 0;
      obstacles.push({left: rect.left - origin.left, right: rect.right - origin.left,
        top: rect.top - origin.top - travel, bottom: rect.bottom - origin.top + travel});
    };
    // Entire art surfaces and controls are protected, including their empty interior.
    for (const element of region.querySelectorAll('img,video,iframe,svg,button,a,input,select,textarea,summary,.portrait,.gallery-window,.media-item,.frame-corner-start,.frame-corner-end,.frame-index')) {
      addRect(element.getBoundingClientRect(), element);
    }
    // Keep the small crosses off the rules that divide rows and columns, too.
    for (const element of region.querySelectorAll('.stats-grid,.stat,.partner-group,.recognition-row,.instagram-shell,.faq-list,.faq-list details,.photomode-library-heading,.photomode-terms-grid > *')) {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      const top = parseFloat(style.borderTopWidth), bottom = parseFloat(style.borderBottomWidth);
      const right = parseFloat(style.borderRightWidth), left = parseFloat(style.borderLeftWidth);
      if (top) addRect({...rect.toJSON(), bottom: rect.top + top, height: top}, element);
      if (bottom) addRect({...rect.toJSON(), top: rect.bottom - bottom, height: bottom}, element);
      if (right) addRect({...rect.toJSON(), left: rect.right - right, width: right}, element);
      if (left) addRect({...rect.toJSON(), right: rect.left + left, width: left}, element);
    }
    // Protect a sticky column along its full travel, not just where it sits at this moment.
    for (const element of region.querySelectorAll('.portrait,.faq-intro')) {
      if (getComputedStyle(element).position !== 'sticky') continue;
      const rect = element.getBoundingClientRect();
      obstacles.push({left: rect.left - origin.left, right: rect.right - origin.left, top: 0, bottom: origin.height});
    }
    // Text ranges leave genuine whitespace available beside shorter lines and headings.
    const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim() || node.parentElement.closest('.frame-details,script,style')) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) addRect(rect, node.parentElement);
    }
    const size = parseFloat(getComputedStyle(marks[0]).width) || 24;
    const phone = matchMedia('(max-width: 700px)').matches;
    const positions = chooseAccentPositions({width: origin.width, height: origin.height, obstacles, preferred,
      count: phone ? 1 : marks.length, size, gap: phone ? 8 : 12, seed});
    marks.forEach((mark, index) => {
      const point = positions[index];
      mark.hidden = !point;
      if (point) {
        mark.style.setProperty('--reticle-x', `${point.left}px`);
        mark.style.setProperty('--reticle-y', `${point.top}px`);
      }
    });
  }

  // Re-check after fonts, responsive changes, opened FAQs and live gallery updates.
  // No per-frame or scroll work; sticky content is already excluded above.
  let timer;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(() => entries.forEach(position)), 120);
  }
  const resize = new ResizeObserver(schedule);
  entries.forEach(({region}) => resize.observe(region));
  const content = new MutationObserver(records => {
    if (records.some(record => !record.target.parentElement?.closest('.frame-details'))) schedule();
  });
  entries.forEach(({region}) => content.observe(region, {childList: true, characterData: true, subtree: true}));
  document.addEventListener('toggle', schedule, true);
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('load', schedule, {once: true});
  document.fonts.ready.then(schedule);
  schedule();
}
