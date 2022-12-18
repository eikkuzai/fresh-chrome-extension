// this code will be executed after page load
(function() {
  console.log('after.js executed');
  
  // Load emotes from the emotes.json file
  let emotes = [];
  const url = chrome.runtime.getURL('emotes.json');
  fetch(url)
  .then((response) => response.json()).then((json) => {
    json.forEach(emote => {
      emotes.push(emote);
    });

    console.log('emotes loaded');
    console.log(emotes);
  });

  // Poll for the input box to be loaded
  let interval = setInterval(function() {
    console.log('polling for input box')
    if (document.querySelectorAll('[data-testid=conversation-compose-box-input]').length > 0) {
      console.log('input box found');
      clearInterval(interval);
      init();
    }
  }, 100);


  // Check if the text matches an emote
  function checkEmote(text) {
    const found = emotes.find(emote => emote.name === text)
    return found ? found : false;
  }

  // Add emote to the input box
  function addEmote(emote, mutation) {
  
    // https://cdn.7tv.app/emote/60ae7316f7c927fad14e6ca2/2x.webp
    
    const emoteUrl = "https://cdn.7tv.app/emote/" + emote.id + "/2x.avif";

    fetch(emoteUrl)
    .then(response => response.blob())
    .then(blob => {
      const file = new File([blob], emote.name + ".avif", {type: "image/avif"});
      const clipboardData = new ClipboardEvent("").clipboardData || new DataTransfer();
      clipboardData.items.add(file);
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData,
        bubbles: true,
        cancelable: true,
      });
      document.querySelectorAll('[data-testid=conversation-compose-box-input]')[0].dispatchEvent(pasteEvent);
      
    });

  }

  // Send the message
  function sendMsg() {
    document.querySelectorAll('[data-testid=compose-btn-send]')[0].click();
  }

  function init() {
    console.log('init');

    // Select the node that will be observed for mutations
    const targetNode = document.querySelectorAll('[data-testid=conversation-compose-box-input]')[0];

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true, characterData: true};

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'childList') {

          console.log('A child node has been added or removed.');
          console.log(mutation);
        } 
        
        if (mutation.type === 'characterData') {
          console.log('Text changed');
          console.log("Text typed in input box: " + mutation.target.data);

          // Check if text matches an emote
          let emote = checkEmote(mutation.target.data);
          if (emote) {
            addEmote(emote, mutation);
          }
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

  }


})();
