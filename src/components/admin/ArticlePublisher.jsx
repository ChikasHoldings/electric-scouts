import React from "react";
import { Article } from "@/api/supabaseEntities";
import { notifyAfterArticlePublish } from "../seo/useAutoSitemapNotify";

/**
 * Article Publisher with Auto-Sitemap Notification
 * Use these functions for article CRUD operations with auto-sitemap notification
 */

// Create article and auto-notify search engines
export async function createArticle(articleData) {
  try {
    const article = await Article.create(articleData);
    
    // Auto-notify if published
    if (articleData.published !== false) {
      setTimeout(() => notifyAfterArticlePublish(), 1000);
    }
    
    return article;
  } catch (error) {
    console.error('Failed to create article:', error);
    throw error;
  }
}

// Update article and auto-notify if published
export async function updateArticle(articleId, updateData) {
  try {
    const article = await Article.update(articleId, updateData);
    
    // Auto-notify if just published
    if (updateData.published === true) {
      setTimeout(() => notifyAfterArticlePublish(), 1000);
    }
    
    return article;
  } catch (error) {
    console.error('Failed to update article:', error);
    throw error;
  }
}

// Bulk create with auto-notification
export async function bulkCreateArticles(articlesData) {
  try {
    const articles = await Article.bulkCreate(articlesData);
    
    const hasPublished = articlesData.some(a => a.published !== false);
    if (hasPublished) {
      setTimeout(() => notifyAfterArticlePublish(), 1000);
    }
    
    return articles;
  } catch (error) {
    console.error('Failed to bulk create articles:', error);
    throw error;
  }
}