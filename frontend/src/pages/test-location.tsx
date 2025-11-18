import React from 'react';
import GeolocationTest from '@/components/GeolocationTest';

/**
 * Test page to verify geolocation functionality
 * Access this page at /test-location to verify the "Use My Location" button works
 */
export default function TestLocationPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Geolocation Functionality
          </h1>
          <p className="text-gray-600">
            Use this page to verify that the "Use My Location" button works correctly
          </p>
        </div>

        <div className="grid gap-8">
          <GeolocationTest />
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Common Issues & Solutions</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Permission Denied</h3>
                <p>Make sure to allow location access when prompted. Check your browser settings if you accidentally denied access.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Position Unavailable</h3>
                <p>Ensure your device has location services enabled and you're not in airplane mode.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Timeout</h3>
                <p>Try again in a few seconds. Sometimes GPS takes time to acquire a fix, especially indoors.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Browser Not Supported</h3>
                <p>Geolocation requires a modern browser with HTTPS (for production) or localhost (for development).</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Testing Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Open browser developer tools to see detailed console logs</li>
              <li>• Test on both desktop and mobile devices</li>
              <li>• Try different network conditions (WiFi vs cellular)</li>
              <li>• Check browser permissions in Settings → Privacy → Location</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}