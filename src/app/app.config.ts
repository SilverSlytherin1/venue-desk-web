import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { API_BASE_URL } from './core/api/api-base-url';
import { problemInterceptor } from './core/api/problem-interceptor';
import { authInterceptor } from './core/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route and query parameters arrive as component inputs, so pages never subscribe to the route.
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    // Order matters: `problemInterceptor` sits closest to the network, so `authInterceptor`
    // already sees a typed `ApiProblem` when it looks for an ended session.
    provideHttpClient(withInterceptors([authInterceptor, problemInterceptor])),
    // Same origin in every environment: the dev server proxies it (proxy.conf.json) and
    // production is expected to do the same at the reverse proxy.
    { provide: API_BASE_URL, useValue: '/api/v1' },
  ],
};
