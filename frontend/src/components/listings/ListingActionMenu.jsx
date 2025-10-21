import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, Edit2, Trash2, Eye, Copy, EyeOff
} from 'lucide-react';

const ListingActionMenu = ({
  listing,
  onEdit,
  onPublish,
  onDelete,
  onDuplicate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPublished = listing?.status === 'published';

  const handleAction = (action) => {
    action();
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: Edit2,
      label: 'Edit',
      onClick: () => handleAction(() => onEdit(listing)),
    },
    {
      icon: Eye,
      label: 'View',
      onClick: () => handleAction(() => window.open(`/listing/${listing.id}`, '_blank')),
    },
    {
      icon: isPublished ? EyeOff : Eye,
      label: isPublished ? 'Unpublish' : 'Publish',
      onClick: () => handleAction(() => onPublish(listing)),
    },
    {
      icon: Copy,
      label: 'Duplicate',
      onClick: () => handleAction(() => onDuplicate(listing)),
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: () => handleAction(() => onDelete(listing)),
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                  font-medium transition-colors border-b border-gray-100 last:border-b-0
                  text-gray-700 hover:bg-gray-50
                  ${item.className || ''}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListingActionMenu;
