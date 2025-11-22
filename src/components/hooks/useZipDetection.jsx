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
      // Using ipapi.co for geolocation
      const response = await fetch('https://ipapi.co/json/');
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
      console.log('ZIP detection unavailable');
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