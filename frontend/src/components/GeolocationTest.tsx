import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Test component for geolocation functionality
 * This component helps verify that the "Use My Location" button works correctly
 */
export const GeolocationTest: React.FC = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  const checkPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(result.state);
        return result.state;
      } catch (e) {
        console.warn('Permissions API not available:', e);
        setPermissionStatus('unknown');
        return 'unknown';
      }
    }
    return 'unknown';
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check permission first
      const permission = await checkPermission();
      if (permission === 'denied') {
        setError('Location access is denied. Please enable location permissions in your browser settings.');
        setLoading(false);
        return;
      }

      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setError('Geolocation is not supported by this browser.');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location obtained successfully:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString()
          });
          
          setLocation(position);
          setLoading(false);
        },
        (err) => {
          console.error('❌ Geolocation error:', err);
          let errorMessage = 'Could not get your current location.';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. Please allow location access and try again.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your device settings.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting your location.';
          }
          
          setError(errorMessage);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        }
      );
    } catch (e) {
      console.error('Unexpected error:', e);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        Geolocation Test
      </h3>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">Permission Status: 
            <span className={`font-medium ${
              permissionStatus === 'granted' ? 'text-green-600' :
              permissionStatus === 'denied' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {permissionStatus}
            </span>
          </p>
        </div>

        <Button
          onClick={getCurrentLocation}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              Getting Location...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Test My Location
            </>
          )}
        </Button>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {location && (
          <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Location Found!</span>
            </div>
            <div className="space-y-1 text-xs">
              <p><strong>Latitude:</strong> {location.coords.latitude.toFixed(6)}</p>
              <p><strong>Longitude:</strong> {location.coords.longitude.toFixed(6)}</p>
              <p><strong>Accuracy:</strong> ±{Math.round(location.coords.accuracy)} meters</p>
              <p><strong>Timestamp:</strong> {new Date(location.timestamp).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>How to test:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Click "Test My Location" button</li>
            <li>Allow location access when prompted</li>
            <li>Check browser console for detailed logs</li>
            <li>If denied, enable permissions in browser settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GeolocationTest;