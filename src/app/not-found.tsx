import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <Link 
        href="/"
        className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
} 