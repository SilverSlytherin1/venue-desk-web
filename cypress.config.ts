import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Override with CYPRESS_BASE_URL to run against another port or a deployed build.
    baseUrl: 'http://localhost:4200',
    video: false,
    // Wide enough for the staff sidebar; phone layouts set their own viewport.
    viewportWidth: 1280,
    viewportHeight: 800,
  },
});
