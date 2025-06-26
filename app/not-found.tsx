import Link from 'next/link';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-lg text-gray-300 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="inline-block px-6 py-3 bg-white text-purple-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
} 