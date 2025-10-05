import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NoPage from '../components/NoPage';

describe('NoPage Component', () => {
  it('renders 404 page', () => {
    render(
      <MemoryRouter>
        <NoPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
