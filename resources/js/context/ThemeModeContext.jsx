import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getAppTheme } from '../theme/theme';

const ThemeModeContext = createContext({
    mode: 'light',
    toggleThemeMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('themeMode') || 'light';
    });

    const toggleThemeMode = () => {
        setMode((prev) => {
            const nextMode = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', nextMode);
            return nextMode;
        });
    };

    const theme = useMemo(() => getAppTheme(mode), [mode]);

    return (
        <ThemeModeContext.Provider value={{ mode, toggleThemeMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeModeContext.Provider>
    );
};
