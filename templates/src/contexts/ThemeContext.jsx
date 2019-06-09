import React from 'react';
import { ThemeProvider } from 'styled-components';
import PropTypes from 'prop-types';
import { theme1, theme2 } from '../theme/globalStyle';

const ThemeContext = React.createContext();

const Theme = ({ children }) => {
  const [theme, setTheme] = React.useState(theme1);

  const toggleTheme = (e) => {
    const themeToSet = e.target.value;
    if (themeToSet === 'theme1') {
      setTheme(theme1);
    }
    setTheme(theme2);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

Theme.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTheme = () => React.useContext(ThemeContext);

export default Theme;
