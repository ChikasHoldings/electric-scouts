import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { validateZipCode } from "./compare/stateData";

export default function ValidatedZipInput({ 
  value, 
  onChange, 
  placeholder = "Enter ZIP code",
  className = "",
  showValidation = true,
  onValidationChange = null
}) {
  const [validationState, setValidationState] = useState(null);

  useEffect(() => {
    if (value.length === 5) {
      const validation = validateZipCode(value);
      setValidationState(validation);
      if (onValidationChange) {
        onValidationChange(validation.valid);
      }
    } else {
      setValidationState(null);
      if (onValidationChange) {
        onValidationChange(false);
      }
    }
  }, [value, onValidationChange]);

  const handleChange = (e) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 5);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 ${className}`}>
        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#0A5C8C] flex-shrink-0" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          maxLength={5}
          inputMode="numeric"
          className={`border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto font-semibold ${
            validationState?.valid === false && showValidation ? 'text-red-600' : 'text-gray-900'
          }`}
        />
        {showValidation && validationState && value.length === 5 && (
          <div className="flex-shrink-0">
            {validationState.valid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
        )}
      </div>
      {showValidation && validationState?.valid === false && value.length === 5 && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 whitespace-nowrap z-10">
          {validationState.error}
        </div>
      )}
    </div>
  );
}