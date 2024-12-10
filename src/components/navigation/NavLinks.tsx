import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, LogOut, HandshakeIcon } from 'lucide-react';
import { User as UserType } from '../../types';

interface NavLinksProps {
  user: UserType | null;
  onSignOut: () => void;
}

export default function NavLinks({ user, onSignOut }: NavLinksProps) {
  return (
    <div className="flex items-center space-x-4">
      <Link
        to="/settledowns"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
      >
        <HandshakeIcon className="h-4 w-4 mr-2" />
        Settle Downs
      </Link>
      
      {user ? (
        <>
          <Link to="/notifications" className="p-2 rounded-full hover:bg-gray-100 relative">
            <Bell className="h-6 w-6 text-gray-600" />
          </Link>
          <Link to="/profile" className="p-2 rounded-full hover:bg-gray-100">
            <User className="h-6 w-6 text-gray-600" />
          </Link>
          <button
            onClick={onSignOut}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <LogOut className="h-6 w-6 text-gray-600" />
          </button>
        </>
      ) : (
        <div className="space-x-4">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}