// Mock localStorage
const storageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    getAllKeys: jest.fn(() => Object.keys(store))
  };
})();

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: storageMock
});

// Reset mocks and storage before each test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
}); 