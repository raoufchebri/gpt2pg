let currentChat = '';

const URL = 'https://chatgpt-extension-api.vercel.app';

(() => {
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, chatId } = obj;
    if (type === 'NEW') {
      currentChat = chatId;
    }
  });

  // Select the node that will be observed for mutations
  const targetNode = document.getElementsByTagName('main')[0];

  // Options for the observer (which mutations to observe)
  const config = { attributes: true, childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  const callback = (mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type == 'childList') {
        // Check if there is a code block with SQL
        const sqlCodeBlockExists =
          document.getElementsByClassName('language-sql')[0];
        if (sqlCodeBlockExists) {
          addRunSQLButton();
        }
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);
  
  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
})();


// Add a button to run the SQL query
const addRunSQLButton = () => {
  const sqlCodeBlocks = document.getElementsByClassName('language-sql');

  for (let i = 0; i < sqlCodeBlocks.length; i++) {
    var sqlCodeBlock = sqlCodeBlocks[i];
    var parentNode = sqlCodeBlock.parentNode.parentNode.parentNode;

    if (!parentNode.getElementsByClassName('btn')[0]) {
      // Create the button element
      var button = document.createElement('button');
      // Set button class
      button.classList.add(
        'btn',
        'flex',
        'justify-center',
        'gap-2',
        'btn-primary',
        'mr-2'
      );

      // Run SQL button click handler
      
      button.addEventListener('click', async () => {
        button.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75
            " fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>Running query...`;
      
        // Remove previous results
        const postgresResult =
          parentNode.getElementsByClassName('postgres-result')[0];
        if (postgresResult) {
          postgresResult.remove();
        }
      
        const response = await fetch(`${URL}/api/handler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sql: sqlCodeBlock.innerText.replace(/\n/g, ' '),
            chatId: currentChat,
          }),
        });
      
        const { body, error } = await response.json();
      
        if (error) {
          const p = document.createElement('p');
          p.classList.add('text-red-500', 'postgres-result');
          p.innerHTML = 'There was an error running your query';
          parentNode.appendChild(p);
        } else if (!body || body.length === 0) {
          const p = document.createElement('p');
          p.innerHTML = "You query didn't return any results";
          parentNode.appendChild(p);
        } else {
          jsonArrayToTable(body, parentNode);
        }
        button.innerHTML = 'Run SQL';
      });
      // Add text to the button
      button.innerHTML = 'Run SQL';
      // Append the button to the parent of <code>
      parentNode.appendChild(button);
    }
  }
};


async function jsonArrayToTable(jsonArray, parentNode) {
  const table = document.createElement('table');
  table.classList.add(
    'table',
    'table-striped',
    'table-bordered',
    'postgres-result'
  );
  const tableHead = document.createElement('thead');
  const tableBody = document.createElement('tbody');
  let tr, th, td;
  const keys = Object.keys(jsonArray[0]);

  // Create table header
  tr = document.createElement('tr');
  for (let i = 0; i < keys.length; i++) {
    th = document.createElement('th');
    th.appendChild(document.createTextNode(keys[i]));
    tr.appendChild(th);
  }
  tableHead.appendChild(tr);
  table.appendChild(tableHead);

  // Create table body
  for (let i = 0; i < jsonArray.length; i++) {
    tr = document.createElement('tr');
    for (let j = 0; j < keys.length; j++) {
      td = document.createElement('td');
      td.appendChild(document.createTextNode(jsonArray[i][keys[j]]));
      tr.appendChild(td);
    }
    tableBody.appendChild(tr);
  }
  table.appendChild(tableBody);
  // Append table to the HTML
  parentNode.appendChild(table);
}
