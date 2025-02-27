import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle-btn p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <i className="fas fa-sun text-2xl text-yellow-400"></i>
            ) : (
                <i className="fas fa-moon text-2xl text-gray-200"></i>
            )}
        </button>
    );
};

export default ThemeToggle; 