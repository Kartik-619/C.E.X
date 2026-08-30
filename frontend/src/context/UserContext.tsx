import React, { createContext, useContext, ReactNode } from "react";

export const UserContext = createContext<{
  userId: string | null;
  setUserId: (id: string) => void;
} | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = React.useState<string | null>(null);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
