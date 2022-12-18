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

  function transformExistingEmotes() {
    // Transform any emote images currently in DOM to their actual size
    // Need to select any image with an alt attribute that matches an emote name and is a child of a div with the data-testid of image-thumb
    document.querySelectorAll('[data-testid=image-thumb] img[alt]').forEach(img => {
      let emote = checkEmote(img.alt);
      console.log(emote);
      if (emote) {
        const wrapper = img.parentElement.parentElement.parentElement
        if (wrapper.attributes['data-testid'].value === 'image-thumb' && wrapper.style.width !== "64px") {
          console.log("transforming emote")

          wrapper.style.width = "64px";
          wrapper.style.height = "64px";

        }
      }
    }
    );
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
          transformExistingEmotes();

          // If p.selectable-text.copyable-text is removed then clear observer and reinit
          if (mutation.removedNodes.length > 0) {
            if (mutation.removedNodes[0].className === "selectable-text copyable-text") {
              console.log("input box removed");
              observer.disconnect();
              init();
            }
          }
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
