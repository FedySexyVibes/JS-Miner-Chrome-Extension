import { isValidJsFile, fetchAndAnalyzeScript } from './utilities.js';

// Scanner logic
function scanScripts() {
  const scripts = document.getElementsByTagName('script');
  let allResults = [];
  let fetchPromises = [];

  for (let script of scripts) {
    if (script.src && isValidJsFile(script.src)) {
      fetchPromises.push(
        fetchAndAnalyzeScript(script.src)
          .then(results => {
            allResults = allResults.concat(results);
          })
      );
    }
  }

  return Promise.all(fetchPromises).then(() => allResults);
}

export { scanScripts };
