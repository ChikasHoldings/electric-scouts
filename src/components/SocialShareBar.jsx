import { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, Mail, Link, Check } from 'lucide-react';

export default function SocialShareBar({ title, url, description, compact = false }) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || window.location.href;
  const shareTitle = encodeURIComponent(title || document.title);
  const shareDesc = encodeURIComponent(description || '');
  
  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${shareTitle}`,
      color: 'hover:bg-blue-600 hover:text-white',
      bgColor: 'bg-blue-50 text-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${shareTitle}&via=electricscouts`,
      color: 'hover:bg-sky-500 hover:text-white',
      bgColor: 'bg-sky-50 text-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-blue-700 hover:text-white',
      bgColor: 'bg-blue-50 text-blue-700'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${shareTitle}&body=${shareDesc}%0A%0A${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-gray-700 hover:text-white',
      bgColor: 'bg-gray-100 text-gray-600'
    }
  ];
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-gray-400" />
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${link.name}`}
            className={`p-1.5 rounded-full transition-all duration-200 ${link.bgColor} ${link.color}`}
            aria-label={`Share on ${link.name}`}
          >
            <link.icon className="w-3.5 h-3.5" />
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          title="Copy link"
          className={`p-1.5 rounded-full transition-all duration-200 ${copied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          aria-label="Copy link to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }
  
  return (
    <div className="border-t border-b border-gray-200 py-4 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Share2 className="w-4 h-4" />
          <span className="font-medium">Share this article</span>
        </div>
        <div className="flex items-center gap-2">
          {shareLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Share on ${link.name}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${link.bgColor} ${link.color}`}
              aria-label={`Share on ${link.name}`}
            >
              <link.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{link.name}</span>
            </a>
          ))}
          <button
            onClick={handleCopyLink}
            title="Copy link"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${copied ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            aria-label="Copy link to clipboard"
          >
            {copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
