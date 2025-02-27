import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock localStorage
const getItemMock = jest.fn();
const setItemMock = jest.fn();
const clearMock = jest.fn();

const localStorageMock = {
    getItem: getItemMock,
    setItem: setItemMock,
    clear: clearMock
};

// Cast the mock functions to the correct Jest mock type
global.localStorage = localStorageMock as unknown as Storage;

// Mock matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
}));

describe('ThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows sun icon in light mode', () => {
        getItemMock.mockReturnValue('light');
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );
        expect(screen.getByRole('button').querySelector('.fa-sun')).toBeInTheDocument();
    });

    it('shows moon icon in dark mode', () => {
        getItemMock.mockReturnValue('dark');
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );
        expect(screen.getByRole('button').querySelector('.fa-moon')).toBeInTheDocument();
    });

    it('toggles theme when clicked', () => {
        getItemMock.mockReturnValue('light');
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // After click, should show moon icon (dark mode)
        expect(button.querySelector('.fa-moon')).toBeInTheDocument();
        expect(setItemMock).toHaveBeenCalledWith('theme', 'dark');
    });

    it('maintains accessibility features', () => {
        render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        );
        
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Toggle theme');
    });
}); 