const switchInput = document.getElementById('switchInput');
const storeButton = document.getElementById('storeButton');
const connectionStringInput = document.getElementById('connectionString');
const errorMessage = document.getElementById('errorMessage');
let switchState = localStorage.getItem('switchState');
let connectionString = localStorage.getItem('connectionString');

if (switchState === 'true') {
  switchInput.checked = true;
  document.getElementById('connectionString').disabled = false;
  document.getElementById('storeButton').disabled = false;
}

const connectionStringContainer = document.getElementById(
  'connectionStringContainer'
);

switchInput.addEventListener('change', function () {
  if (switchInput.checked) {
    document.getElementById('connectionString').disabled = false;
    document.getElementById('storeButton').disabled = false;
    chrome.storage.local.set({ connectionString: connectionString });
  } else {
    document.getElementById('connectionString').disabled = true;
    document.getElementById('storeButton').disabled = true;
    chrome.storage.local.set({ connectionString: '' });
  }
  chrome.storage.local.set({ switchState: switchInput.checked }, () =>
    localStorage.setItem('switchState', switchInput.checked)
  );
});

connectionStringInput.addEventListener('input', function () {
  const connectionString = connectionStringInput.value;
  const storedConnectionString = localStorage.getItem('connectionString');

  // Check if the connection string is a valid PostgreSQL connection string
  const postgresPrefix = 'postgres://';
  const isConnectionValid = connectionString.startsWith(postgresPrefix);
  if (connectionString.startsWith(postgresPrefix)) {
    errorMessage.innerHTML = '';
  } else {
    errorMessage.innerHTML =
      'Error: Connection string is not a valid PostgreSQL connection string';
  }

  if (connectionString === storedConnectionString || !isConnectionValid) {
    storeButton.disabled = true;
  } else {
    storeButton.disabled = false;
  }
});

storeButton.addEventListener('click', function () {
  const connectionString = connectionStringInput.value;
  chrome.storage.local.set({ connectionString: connectionString }, function () {
    localStorage.setItem('connectionString', connectionString);
  });
  storeButton.disabled = true;
});

window.onload = function () {
  connectionString = localStorage.getItem('connectionString');
  switchState = localStorage.getItem('switchState');
  chrome.storage.local.set({ connectionString: connectionString });
  chrome.storage.local.set({ switchState: switchState === 'true' });
  if (connectionString) {
    document.getElementById('connectionString').value = connectionString;
  }
};
