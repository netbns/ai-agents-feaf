export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-lg text-gray-600 mt-2">Page not found</p>
        <a
          href="/boards"
          className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Go to Boards
        </a>
      </div>
    </div>
  );
}
