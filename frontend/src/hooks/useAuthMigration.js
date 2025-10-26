import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

/**
 * useAuthMigration Hook
 * 
 * Migrates legacy localStorage data to persistent backend storage:
 * - Conversation history
 * - User preferences (language, theme)
 * - Auth tokens (removes from localStorage, uses secure cookies)
 * 
 * Runs once on app initialization if legacy data is detected.
 * 
 * Usage:
 * const { isMigrating, migrationComplete, migrationError } = useAuthMigration(isAuthenticated);
 */
export const useAuthMigration = (isAuthenticated) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationError, setMigrationError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || migrationComplete) {
      return;
    }

    const performMigration = async () => {
      // Check for legacy data
      const legacyMessages = localStorage.getItem('messages');
      const legacyLanguage = localStorage.getItem('language');
      const legacyTheme = localStorage.getItem('isDark');
      const legacyToken = localStorage.getItem('token');

      // If no legacy data found, skip migration
      if (!legacyMessages && !legacyLanguage && !legacyTheme && !legacyToken) {
        console.log('✅ No legacy data to migrate');
        setMigrationComplete(true);
        return;
      }

      console.log('🔄 Legacy data detected, starting migration...');
      setIsMigrating(true);

      try {
        // Send legacy data to backend for ingestion
        const response = await axios.post(
          `${config.API_BASE_URL}/api/migrate-legacy-data/`,
          {
            messages: legacyMessages ? JSON.parse(legacyMessages) : null,
            language: legacyLanguage,
            theme: legacyTheme === 'true',
          },
          { withCredentials: true }
        );

        console.log('✅ Migration response:', response.data);

        // Clear old localStorage data after successful migration
        if (legacyMessages) {
          localStorage.removeItem('messages');
          console.log('  ✓ Cleared legacy messages');
        }
        if (legacyLanguage) {
          localStorage.removeItem('language');
          console.log('  ✓ Cleared legacy language');
        }
        if (legacyTheme) {
          localStorage.removeItem('isDark');
          console.log('  ✓ Cleared legacy theme');
        }

        // Remove token from localStorage (now in secure cookie)
        if (legacyToken) {
          localStorage.removeItem('token');
          console.log('  ✓ Removed token from localStorage (now in secure cookie)');
        }

        console.log('✅ Legacy data migration completed successfully');
        setMigrationComplete(true);
      } catch (error) {
        console.error('❌ Migration error:', error);
        setMigrationError(
          error.response?.data?.message || 'Migration encountered an issue'
        );
        // Silently fail; old data remains as fallback and won't block app
        setMigrationComplete(true); // Mark as complete to not retry
      } finally {
        setIsMigrating(false);
      }
    };

    performMigration();
  }, [isAuthenticated, migrationComplete]);

  return {
    isMigrating,
    migrationComplete,
    migrationError,
  };
};

export default useAuthMigration;

