import { useState } from 'react';
import { seedDatabase } from '../utils/seedData';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await seedDatabase();
      setResult(res);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Database Seeding</h1>
          <p className="text-gray-600 mb-6">
            Click the button below to populate the database with sample data. This will create:
          </p>

          <ul className="space-y-2 mb-8">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <span className="text-gray-700">1 Admin account (admin@evmarket.com / admin123)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <span className="text-gray-700">5 Member accounts (member123 for all)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <span className="text-gray-700">8 Sample listings (vehicles and batteries)</span>
            </li>
          </ul>

          <button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Seeding database...
              </>
            ) : (
              'Seed Database'
            )}
          </button>

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                )}
                <div>
                  <h3
                    className={`font-semibold ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.success ? 'Success!' : 'Error'}
                  </h3>
                  <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                    {result.success
                      ? 'Database seeded successfully! Check the console for login credentials.'
                      : `Error: ${result.error}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Note:</h3>
            <p className="text-sm text-blue-700">
              This will only create accounts if they don&apos;t already exist. Check your browser
              console for detailed output and login credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
