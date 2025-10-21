import React, { useState } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, BookOpen, Video, FileText } from 'lucide-react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I create a new listing?",
      answer: "To create a new listing, go to the 'Create Listing' page from the main navigation or dashboard. Fill in all the required information including title, description, price, and upload images. Make sure to select the appropriate category and subcategory for better visibility."
    },
    {
      id: 2,
      question: "How do I edit or delete my listings?",
      answer: "You can manage your listings from the 'My Listings' section in your dashboard. Click on the three-dot menu next to any listing to access edit, delete, publish/unpublish, or duplicate options."
    },
    {
      id: 3,
      question: "What's the difference between published and draft listings?",
      answer: "Published listings are visible to all users on the platform and can be found in search results. Draft listings are only visible to you and are not shown to other users. You can switch between these statuses anytime."
    },
    {
      id: 4,
      question: "How do I respond to customer messages?",
      answer: "Customer messages will appear in your dashboard notifications. You can also access all conversations through the chat interface. Make sure to respond promptly to maintain good customer relationships."
    },
    {
      id: 5,
      question: "How do I update my business profile?",
      answer: "Go to the 'Business Profile' section in your dashboard to update your business information, contact details, and verification status. Keep your profile up-to-date to build trust with customers."
    },
    {
      id: 6,
      question: "What payment methods are accepted?",
      answer: "We support various payment methods including credit cards, bank transfers, and digital wallets. Payment processing is handled securely through our integrated payment partners."
    },
    {
      id: 7,
      question: "How do I get my business verified?",
      answer: "To get your business verified, complete your business profile with accurate information and upload required documents. Our team will review your application and contact you with the results."
    },
    {
      id: 8,
      question: "Can I duplicate an existing listing?",
      answer: "Yes! You can duplicate any of your listings by clicking the 'Duplicate' option in the listing menu. This creates a copy with all the same information that you can then modify as needed."
    }
  ];

  const helpCategories = [
    {
      title: "Getting Started",
      icon: BookOpen,
      description: "Learn the basics of using our platform",
      articles: ["Creating your first listing", "Setting up your profile", "Understanding the dashboard"]
    },
    {
      title: "Managing Listings",
      icon: FileText,
      description: "Everything about creating and managing listings",
      articles: ["How to create listings", "Editing and updating listings", "Publishing and unpublishing"]
    },
    {
      title: "Customer Communication",
      icon: MessageCircle,
      description: "How to communicate with your customers",
      articles: ["Responding to messages", "Managing conversations", "Customer support best practices"]
    },
    {
      title: "Analytics & Insights",
      icon: HelpCircle,
      description: "Understanding your performance metrics",
      articles: ["Viewing analytics", "Understanding metrics", "Improving performance"]
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Help & Support" subtitle="Find answers and get assistance" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Help Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {helpCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="p-6 bg-white border border-gray-200 rounded-lg hover:border-brand transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <h4 className="font-semibold text-gray-800">{category.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <ul className="space-y-1">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex} className="text-sm text-gray-500">• {article}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-800">{faq.question}</h4>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-brand to-brand-dark rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Still need help?</h3>
          <p className="text-brand-light mb-6">Can't find what you're looking for? Our support team is here to help you succeed.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Email Support</h4>
                <p className="text-sm text-brand-light">support@easyislanders.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Phone Support</h4>
                <p className="text-sm text-brand-light">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold">Live Chat</h4>
                <p className="text-sm text-brand-light">Available 24/7</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/create-listing" className="p-4 bg-white border border-gray-200 rounded-lg hover:border-brand transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Create Listing</h4>
                  <p className="text-sm text-gray-600">Add a new listing</p>
                </div>
              </div>
            </a>
            
            <a href="/dashboard/my-listings" className="p-4 bg-white border border-gray-200 rounded-lg hover:border-brand transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">My Listings</h4>
                  <p className="text-sm text-gray-600">Manage your listings</p>
                </div>
              </div>
            </a>
            
            <a href="/dashboard/profile" className="p-4 bg-white border border-gray-200 rounded-lg hover:border-brand transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Business Profile</h4>
                  <p className="text-sm text-gray-600">Update your profile</p>
                </div>
              </div>
            </a>
            
            <a href="/dashboard/analytics" className="p-4 bg-white border border-gray-200 rounded-lg hover:border-brand transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Video className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Analytics</h4>
                  <p className="text-sm text-gray-600">View your performance</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
