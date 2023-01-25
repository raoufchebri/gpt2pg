chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes('https://chat.openai.com/chat')) {
    const chatId = tab.url.substring(tab.url.lastIndexOf('/') + 1);
    chrome.tabs.sendMessage(tabId, {
      type: 'NEW',
      chatId,
    });
  }
});
