let currentChat = '';
let switchState = '';
let connectionString = '';

const URL = 'https://gpt2pg.vercel.app';

(() => {
  chrome.storage.local.get('switchState', (result) => {
    switchState = result.switchState;
  });

  chrome.storage.local.get('connectionString', (result) => {
    connectionString = result.connectionString;
  });

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value } = obj;
    if (type === 'currentChat') {
      currentChat = value;
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    console.log('changes', changes);
    const key = Object.keys(changes)[0];
    if (key === 'switchState') {
      switchState = changes[key]['newValue'];
    }
    if (key === 'connectionString') {
      connectionString = changes[key]['newValue'];
    }
  });

  // Select the node that will be observed for mutations
  var targetNode = document.getElementsByTagName('main')[0];

  // Options for the observer (which mutations to observe)
  var config = { attributes: true, childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  var callback = function (mutationsList) {
    for (var mutation of mutationsList) {
      if (mutation.type == 'childList') {
        addRunSQLButton();
      }
    }
  };

  // Create an observer instance linked to the callback function
  var observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
})();

const addRunSQLButton = () => {
  const sqlCodeBlockExists = document.getElementsByClassName('language-sql')[0];
  if (sqlCodeBlockExists) {
    const sqlCodeBlocks = document.getElementsByClassName('language-sql');
    for (let i = 0; i < sqlCodeBlocks.length; i++) {
      const sqlCodeBlock = sqlCodeBlocks[i];
      const parentNode = sqlCodeBlock.parentNode.parentNode.parentNode;
      if (!parentNode.getElementsByClassName('btn')[0]) {
        // Create the button element
        const button = document.createElement('button');
        // Set button class
        button.classList.add(
          'btn',
          'flex',
          'justify-center',
          'gap-2',
          'btn-primary',
          'mr-2'
        );

        button.addEventListener('click', async () => {
          // add a spinner to the button
          button.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75
            " fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>Running query...`;

          const postgresResult =
            parentNode.getElementsByClassName('postgres-result')[0];
          if (postgresResult) {
            postgresResult.remove();
          }

          const databaseUrl =
            switchState && isValidPostgresConnectionString(connectionString)
              ? connectionString
              : null;

          function isValidPostgresConnectionString(connectionString) {
            const postgresPrefix = 'postgres://';
            return connectionString.startsWith(postgresPrefix);
          }

          const response = await fetch(`${URL}/api/handler`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sql: sqlCodeBlock.innerText.replace(/\n/g, ' '),
              chatId: currentChat,
              databaseUrl: databaseUrl,
            }),
          });
          const { body, error } = await response.json();
          if (error) {
            const p = document.createElement('p');
            // add red color to the text
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
  }
};

async function jsonArrayToTable(jsonArray, parentNode) {
  var table = document.createElement('table');
  table.classList.add(
    'table',
    'table-striped',
    'table-bordered',
    'postgres-result'
  );
  var tableHead = document.createElement('thead');
  var tableBody = document.createElement('tbody');
  var tr, th, td;
  var keys = Object.keys(jsonArray[0]);

  // Create table header
  tr = document.createElement('tr');
  for (var i = 0; i < keys.length; i++) {
    th = document.createElement('th');
    th.appendChild(document.createTextNode(keys[i]));
    tr.appendChild(th);
  }
  tableHead.appendChild(tr);
  table.appendChild(tableHead);

  // Create table body
  for (var i = 0; i < jsonArray.length; i++) {
    tr = document.createElement('tr');
    for (var j = 0; j < keys.length; j++) {
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
