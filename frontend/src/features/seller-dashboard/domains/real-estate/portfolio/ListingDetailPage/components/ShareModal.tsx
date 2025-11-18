/**
 * ShareModal - Property sharing modal for listing detail page
 * Provides multiple sharing options including social media and copy link
 */

import React, { useState } from 'react';
import { X, Copy, Check, Mail, MessageCircle, Facebook, Twitter, Link2, Share2 } from 'lucide-react';

interface ShareModalProps {
  listing: {
    id?: number;
    title: string;
    description: string;
    base_price: string;
    currency: string;
    price_period?: string;
    city?: string;
    area?: string;
    image_urls?: string[];
    reference_code?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ listing, isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  if (!isOpen || !listing) return null;

  const getPriceDisplay = () => {
    const price = `${listing.currency} ${listing.base_price}`;
    if (listing.price_period === 'PER_DAY') return `${price}/night`;
    if (listing.price_period === 'PER_MONTH') return `${price}/month`;
    return price;
  };

  const getListingUrl = () => {
    return `${window.location.origin}/listings/${listing.id}`;
  };

  const getShareMessage = () => {
    const location = listing.city ? `${listing.city}${listing.area ? `, ${listing.area}` : ''}` : '';
    return `Check out this property: ${listing.title}${location ? ` in ${location}` : ''} - ${getPriceDisplay()}`;
  };

  const copyToClipboard = async (text: string, type: 'link' | 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareOnSocial = (platform: string) => {
    const url = getListingUrl();
    const message = getShareMessage();
    const encodedUrl = encodeURIComponent(url);
    const encodedMessage = encodeURIComponent(message);

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage}%20${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Property Listing: ${listing.title}&body=${encodedMessage}%0A%0A${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <Share2 className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Share Property</h2>
              <p className="text-sm text-slate-600">{listing.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Property Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex gap-3">
              {listing.image_urls?.[0] ? (
                <img
                  src={listing.image_urls[0]}
                  alt={listing.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center text-slate-500">
                  <Link2 className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 truncate">{listing.title}</h3>
                <p className="text-sm text-slate-600">{getPriceDisplay()}</p>
                {listing.city && (
                  <p className="text-xs text-slate-500">{listing.city}{listing.area && `, ${listing.area}`}</p>
                )}
              </div>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900">Share Link</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={getListingUrl()}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
              />
              <button
                onClick={() => copyToClipboard(getListingUrl(), 'link')}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Copy Message Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900">Share Message</h3>
            <div className="flex gap-2">
              <textarea
                value={getShareMessage()}
                readOnly
                rows={3}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50 text-slate-700 resize-none"
              />
              <button
                onClick={() => copyToClipboard(getShareMessage(), 'message')}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
              >
                {copiedMessage ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedMessage ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Media Sharing */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900">Share on Social Media</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareOnSocial('facebook')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </button>
              <button
                onClick={() => shareOnSocial('twitter')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </button>
              <button
                onClick={() => shareOnSocial('whatsapp')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
              <button
                onClick={() => shareOnSocial('email')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Reference: {listing.reference_code || 'N/A'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;