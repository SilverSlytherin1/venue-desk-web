import { TestBed } from '@angular/core/testing';
import { within } from '@testing-library/dom';

import { FeedbackSummary } from '../../core/api/models';
import { RatingSummary } from './rating-summary';

describe('RatingSummary', () => {
  async function render(summary: FeedbackSummary) {
    const fixture = TestBed.createComponent(RatingSummary);
    fixture.componentRef.setInput('summary', summary);
    await fixture.whenStable();
    return within(fixture.nativeElement as HTMLElement);
  }

  it('shows the average as a figure and as stars, with a row per rating from 5 down', async () => {
    const view = await render({ average: 4.6, count: 18, distribution: [0, 1, 1, 4, 12] });

    expect(view.getByText('4.6')).toBeInTheDocument();
    expect(view.getByRole('img', { name: '4.6 out of 5' })).toBeInTheDocument();
    expect(view.getByText('from 18 ratings')).toBeInTheDocument();
    const rows = within(
      view.getByRole('list', { name: 'Ratings by number of stars' }),
    ).getAllByRole('listitem');
    const expected = [
      ['5 stars', '12'],
      ['4 stars', '4'],
      ['3 stars', '1'],
      ['2 stars', '1'],
      ['1 star', '0'],
    ];
    expect(rows).toHaveLength(expected.length);
    rows.forEach((row, index) => {
      const [label = '', count = ''] = expected[index] ?? [];
      expect(within(row).getByText(label)).toBeInTheDocument();
      expect(within(row).getByText(count)).toBeInTheDocument();
    });
  });

  it('says there is no average yet instead of showing zero', async () => {
    const view = await render({ average: null, count: 0, distribution: [0, 0, 0, 0, 0] });

    expect(view.getByText('None')).toBeInTheDocument();
    expect(view.queryByRole('img')).not.toBeInTheDocument();
    expect(view.getByText('from 0 ratings')).toBeInTheDocument();
  });
});
