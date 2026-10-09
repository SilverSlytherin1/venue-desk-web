import '@testing-library/jest-dom/vitest';

// jsdom ships the <dialog> element without its methods. These stand-ins keep the two things the
// app relies on: the `open` state and the `close` event.
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement, returnValue?: string) {
  if (returnValue !== undefined) this.returnValue = returnValue;
  this.open = false;
  this.dispatchEvent(new Event('close'));
};

afterEach(() => {
  sessionStorage.clear();
});
