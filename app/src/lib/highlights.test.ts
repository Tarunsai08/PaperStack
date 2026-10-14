import { beforeEach, describe, expect, it } from 'vitest';
import { highlightAt, offsetsToRange, rangeToOffsets } from './highlights';
import type { Highlight } from './storage';

function setup(html: string): HTMLElement {
  document.body.innerHTML = `<div id="root">${html}</div>`;
  return document.getElementById('root')!;
}

describe('highlight offsets', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('round-trips a selection that spans elements', () => {
    const root = setup('<p>Hello <strong>brave</strong> new world</p><p>Second para</p>');
    const strong = root.querySelector('strong')!.firstChild!;
    const tail = root.querySelector('p')!.lastChild!;
    const range = document.createRange();
    range.setStart(strong, 1); // "rave"
    range.setEnd(tail, 4); // " new"
    const offs = rangeToOffsets(root, range)!;
    expect(offs.text).toBe('rave new');
    const back = offsetsToRange(root, offs.start, offs.end)!;
    expect(back.toString()).toBe('rave new');
  });

  it('ignores diagrams and math so their late rendering cannot shift offsets', () => {
    const root = setup('<p>Before</p><figure data-hl-skip><svg><text>diagram text</text></svg></figure><p>After words</p>');
    const after = root.querySelectorAll('p')[1].firstChild!;
    const range = document.createRange();
    range.setStart(after, 0);
    range.setEnd(after, 5);
    const offs = rangeToOffsets(root, range)!;
    expect(offs).toEqual({ start: 6, end: 11, text: 'After' });
    // Adding more diagram text later does not move the highlight.
    root.querySelector('text')!.textContent = 'a much longer diagram label';
    expect(offsetsToRange(root, offs.start, offs.end)!.toString()).toBe('After');
  });

  it('trims whitespace at the edges', () => {
    const root = setup('<p>  spaced out  </p>');
    const t = root.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(t, 0);
    range.setEnd(t, t.textContent!.length);
    expect(rangeToOffsets(root, range)).toEqual({ start: 2, end: 12, text: 'spaced out' });
  });

  it('finds the highlight under an offset', () => {
    const list: Highlight[] = [
      { id: '1', start: 0, end: 5, text: 'a', color: 'yellow', createdAt: '' },
      { id: '2', start: 10, end: 20, text: 'b', color: 'blue', createdAt: '' },
    ];
    expect(highlightAt(list, 12)?.id).toBe('2');
    expect(highlightAt(list, 7)).toBeUndefined();
  });
});
