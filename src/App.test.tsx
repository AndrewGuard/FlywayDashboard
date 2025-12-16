import { render } from '@testing-library/react';
import App from './App';

test('renders Flyway Dashboard', () => {
  const { container } = render(<App />);
  expect(container).toBeInTheDocument();
});
