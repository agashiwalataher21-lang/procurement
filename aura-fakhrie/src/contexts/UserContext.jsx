import React, { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('auraUser')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('auraUser', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('auraUser')
  }

  const register = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('auraUser', JSON.stringify(userData))
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}
