import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function InArticleCTA() {
  return (
    <div className="in-article-cta-wrapper my-12">
      <div className="in-article-cta-box">
        <h3 className="in-article-cta-title">Compare Rates the Easy Way</h3>
        <p className="in-article-cta-text">
          Our free tool shows total costs at your exact usage, including all fees and TDU charges.
        </p>
        <Link to={createPageUrl("CompareRates")}>
          <Button className="in-article-cta-button">
            Compare Rates Now
          </Button>
        </Link>
      </div>
    </div>
  );
}