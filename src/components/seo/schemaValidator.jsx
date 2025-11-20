/**
 * Schema Validator
 * Validates structured data for common issues before rendering
 */

const REQUIRED_FIELDS = {
  Organization: ['@context', '@type', 'name'],
  BreadcrumbList: ['@context', '@type', 'itemListElement'],
  FAQPage: ['@context', '@type', 'mainEntity'],
  Product: ['@context', '@type', 'name', 'offers'],
  Article: ['@context', '@type', 'headline', 'author', 'publisher'],
  WebSite: ['@context', '@type', 'name', 'url'],
  Service: ['@context', '@type', 'serviceType', 'provider'],
  HowTo: ['@context', '@type', 'name', 'step'],
  ItemList: ['@context', '@type', 'itemListElement']
};

export function validateSchema(schema) {
  const errors = [];
  
  if (!schema) {
    errors.push('Schema is null or undefined');
    return { valid: false, errors };
  }

  // Check @context
  if (!schema['@context']) {
    errors.push('Missing @context property');
  } else if (schema['@context'] !== 'https://schema.org') {
    errors.push(`Invalid @context: ${schema['@context']}. Should be https://schema.org`);
  }

  // Check @type
  if (!schema['@type']) {
    errors.push('Missing @type property');
    return { valid: false, errors };
  }

  const schemaType = schema['@type'];
  const requiredFields = REQUIRED_FIELDS[schemaType];

  if (!requiredFields) {
    errors.push(`Unknown schema type: ${schemaType}`);
    return { valid: false, errors };
  }

  // Check required fields
  requiredFields.forEach(field => {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Type-specific validations
  switch (schemaType) {
    case 'BreadcrumbList':
      validateBreadcrumbList(schema, errors);
      break;
    case 'FAQPage':
      validateFAQPage(schema, errors);
      break;
    case 'Product':
      validateProduct(schema, errors);
      break;
    case 'Article':
      validateArticle(schema, errors);
      break;
    case 'Organization':
      validateOrganization(schema, errors);
      break;
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
}

function validateBreadcrumbList(schema, errors) {
  if (!Array.isArray(schema.itemListElement)) {
    errors.push('itemListElement must be an array');
    return;
  }

  schema.itemListElement.forEach((item, index) => {
    if (!item['@type'] || item['@type'] !== 'ListItem') {
      errors.push(`Item ${index}: Invalid @type for breadcrumb item`);
    }
    if (typeof item.position !== 'number') {
      errors.push(`Item ${index}: position must be a number`);
    }
    if (!item.name) {
      errors.push(`Item ${index}: Missing name`);
    }
  });
}

function validateFAQPage(schema, errors) {
  if (!Array.isArray(schema.mainEntity)) {
    errors.push('mainEntity must be an array');
    return;
  }

  schema.mainEntity.forEach((item, index) => {
    if (!item['@type'] || item['@type'] !== 'Question') {
      errors.push(`FAQ ${index}: Invalid @type (should be Question)`);
    }
    if (!item.name) {
      errors.push(`FAQ ${index}: Missing question name`);
    }
    if (!item.acceptedAnswer) {
      errors.push(`FAQ ${index}: Missing acceptedAnswer`);
    } else if (!item.acceptedAnswer.text) {
      errors.push(`FAQ ${index}: Missing answer text`);
    }
  });
}

function validateProduct(schema, errors) {
  if (!schema.offers) {
    errors.push('Product missing offers');
    return;
  }

  const offers = schema.offers;
  if (!offers['@type'] || offers['@type'] !== 'Offer') {
    errors.push('Offers must have @type: Offer');
  }
  if (typeof offers.price === 'undefined') {
    errors.push('Offer missing price');
  }
  if (!offers.priceCurrency) {
    errors.push('Offer missing priceCurrency');
  }
}

function validateArticle(schema, errors) {
  if (!schema.author) {
    errors.push('Article missing author');
  }
  if (!schema.publisher) {
    errors.push('Article missing publisher');
  } else if (!schema.publisher.logo) {
    errors.push('Publisher missing logo');
  }
  if (schema.datePublished && !isValidDate(schema.datePublished)) {
    errors.push('Invalid datePublished format');
  }
}

function validateOrganization(schema, errors) {
  if (!schema.url) {
    errors.push('Organization missing url');
  }
  if (schema.sameAs && !Array.isArray(schema.sameAs)) {
    errors.push('sameAs must be an array');
  }
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Test schema against Google's Rich Results Test
 * Returns a URL to test the schema
 */
export function getGoogleTestUrl(schema) {
  const encodedSchema = encodeURIComponent(JSON.stringify(schema, null, 2));
  return `https://search.google.com/test/rich-results?code=${encodedSchema}`;
}

/**
 * Validate multiple schemas at once
 */
export function validateMultipleSchemas(schemas) {
  const results = schemas.map((schema, index) => {
    const validation = validateSchema(schema);
    return {
      index,
      type: schema['@type'],
      ...validation
    };
  });

  return {
    valid: results.every(r => r.valid),
    results
  };
}

/**
 * Log validation results to console (development only)
 */
export function logValidationResults(schemas) {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('📊 Schema Validation Results');
  
  schemas.forEach((schema, index) => {
    const validation = validateSchema(schema);
    const icon = validation.valid ? '✅' : '❌';
    
    console.group(`${icon} Schema ${index + 1}: ${schema['@type']}`);
    
    if (validation.valid) {
      console.log('Valid schema');
      console.log('Test URL:', getGoogleTestUrl(schema));
    } else {
      console.error('Validation errors:', validation.errors);
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
}