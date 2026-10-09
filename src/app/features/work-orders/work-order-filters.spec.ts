import { TestBed } from '@angular/core/testing';
import { fireEvent, screen } from '@testing-library/dom';

import { WorkOrderStatus } from '../../core/api/models';
import { WorkOrderFilters } from './work-order-filters';

describe('WorkOrderFilters: the search box', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Renders the filters as the page would for a URL, and records the searches they ask for. */
  function render(query = '', status: WorkOrderStatus | null = null) {
    const fixture = TestBed.createComponent(WorkOrderFilters);
    const searches: string[] = [];
    fixture.componentInstance.queryChange.subscribe((search) => searches.push(search));

    const urlHas = (next: string) => {
      fixture.componentRef.setInput('query', next);
      fixture.detectChanges();
    };
    fixture.componentRef.setInput('status', status);
    urlHas(query);

    const box = screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search' });
    const type = (text: string) => fireEvent.input(box, { target: { value: text } });
    return { box, searches, type, urlHas };
  }

  it('searches once, with the whole text, after typing pauses', () => {
    const { searches, type } = render();

    type('l');
    vi.advanceTimersByTime(200);
    type('lights');
    vi.advanceTimersByTime(299);
    expect(searches).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(searches).toEqual(['lights']);
  });

  it('shows a query that did not come from the box, such as one from the back button', () => {
    const { box, urlHas } = render('stage');
    expect(box).toHaveValue('stage');

    urlHas('lights');

    expect(box).toHaveValue('lights');
  });

  it('leaves the text alone when its own search comes back from the URL', () => {
    const { box, searches, type, urlHas } = render();
    type('stage ');
    vi.advanceTimersByTime(300);
    expect(searches).toEqual(['stage']);

    // The user is already typing the next word when the navigation lands.
    type('stage li');
    urlHas('stage');

    expect(box).toHaveValue('stage li');
    vi.advanceTimersByTime(300);
    expect(searches).toEqual(['stage', 'stage li']);
  });

  it('drops a search that is still waiting when the filters are cleared', () => {
    const { box, searches, type } = render('', 'OPEN');
    type('lights');

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    vi.advanceTimersByTime(300);

    expect(searches).toEqual([]);
    expect(box).toHaveValue('');
  });

  it('searches for the same text again after the filters were cleared', () => {
    const { searches, type, urlHas } = render();
    type('lights');
    vi.advanceTimersByTime(300);
    urlHas('lights');

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    urlHas('');
    type('lights');
    vi.advanceTimersByTime(300);

    expect(searches).toEqual(['lights', 'lights']);
  });
});
