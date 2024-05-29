import { JS_EXTENSIONS } from './constants.js';

// Utility functions for the extension
function isValidJsFile(url) {
  return JS_EXTENSIONS.some(ext => url.endsWith(`.${ext}`));
}

function fetchAndAnalyzeScript(url) {
  return fetch(url)
    .then(response => response.text())
    .then(data => {
      return analyzeScript(data, url);
    })
    .catch(error => console.error(`Error fetching script: ${url}`, error));
}

function analyzeScript(scriptContent, scriptUrl) {
  let results = [];
  
  // Regex patterns for detecting API endpoints
  const apiRegex = /\b(GET|POST|PUT|DELETE|PATCH)\s+(https?:\/\/[^\s'"]+)/gi;
  let match;
  while (match = apiRegex.exec(scriptContent)) {
    results.push({
      type: 'API Endpoint',
      method: match[1],
      value: match[2],
      script: scriptUrl
    });
  }

  // Detecting JWT tokens
  const jwtRegex = /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
  while (match = jwtRegex.exec(scriptContent)) {
    results.push({
      type: 'Token',
      value: match[0],
      script: scriptUrl
    });
  }

  // Additional patterns can be added here
  return results;
}

export { isValidJsFile, fetchAndAnalyzeScript, analyzeScript };
