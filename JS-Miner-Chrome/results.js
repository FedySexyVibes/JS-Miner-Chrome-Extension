document.addEventListener('DOMContentLoaded', () => {
    // Fetch the analysis results from chrome.storage
    chrome.storage.local.get(['analysisResults'], (data) => {
      const resultsContainer = document.getElementById('results');
      const results = data.analysisResults;
  
      if (results) {
        results.forEach((result) => {
          const div = document.createElement('div');
          div.className = 'result';
  
          const scriptUrlElem = document.createElement('div');
          scriptUrlElem.className = 'script-url';
          scriptUrlElem.textContent = `Script: ${result.script}`;
  
          const detailElem = document.createElement('div');
          detailElem.className = 'detail';
          detailElem.textContent = `${result.type} (${result.method}): ${result.value}`;
  
          div.appendChild(scriptUrlElem);
          div.appendChild(detailElem);
  
          resultsContainer.appendChild(div);
        });
      } else {
        resultsContainer.textContent = 'No analysis results found.';
      }
    });
  });
  