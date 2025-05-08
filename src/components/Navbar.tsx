'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg width="32" height="32" viewBox="0 0 648 216" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H216V108C216 167.647 167.647 216 108 216C48.3533 216 0 167.647 0 108V0Z" fill="black"/>
                <path d="M216 108C216 48.3532 264.353 0 324 0C383.647 0 432 48.3532 432 108C432 167.647 383.647 216 324 216H216V108Z" fill="black"/>
                <path d="M432 0H540C599.647 0 648 48.3532 648 108C648 167.647 599.647 216 540 216C480.353 216 432 167.647 432 108V0Z" fill="black"/>
              </svg>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isHomePage ? (
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Admin Panel
              </Link>
            ) : isAdminPage ? (
              <>
                <Link
                  href="/admin/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Project
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to overview
                </Link>
              </>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to overview
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 