/**
 * KeyboardShortcuts Component
 *
 * Global keyboard shortcuts and help modal for power users
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

export interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'filters' | 'general';
}

interface KeyboardShortcutsProps {
  shortcuts: Shortcut[];
  disabled?: boolean;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  disabled = false,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: allow '?' to open help even in input fields
        if (event.key === '?' && event.shiftKey) {
          event.preventDefault();
          setShowHelp(true);
        }
        return;
      }

      // Check for shortcut matches
      const matchedShortcut = shortcuts.find((shortcut) => {
        // Handle special keys
        if (shortcut.key === 'escape') return event.key === 'Escape';
        if (shortcut.key === '?') return event.key === '?' && event.shiftKey;

        // Handle single character shortcuts
        return event.key.toLowerCase() === shortcut.key.toLowerCase();
      });

      if (matchedShortcut) {
        event.preventDefault();
        matchedShortcut.action();
      }
    },
    [shortcuts, disabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    filters: 'Filters',
    general: 'General',
  };

  const categoryOrder: Array<Shortcut['category']> = [
    'navigation',
    'filters',
    'actions',
    'general',
  ];

  const formatKey = (key: string): string => {
    if (key === 'escape') return 'Esc';
    if (key === '?') return '?';
    return key.toUpperCase();
  };

  return (
    <>
      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate and perform actions quickly
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {categoryOrder.map((category) => {
              const categoryShortcuts = groupedShortcuts[category];
              if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    {categoryLabels[category]}
                  </h3>
                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-sm text-slate-600">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded">
                          {formatKey(shortcut.key)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">
              <strong>Tip:</strong> Press{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-white border border-slate-300 rounded">
                ?
              </kbd>{' '}
              anytime to view this help dialog
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Default shortcuts for the portfolio page
 */
export const DEFAULT_SHORTCUTS: Omit<Shortcut, 'action'>[] = [
  {
    key: '/',
    description: 'Focus search',
    category: 'navigation',
  },
  {
    key: 'l',
    description: 'Go to Listings',
    category: 'navigation',
  },
  {
    key: 'o',
    description: 'Go to Overview',
    category: 'navigation',
  },
  {
    key: 'a',
    description: 'Go to Analytics',
    category: 'navigation',
  },
  {
    key: 'n',
    description: 'New listing',
    category: 'actions',
  },
  {
    key: 'b',
    description: 'Toggle bulk select',
    category: 'actions',
  },
  {
    key: 'e',
    description: 'Export',
    category: 'actions',
  },
  {
    key: '1',
    description: 'Filter: All listings',
    category: 'filters',
  },
  {
    key: '2',
    description: 'Filter: Needs attention',
    category: 'filters',
  },
  {
    key: '3',
    description: 'Filter: High performers',
    category: 'filters',
  },
  {
    key: 'escape',
    description: 'Clear selection / Close dialogs',
    category: 'general',
  },
  {
    key: '?',
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
];

/**
 * Example usage:
 *
 * const shortcuts: Shortcut[] = DEFAULT_SHORTCUTS.map((shortcut) => ({
 *   ...shortcut,
 *   action: () => {
 *     switch (shortcut.key) {
 *       case '/':
 *         searchInputRef.current?.focus();
 *         break;
 *       case 'l':
 *         setActiveTab('listings');
 *         break;
 *       case 'n':
 *         handleAddListing();
 *         break;
 *       // ... handle other shortcuts
 *     }
 *   },
 * }));
 *
 * <KeyboardShortcuts shortcuts={shortcuts} />
 */
