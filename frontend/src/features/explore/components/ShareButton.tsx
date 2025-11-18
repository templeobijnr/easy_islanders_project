/**
 * ShareButton - Share listing via social media, email, or copy link
 * Provides dropdown menu with multiple sharing options
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Facebook,
  Twitter,
  Mail,
  Link2,
  Check,
  MessageCircle,
  Copy,
} from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const shareOptions = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'hover:bg-blue-50',
      onClick: () => {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      },
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'text-sky-500',
      bgColor: 'hover:bg-sky-50',
      onClick: () => {
        const text = `${title}${description ? ' - ' + description : ''}`;
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      },
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'hover:bg-green-50',
      onClick: () => {
        const text = `${title} - ${url}`;
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        setIsOpen(false);
      },
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      color: 'text-slate-600',
      bgColor: 'hover:bg-slate-50',
      onClick: () => {
        const subject = `Check out: ${title}`;
        const body = `${description ? description + '\n\n' : ''}${url}`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
        setIsOpen(false);
      },
    },
    {
      id: 'copy',
      name: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />,
      color: copied ? 'text-lime-600' : 'text-slate-600',
      bgColor: copied ? 'bg-lime-50' : 'hover:bg-slate-50',
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
            setIsOpen(false);
          }, 1500);
        } catch (error) {
          console.error('Failed to copy link:', error);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
            setIsOpen(false);
          }, 1500);
        }
      },
    },
  ];

  // Try native Web Share API first (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred, fall back to custom share menu
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          setIsOpen(true);
        }
      }
    } else {
      // No native share, show custom menu
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Share Button */}
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-xl text-slate-700 font-medium hover:border-lime-600 hover:text-lime-600 hover:bg-lime-50 transition-all shadow-sm"
        title="Share this listing"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden md:inline">Share</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-xl z-50 overflow-hidden">
          <div className="p-2">
            {/* Header */}
            <div className="px-3 py-2 mb-1">
              <h4 className="text-sm font-semibold text-slate-900">Share this listing</h4>
            </div>

            {/* Share Options */}
            <div className="space-y-1">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${option.bgColor}`}
                >
                  <div className={option.color}>{option.icon}</div>
                  <span className={`text-sm font-medium ${option.color}`}>{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
