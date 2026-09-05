import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [compact, setCompact] = useState(() => {
    return localStorage.getItem('artist-nav-compact') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('artist-nav-compact', compact);
  }, [compact]);

  return (
    <SidebarContext.Provider value={{ compact, setCompact }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
