import { createContext, useContext } from 'react';

/**
 * Global application context.
 *
 * Currently empty — future useAuth, theming, feature flags, etc. live here.
 */
const AppContext = createContext({});

export function AppProvider({ children, value = {} }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

export default AppContext;
