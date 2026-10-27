import { linkify } from './linkify';

describe('linkify', () => {
  it('keeps a body without links as one piece of text', () => {
    expect(linkify('Hello Lena,\n\nSee you there.')).toEqual([
      { text: 'Hello Lena,\n\nSee you there.' },
    ]);
  });

  it('turns a link into its own part and leaves the sentence around it', () => {
    expect(linkify('Rate it here: http://localhost:4200/feedback/abc-123. Thanks!')).toEqual([
      { text: 'Rate it here: ' },
      { url: 'http://localhost:4200/feedback/abc-123' },
      { text: '. Thanks!' },
    ]);
  });

  it('finds every link, at the start and at the end', () => {
    expect(linkify('https://a.example/x and https://b.example/y')).toEqual([
      { url: 'https://a.example/x' },
      { text: ' and ' },
      { url: 'https://b.example/y' },
    ]);
  });

  it('ignores addresses that are not http or https', () => {
    expect(linkify('javascript:alert(1)')).toEqual([{ text: 'javascript:alert(1)' }]);
  });
});
