// Two identical groups, each wider than the ribbon, make the wrap invisible.
export function setupMarquee(ribbon) {
  const track = ribbon.querySelector('.ribbon-track');
  const group = track.querySelector('.ribbon-group');
  const phrase = group.querySelector('.ribbon-phrase');
  let previousWidth = 0;
  let previousPhraseWidth = 0;

  function fillRibbon() {
    const width = ribbon.clientWidth;
    const phraseWidth = phrase.offsetWidth;
    if (!width || !phraseWidth) return;
    if (width === previousWidth && phraseWidth === previousPhraseWidth) return;
    previousWidth = width;
    previousPhraseWidth = phraseWidth;

    const repetitions = Math.ceil(width / phraseWidth) + 1;
    group.replaceChildren(phrase);
    for (let index = 1; index < repetitions; index++) {
      group.append(phrase.cloneNode(true));
    }
    track.replaceChildren(group, group.cloneNode(true));
    // Preserve the original pace even when a wider screen needs more copies.
    track.style.setProperty('--marquee-duration', `${28 * repetitions}s`);
  }

  fillRibbon();
  new ResizeObserver(fillRibbon).observe(ribbon);
  document.fonts.ready.then(fillRibbon);
  document.fonts.addEventListener('loadingdone', fillRibbon);
}
