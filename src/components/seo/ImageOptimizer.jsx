import React from "react";

/**
 * ImageOptimizer Component - Ensures all images have proper SEO attributes
 * 
 * Features:
 * - Automatic alt text generation based on context
 * - Lazy loading for performance
 * - Responsive image handling
 * - Proper width/height for CLS prevention
 * 
 * Usage:
 * <ImageOptimizer 
 *   src="image.jpg" 
 *   alt="Descriptive text"
 *   context="Texas electricity provider logo"
 *   width={400}
 *   height={300}
 * />
 */

export default function ImageOptimizer({
  src,
  alt,
  context = "",
  className = "",
  width,
  height,
  priority = false, // If true, loads immediately (for above-fold images)
  objectFit = "cover",
  ...props
}) {
  
  // Generate comprehensive alt text if not provided or too short
  const generateAltText = () => {
    if (alt && alt.length > 10) {
      return alt;
    }
    
    // Try to extract meaningful info from the URL
    const filename = src.split('/').pop().split('?')[0].split('.')[0];
    const cleanFilename = filename.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim();
    
    // Combine with context
    const baseAlt = alt || cleanFilename || "Image";
    return context ? `${baseAlt} - ${context}` : baseAlt;
  };
  
  const optimizedAlt = generateAltText();
  
  return (
    <img
      src={src}
      alt={optimizedAlt}
      className={className}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={{
        objectFit: objectFit,
        maxWidth: "100%",
        height: "auto"
      }}
      {...props}
    />
  );
}

// Provider logo component with SEO optimization
export function ProviderLogo({ 
  providerName, 
  logoUrl, 
  className = "h-8 w-auto",
  ...props 
}) {
  return (
    <ImageOptimizer
      src={logoUrl}
      alt={`${providerName} electricity provider logo - compare rates and plans`}
      context={`${providerName} energy company`}
      className={className}
      {...props}
    />
  );
}

// City/State image component with SEO optimization
export function LocationImage({ 
  location, 
  imageUrl, 
  type = "city",
  className = "w-full h-64 object-cover",
  ...props 
}) {
  return (
    <ImageOptimizer
      src={imageUrl}
      alt={`${location} ${type} skyline - electricity rates and energy plans available`}
      context={`${location} electricity service area`}
      className={className}
      objectFit="cover"
      {...props}
    />
  );
}

// Hero image component with priority loading
export function HeroImage({ 
  imageUrl, 
  alt, 
  className = "w-full h-full object-cover",
  ...props 
}) {
  return (
    <ImageOptimizer
      src={imageUrl}
      alt={alt || "Power Scouts - Compare electricity rates and save money"}
      context="Hero banner - electricity comparison service"
      className={className}
      priority={true} // Load immediately for LCP
      {...props}
    />
  );
}

// Icon image with proper alt text
export function IconImage({
  iconUrl,
  name,
  className = "w-6 h-6",
  ...props
}) {
  return (
    <ImageOptimizer
      src={iconUrl}
      alt={`${name} icon`}
      context="UI element"
      className={className}
      {...props}
    />
  );
}

// Utility function to validate and improve alt text
export const validateAltText = (alt, context = "") => {
  if (!alt || alt.trim().length === 0) {
    console.warn("Missing alt text for image");
    return context || "Image";
  }
  
  // Check for poor alt text patterns
  const badPatterns = [
    /^image$/i,
    /^img$/i,
    /^picture$/i,
    /^photo$/i,
    /^untitled$/i,
    /^\d+$/,
    /^[a-f0-9]{8,}$/i, // Hash-like strings
  ];
  
  const isPoorAlt = badPatterns.some(pattern => pattern.test(alt.trim()));
  
  if (isPoorAlt) {
    console.warn(`Poor alt text detected: "${alt}". Consider adding more descriptive text.`);
    return context ? `${alt} - ${context}` : alt;
  }
  
  // Alt text should be descriptive but not too long
  if (alt.length > 125) {
    console.warn(`Alt text is too long (${alt.length} chars). Consider shortening to under 125 characters.`);
  }
  
  return alt;
};

// Helper to generate alt text for electricity-related images
export const generateElectricityAlt = (type, location, provider = "") => {
  const templates = {
    "provider-logo": `${provider} electricity provider logo - compare rates and plans`,
    "city-skyline": `${location} skyline - electricity rates and energy providers available`,
    "state-map": `${location} state map showing electricity service areas and providers`,
    "plan-icon": `${type} electricity plan icon - rate comparison`,
    "renewable": `Renewable energy ${type} - green electricity plans`,
    "hero": `Compare electricity rates in ${location} - save money on energy bills`,
  };
  
  return templates[type] || `${location} electricity - ${type}`;
};