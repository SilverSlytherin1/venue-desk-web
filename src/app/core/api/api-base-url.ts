import { InjectionToken } from '@angular/core';

/** Root of the versioned API, without a trailing slash. Provided in `app.config.ts`. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
