import { createContext, useContext, useCallback, useState } from 'react';

import { loadUsers } from '../utils/pineconeUserService';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [usersAll, setUsersAll] = useState([]);

  const refreshUsers = useCallback(async () => {
    const rows = await loadUsers();
    setUsersAll(rows);
    if (user) {
      const fresh = rows.find(r => r.id === user.id) || rows.find(r => r.email === user.email);
      if (fresh) setUser(fresh);
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setUsersAll([]);
  }, []);

  return (
    <UserContext.Provider value={{ user, usersAll, setUser, refreshUsers, logout }}>
      {children}
    </UserContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components */
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
};
