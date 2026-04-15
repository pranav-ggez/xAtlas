import { createContext, useContext, useReducer, useEffect } from 'react';

const GalaxyContext = createContext();

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TOOLS':
      return { ...state, tools: action.payload };
    default:
      return state;
  }
}

export function GalaxyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { tools: [] });

  useEffect(() => {
    fetch('/api/tools')
      .then((res) => res.json())
      .then((data) => dispatch({ type: 'SET_TOOLS', payload: data }))
      .catch((err) => console.error("Failed to load tools:", err));
  }, []);

  return (
    <GalaxyContext.Provider value={{ state, dispatch }}>
      {children}
    </GalaxyContext.Provider>
  );
}

export const useGalaxy = () => useContext(GalaxyContext);