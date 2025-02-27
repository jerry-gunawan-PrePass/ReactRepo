import { render, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
};
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
})) as unknown as (query: string) => MediaQueryList;

// Test component that uses the theme context
const TestComponent = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme-value">{theme}</span>
            <button onClick={toggleTheme} data-testid="toggle-button">
                Toggle
            </button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        document.documentElement.classList.remove('dark');
    });

    it('provides default light theme when no preference is saved', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null);
        (global.matchMedia as jest.Mock).mockImplementation(() => ({ matches: false }));

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(getByTestId('theme-value').textContent).toBe('light');
    });

    it('provides dark theme when system prefers dark mode', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null);
        (global.matchMedia as jest.Mock).mockImplementation(() => ({ matches: true }));

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(getByTestId('theme-value').textContent).toBe('dark');
    });

    it('uses theme from localStorage if available', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue('dark');

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(getByTestId('theme-value').textContent).toBe('dark');
    });

    it('toggles theme correctly', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue('light');

        const { getByTestId } = render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        const toggleButton = getByTestId('toggle-button');
        const themeValue = getByTestId('theme-value');

        expect(themeValue.textContent).toBe('light');

        act(() => {
            toggleButton.click();
        });

        expect(themeValue.textContent).toBe('dark');
        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('throws error when useTheme is used outside ThemeProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        expect(() => {
            render(<TestComponent />);
        }).toThrow('useTheme must be used within a ThemeProvider');

        consoleError.mockRestore();
    });
}); 