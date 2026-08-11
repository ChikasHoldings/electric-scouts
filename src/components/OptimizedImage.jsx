import { useState, useEffect, useRef } from "react";

const FALLBACK_IMAGE = "/images/placeholder.jpg";

export default function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  loading = "lazy",
  fallback = FALLBACK_IMAGE,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef(null);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoaded(false);
    
    const img = imgRef.current;
    if (!img) return;

    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (!hasError && fallback) {
      setHasError(true);
      setCurrentSrc(fallback);
    }
  };

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={`${className} ${isLoaded ? 'loaded' : ''} transition-opacity duration-300`}
      style={{ opacity: isLoaded ? 1 : 0.3 }}
      {...props}
    />
  );
}
