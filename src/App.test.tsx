import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders Flyway Dashboard', () => {
  render(<App />);
  expect(document.body).toBeTruthy();
});
