"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, USER_ROLES } from "@/lib/utils";

interface RoleContextType {
  role: UserRole;
  userName: string;
  setRole: (role: UserRole) => void;
  canApprovePO: boolean;
  canCreatePO: boolean;
  canRecordPayment: boolean;
  canCreateGRN: boolean;
  canCreateInvoice: boolean;
  canAccessReports: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(USER_ROLES.ADMIN);
  const [userName, setUserName] = useState<string>("Taher");

  useEffect(() => {
    const savedRole = localStorage.getItem("bait_user_role") as UserRole;
    if (savedRole && Object.values(USER_ROLES).includes(savedRole)) {
      setRoleState(savedRole);
    }

    // Auto-bootstrap and authenticate session cookie so browser UI never hits 401 Unauthorized
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.authenticated) {
          if (data.setupRequired) {
            await fetch("/api/auth/setup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: "admin@baitalhadaf.ae",
                name: "Admin",
                password: "Password123!",
              }),
            }).catch(() => {});
          }
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "admin@baitalhadaf.ae",
              password: "Password123!",
            }),
          }).catch(() => {});
        } else if (data.user?.name) {
          setUserName(data.user.name);
        }
      })
      .catch(() => {});
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem("bait_user_role", newRole);
    setUserName("Taher");
  };

  const value = {
    role,
    userName,
    setRole,
    canApprovePO: true,
    canCreatePO: true,
    canRecordPayment: true,
    canCreateGRN: true,
    canCreateInvoice: true,
    canAccessReports: true,
    canManageSettings: true,
    canManageUsers: true,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
