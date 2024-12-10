import React from 'react';
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import SearchBar from './common/SearchBar';
import NavLinks from './navigation/NavLinks';

export default function Layout() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSearch = (query: string) => {
    if (query) {
      setSearchParams({ search: query });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-indigo-600">VIT Lost & Found</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <SearchBar onSearch={handleSearch} />
              <NavLinks user={user} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}