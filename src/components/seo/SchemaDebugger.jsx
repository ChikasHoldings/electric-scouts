import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { validateSchema, getGoogleTestUrl } from "./schemaValidator";

/**
 * Schema Debugger Component
 * Only visible in development mode
 * Shows validation results and testing links for structured data
 */
export default function SchemaDebugger() {
  const [schemas, setSchemas] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Find all JSON-LD scripts on the page
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const foundSchemas = [];

    schemaScripts.forEach((script) => {
      try {
        const schema = JSON.parse(script.textContent);
        const validation = validateSchema(schema);
        foundSchemas.push({
          schema,
          validation
        });
      } catch (e) {
        console.error('Failed to parse schema:', e);
      }
    });

    setSchemas(foundSchemas);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') return null;

  const copySchema = (schema) => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 text-sm font-semibold"
      >
        📊 Schema Debugger ({schemas.length})
      </button>

      {/* Debugger Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Structured Data Debugger</h2>
                <p className="text-sm text-purple-100">Development Mode Only</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg px-3 py-1"
              >
                ✕
              </button>
            </div>

            <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
              {schemas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No schemas found on this page</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schemas.map((item, index) => {
                    const { schema, validation } = item;
                    const isValid = validation.valid;

                    return (
                      <Card key={index} className={`border-2 ${isValid ? 'border-green-200' : 'border-red-200'}`}>
                        <CardContent className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {isValid ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                              )}
                              <div>
                                <h3 className="font-bold text-gray-900">{schema['@type']}</h3>
                                <p className="text-sm text-gray-600">
                                  {isValid ? 'Valid Schema' : `${validation.errors.length} issues found`}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copySchema(schema)}
                                className="text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <a
                                href={getGoogleTestUrl(schema)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="outline" className="text-xs">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Test
                                </Button>
                              </a>
                            </div>
                          </div>

                          {/* Validation Errors */}
                          {!isValid && (
                            <div className="mb-3 p-3 bg-red-50 rounded-lg">
                              <p className="text-sm font-semibold text-red-900 mb-2">Issues:</p>
                              <ul className="text-sm text-red-700 space-y-1">
                                {validation.errors.map((error, i) => (
                                  <li key={i}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Schema Preview */}
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                              View Schema
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                              {JSON.stringify(schema, null, 2)}
                            </pre>
                          </details>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {schemas.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Summary</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Schemas:</span>
                      <span className="ml-2 font-bold">{schemas.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valid:</span>
                      <span className="ml-2 font-bold text-green-600">
                        {schemas.filter(s => s.validation.valid).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Issues:</span>
                      <span className="ml-2 font-bold text-red-600">
                        {schemas.filter(s => !s.validation.valid).length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}