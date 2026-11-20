"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Shield,
  MoreHorizontal,
  Edit,
  Trash2,
  Save,
  X,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PURCHASE_MANAGER" | "ACCOUNTANT" | "STAFF";
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string;
  permissions: string[];
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["full_access", "manage_users", "manage_settings", "approve_po", "view_reports", "export_excel", "manage_inventory"],
  PURCHASE_MANAGER: ["create_po", "approve_po", "view_invoices", "manage_suppliers", "view_reports", "record_payments", "upload_docs"],
  ACCOUNTANT: ["view_invoices", "record_payments", "view_grn", "generate_reports", "export_excel", "view_po"],
  STAFF: ["view_po", "view_invoices", "view_grn", "upload_docs"],
};

export default function UsersPermissionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "STAFF" as string, status: "ACTIVE" as string });

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleUpdateRole = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: newRole as any,
              permissions: ROLE_PERMISSIONS[newRole] || [],
            }
          : u
      )
    );
    toast.success("User role updated successfully");
  };

  const handleUpdateStatus = (userId: string, newStatus: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus as any } : u))
    );
    toast.success("User status updated");
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted successfully");
    }
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Name and email are required");
      return;
    }

    const user: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any,
      status: newUser.status as any,
      lastLogin: "Never",
      permissions: ROLE_PERMISSIONS[newUser.role] || [],
    };

    setUsers([...users, user]);
    setShowAddModal(false);
    setNewUser({ name: "", email: "", role: "STAFF", status: "ACTIVE" });
    toast.success("New user created successfully");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "PURCHASE_MANAGER":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
      case "ACCOUNTANT":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Users & Permissions
          </h1>
          <p className="text-sm text-slate-500">
            Manage team access, assign roles, and configure permission levels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Users Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{users.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {users.filter((u) => u.status === "ACTIVE").length}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admins</p>
          <h3 className="text-2xl font-bold text-red-600 mt-1">
            {users.filter((u) => u.role === "ADMIN").length}
          </h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase Managers</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">
            {users.filter((u) => u.role === "PURCHASE_MANAGER").length}
          </h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Login</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${getRoleColor(user.role)}`}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="PURCHASE_MANAGER">Purchase Manager</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${getStatusColor(user.status)}`}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 3).map((perm) => (
                        <span key={perm} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono">
                          {perm.replace("_", " ")}
                        </span>
                      ))}
                      {user.permissions.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
                          +{user.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No users found matching your search
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add New User
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                >
                  <option value="STAFF">Staff (Read-only access)</option>
                  <option value="ACCOUNTANT">Accountant (Invoices & Payments)</option>
                  <option value="PURCHASE_MANAGER">Purchase Manager (PO & Suppliers)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Status
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newUser.status === "ACTIVE"}
                      onChange={() => setNewUser({ ...newUser, status: "ACTIVE" })}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newUser.status === "INACTIVE"}
                      onChange={() => setNewUser({ ...newUser, status: "INACTIVE" })}
                      className="text-slate-400"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Inactive</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
