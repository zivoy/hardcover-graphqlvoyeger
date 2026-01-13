import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getIntrospectionQuery } from 'graphql/utilities';

const query = getIntrospectionQuery();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = 'https://api.hardcover.app/v1/graphql';
const TOKEN = process.env.HARDCOVER_API_TOKEN;

if (!TOKEN) {
  console.error('Error: HARDCOVER_API_TOKEN environment variable is required.');
  process.exit(1);
}

async function fetchIntrospection() {
  console.log(`Fetching introspection from ${API_URL}...`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(response);
      throw new Error(`API responded with ${response.status}: ${text}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}`);
    }

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '../public');
    try {
      await fs.access(publicDir);
    } catch {
      await fs.mkdir(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, 'hardcover-introspection.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

    console.log(`Introspection schema saved to ${outputPath}`);
  } catch (error) {
    console.error('Failed to fetch introspection:', error);
    process.exit(1);
  }
}

fetchIntrospection();
