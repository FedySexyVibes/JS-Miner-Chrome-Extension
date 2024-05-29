document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('Active tab:', tabs[0]);
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: analyzeScriptsOnPage,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
        } else {
          console.log('Scripts analyzed:', results);
          if (results && results[0] && results[0].result) {
            displayResults(results[0].result);
          } else {
            console.log('No results returned from content script');
            document.getElementById('results').textContent = 'No analysis results found.';
          }
        }
      }
    );
  });
});

function analyzeScriptsOnPage() {
  return new Promise((resolve, reject) => {
    const scripts = document.getElementsByTagName('script');
    let results = [];
    let fetchPromises = [];
    
    // Regex patterns to capture various API endpoint usages with methods
    const urlRegex = /https?:\/\/[^\s'"]+/gi;
    const tokenRegex = /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;
    const apiRegex = /\b(GET|POST|PUT|DELETE|PATCH)\s+(https?:\/\/[^\s'"]+)/gi;
    const ajaxRegex = /\$.ajax\({\s*method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`],\s*.*url:\s*['"`]([^'"`]+)['"`]/gi;
    const fetchRegex = /fetch\(['"`]([^'"`]+)['"`],\s*{\s*method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`]/gi;
    const axiosRegex = /axios\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi; // New regex to capture axios calls
    const genericApiRegex = /(?:axios|fetch|post|put|delete|patch|get|ajax)\(['"`]([^'"`]+)['"`]/gi; // Generic regex for more coverage
    
    const cookieRegex = /document\.cookie\s*=\s*(['"`])([^'";]+)\1/g;
    const storageRegex = /\b(localStorage|sessionStorage)\.setItem\s*\(\s*['"`]([^'"]+)['"`]\s*,\s*['"`]([^'"]+)['"`]\s*\)/gi;
    const headerRegex = /setRequestHeader\s*\(\s*['"`]([^'"]+)['"`]\s*,\s*['"`]([^'"]+)['"`]\s*\)/gi;
    const filePathRegex = /['"`]([^'"`]+\.(js|jsx|ts|tsx|scss|css|html|htm))['"`]/gi;

    console.log('Analyzing scripts on page:', scripts.length);

    for (let script of scripts) {
      if (script.src) {
        console.log('Fetching script:', script.src);
        fetchPromises.push(
          fetch(script.src)
            .then((response) => response.text())
            .then((data) => {
              console.log('Fetched data from:', script.src);
              console.log('Script content:', data);

              let match;
              const scriptResults = {
                script: script.src,
                urls: new Set(),
                tokens: new Set(),
                requests: new Set(),
                cookies: new Set(),
                storage: new Set(),
                headers: new Set(),
                files: new Set()
              };

              while ((match = urlRegex.exec(data))) {
                console.log('URL found:', match[0]);
                scriptResults.urls.add(match[0]);
              }
              while ((match = tokenRegex.exec(data))) {
                console.log('Token found:', match[0]);
                scriptResults.tokens.add(match[0]);
              }
              while ((match = apiRegex.exec(data))) {
                console.log('API Endpoint found:', match[0]);
                scriptResults.requests.add(`${match[1]}: ${match[2]}`);
              }
              while ((match = ajaxRegex.exec(data))) {
                console.log('AJAX API Endpoint found:', match[2]);
                scriptResults.requests.add(`${match[1]}: ${match[2]}`);
              }
              while ((match = fetchRegex.exec(data))) {
                console.log('Fetch API Endpoint found:', match[1]);
                scriptResults.requests.add(`${match[2]}: ${match[1]}`);
              }
              while ((match = axiosRegex.exec(data))) {
                console.log('Axios API Endpoint found:', match[2]);
                scriptResults.requests.add(`${match[1].toUpperCase()}: ${match[2]}`);
              }
              // Adjusting genericApiRegex to not show generic, but capture the method from context
              while ((match = genericApiRegex.exec(data))) {
                console.log('Generic API Endpoint found:', match[1]);
                scriptResults.requests.add(`Detected API Call: ${match[1]}`);
              }
              while ((match = cookieRegex.exec(data))) {
                console.log('Cookie creation detected:', match[2]);
                scriptResults.cookies.add(match[2]);
              }
              while ((match = storageRegex.exec(data))) {
                console.log('Storage usage detected:', `Key: ${match[2]}, Value: ${match[3]}`);
                scriptResults.storage.add(`Key: ${match[2]}, Value: ${match[3]}`);
              }
              while ((match = headerRegex.exec(data))) {
                console.log('Header setting detected:', `Header: ${match[1]}, Value: ${match[2]}`);
                scriptResults.headers.add(`Header: ${match[1]}, Value: ${match[2]}`);
              }
              while ((match = filePathRegex.exec(data))) {
                console.log('File path detected:', match[1]);
                scriptResults.files.add(match[1]);
              }

              results.push({
                script: scriptResults.script,
                urls: Array.from(scriptResults.urls),
                tokens: Array.from(scriptResults.tokens),
                requests: Array.from(scriptResults.requests),
                cookies: Array.from(scriptResults.cookies),
                storage: Array.from(scriptResults.storage),
                headers: Array.from(scriptResults.headers),
                files: Array.from(scriptResults.files)
              });
            })
            .catch((error) => console.error(`Error fetching script: ${script.src}`, error))
        );
      }
    }

    Promise.all(fetchPromises)
      .then(() => {
        console.log('All fetches completed. Results:', results);
        resolve(results);
      })
      .catch((error) => {
        console.error('Error during fetch:', error);
        reject(error);
      });
  });
}

function displayResults(results) {
  console.log('Displaying results:', results);
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';

  if (results.length === 0) {
    resultsContainer.textContent = 'No analysis results found.';
    return;
  }

  results.forEach((result) => {
    console.log('Processing result:', result);
    const div = document.createElement('div');
    div.className = 'result';

    const scriptUrlElem = document.createElement('div');
    scriptUrlElem.className = 'script-url';
    scriptUrlElem.textContent = `Script: ${result.script}`;
    scriptUrlElem.addEventListener('click', () => {
      const detailElems = div.querySelectorAll('.detail');
      detailElems.forEach((elem) => {
        elem.classList.toggle('hidden');
      });

      // Scroll to the clicked element
      div.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const createDetailSection = (title, items) => {
      const section = document.createElement('div');
      section.className = 'detail hidden';
      const list = document.createElement('ul');
      section.appendChild(document.createElement('h2')).textContent = title;
      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      section.appendChild(list);
      return section;
    };

    div.appendChild(scriptUrlElem);
    div.appendChild(createDetailSection('URLs', result.urls));
    div.appendChild(createDetailSection('Tokens', result.tokens));
    div.appendChild(createDetailSection('API Requests', result.requests));
    div.appendChild(createDetailSection('Cookies', result.cookies));
    div.appendChild(createDetailSection('Storage', result.storage));
    div.appendChild(createDetailSection('Headers', result.headers));
    div.appendChild(createDetailSection('Files and Paths', result.files));

    resultsContainer.appendChild(div);
  });
}
