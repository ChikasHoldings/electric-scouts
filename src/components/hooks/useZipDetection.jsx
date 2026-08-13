import { useState, useEffect } from 'react';
import { validateZipCode } from '../compare/stateData';

export function useZipDetection() {
  const [detectedZip, setDetectedZip] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const savedZip = localStorage.getItem('userZipCode');
    if (savedZip && savedZip.length === 5) {
      const validation = validateZipCode(savedZip);
      if (validation.valid) {
        setDetectedZip(savedZip);
        return;
      }
    }

    // Try to detect ZIP from IP
    detectZipFromIP();
  }, []);

  const detectZipFromIP = async () => {
    setIsDetecting(true);
    try {
      // Using ipapi.co for geolocation. A failure here is not an error the
      // visitor should ever see — they simply type their ZIP, which most do
      // anyway — but it is not nothing either: this call is rate-limited, and
      // an ad blocker or a changed response shape breaks it silently. The catch
      // stays graceful and logs the reason so the failure is diagnosable.
      const response = await fetch('https://ipapi.co/json/');

      // Without this, a 429 body parses as JSON, carries no `postal`, and is
      // indistinguishable from a visitor whose IP simply has no ZIP.
      if (!response.ok) {
        console.warn(`ZIP geolocation unavailable: HTTP ${response.status}`);
        return;
      }

      const data = await response.json();

      if (data.postal) {
        const zip = data.postal.split('-')[0]; // Handle ZIP+4 format
        const validation = validateZipCode(zip);
        if (validation.valid) {
          setDetectedZip(zip);
          saveZip(zip);
        }
      }
    } catch (error) {
      console.warn('ZIP geolocation failed:', error.message);
    } finally {
      setIsDetecting(false);
    }
  };

  const saveZip = (zip) => {
    if (zip && zip.length === 5) {
      localStorage.setItem('userZipCode', zip);
      setDetectedZip(zip);
    }
  };

  const clearZip = () => {
    localStorage.removeItem('userZipCode');
    setDetectedZip('');
  };

  return {
    detectedZip,
    isDetecting,
    saveZip,
    clearZip
  };
}