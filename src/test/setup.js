import "@testing-library/jest-dom/vitest";

const originalGetComputedStyle = window.getComputedStyle;

window.getComputedStyle = (element) => originalGetComputedStyle(element);

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
