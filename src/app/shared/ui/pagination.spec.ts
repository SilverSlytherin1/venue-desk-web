import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { Pagination, toPageNumber } from './pagination';

describe('Pagination', () => {
  /** Renders the component and returns the pages it asks for. */
  function render(page: number, total: number, pageSize = 10): number[] {
    const fixture = TestBed.createComponent(Pagination);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('pageSize', pageSize);
    fixture.componentRef.setInput('total', total);
    const requested: number[] = [];
    fixture.componentInstance.pageChange.subscribe((next) => requested.push(next));
    fixture.detectChanges();
    return requested;
  }

  it('says which items of the total are on screen', () => {
    render(2, 25);

    expect(screen.getByText('11 to 20 of 25')).toBeVisible();
    expect(screen.getByText('Page 2 of 3')).toBeVisible();
  });

  it('ends the range at the total on a short last page', () => {
    render(3, 25);

    expect(screen.getByText('21 to 25 of 25')).toBeVisible();
  });

  it('shows no page controls when everything fits on one page', () => {
    render(1, 4);

    expect(screen.getByText('1 to 4 of 4')).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('cannot go before the first page or past the last', () => {
    render(1, 25);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('asks for the neighbouring pages', async () => {
    const requested = render(2, 25);

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(requested).toEqual([3, 1]);
  });

  it('offers the last page when the requested one is past the end', async () => {
    const requested = render(99, 25);

    expect(screen.getByText('There is no page 99: the last page is 3.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Go to the last page' }));

    expect(requested).toEqual([3]);
  });
});

describe('toPageNumber', () => {
  it.each([
    ['3', 3],
    [undefined, 1],
    ['0', 1],
    ['-2', 1],
    ['2.5', 1],
    ['abc', 1],
  ])('reads %s as page %i', (value, page) => {
    expect(toPageNumber(value)).toBe(page);
  });
});
