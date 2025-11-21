import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { pingAllSearchEngines, notifySearchEnginesOfUpdate } from "../seo/SitemapManager";

/**
 * Sitemap Notifier Component
 * Manual trigger to ping search engines about sitemap updates
 */
export default function SitemapNotifier() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleNotify = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const notifyResults = await notifySearchEnginesOfUpdate();
      setResults(notifyResults);
    } catch (error) {
      console.error('Notification error:', error);
      setResults({ error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Notify Search Engines
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Ping Google and Bing to notify them of sitemap updates. Use this after publishing new articles or making significant content changes.
            </p>
            
            <Button
              onClick={handleNotify}
              disabled={loading}
              className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Notifying...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Ping Search Engines
                </>
              )}
            </Button>

            {/* Results */}
            {results && (
              <div className="mt-4 space-y-2">
                {results.google && (
                  <div className="flex items-center gap-2 text-sm">
                    {results.google.success ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Google notified successfully</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-gray-700">Google notification failed</span>
                      </>
                    )}
                  </div>
                )}
                
                {results.bing && (
                  <div className="flex items-center gap-2 text-sm">
                    {results.bing.success ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Bing notified successfully</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-gray-700">Bing notification failed</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}