import { ApplicationRef, ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { screen, waitFor } from '@testing-library/dom';

import { RouteFocus } from './route-focus';

@Component({
  template: '<h1>List</h1><input aria-label="Search" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ListPage {}

@Component({ template: '<h1>Detail</h1>', changeDetection: ChangeDetectionStrategy.OnPush })
class DetailPage {}

@Component({
  imports: [RouteFocus, RouterOutlet],
  template: '<main appRouteFocus><router-outlet /></main>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Shell {}

describe('RouteFocus', () => {
  let router: Router;

  async function start(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'list', component: ListPage },
          { path: 'detail', component: DetailPage },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(Shell);
    await router.navigateByUrl(url);
    await fixture.whenStable();
  }

  it('leaves focus where the browser put it on the first page load', async () => {
    await start('/list');

    expect(document.body).toHaveFocus();
  });

  it('moves focus to the heading of the page that was navigated to', async () => {
    await start('/list');

    await router.navigateByUrl('/detail');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Detail' })).toHaveFocus();
    });
  });

  it('keeps focus on the control in use when only the query string changes', async () => {
    await start('/list');
    const search = screen.getByRole('textbox', { name: 'Search' });
    search.focus();

    await router.navigateByUrl('/list?q=lights');
    await router.navigateByUrl('/list?q=lights&page=2');
    // Let a wrongly scheduled focus move happen before checking that none did.
    await TestBed.inject(ApplicationRef).whenStable();

    expect(search).toHaveFocus();
  });
});
