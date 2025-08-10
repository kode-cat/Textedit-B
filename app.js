// App.js
let editor = ace.edit("editor");
let browser = document.getElementById("browser");
let editorVal = (txt) => { if (txt) { editor.session.setValue(txt) } else { return editor.session.getValue() } };
let browserVal = (txt) => { if (txt) { browser.srcdoc = txt } else { return browser.srcdoc } };
let LS = (k, v) => {
  if (typeof k === 'string') {
    if (!k && !v) return undefined;
    if (k && !v) return localStorage.getItem(k);
    if (k && v) localStorage.setItem(k, v);
  }
}

// Ace editor setting 
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/html");
editor.session.setValue(LS('editorVal') !== null ? LS('editorVal') : `<!DOCTYPE html>
<html lang="en">
 <head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <meta http-equiv="X-UA-Compatible" content="ie=edge">
   <title>Document</title>
   <!-- CSS -->
   <style></style>
 </head>
 <body>
    <h1>Heading</h1>
    <p>This is paragraph</p>
    
    <!-- JS -->
    <script></script>
 </body>
</html>`);
/*
editor.setOptions({
  enableBasicAutocompletion: true,
  enableSnippets: true,
  enableLiveAutocompletion: true
});
ace.config.loadModule("ace/ext/language_tools", function() {
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
  });
});*/

// Function to inject styles/scripts in iframe
async function loadExternals(doc, baseCDN = '') {
  // Styles
  for (const el of doc.querySelectorAll("link[rel='stylesheet'], style")) {
    const newEl = el.cloneNode(true);
    if (newEl.tagName === "LINK" && baseCDN && newEl.href.startsWith('./')) {
      newEl.href = baseCDN + newEl.getAttribute('href');
    }
    doc.head.appendChild(newEl);
  }
  
  // Scripts in sequence
  for (const s of doc.querySelectorAll("script")) {
    const newScript = document.createElement("script");
    if (s.src) {
      newScript.src = baseCDN && s.src.startsWith('./') ? baseCDN + s.getAttribute('src') : s.src;
      await new Promise((resolve, reject) => {
        newScript.onload = resolve;
        newScript.onerror = reject;
        doc.body.appendChild(newScript);
      });
    } else {
      newScript.textContent = s.textContent;
      doc.body.appendChild(newScript);
    }
    if (s.type) newScript.type = s.type;
  }
}

//Run Code
function run() {
  browserVal(`${editorVal()}`);
}

function copy() {
  navigator.clipboard.writeText(editorVal());
  alert("Text Copied");
}

function reload() {
  location.reload()
}

function undo() {
  editor.undo();
}

function redo() {
  editor.redo();
}

function show(selector) {
  document.querySelector(selector).showModal()
}

function hide(selector) {
  document.querySelector(selector).close()
}

function onChange() {
  LS('editorVal', editorVal());
}
editor.session.on('change', onChange);

// Initialisations
let TempData = {
  browser: {
    url: `${window.location.href}#/run`
  }
};
Flaro('*[template]').html(Flaro.parseAndUseTemplate(Flaro('*[template]').html(), TempData));

(function SaveEditorVal() {
  editorVal(LS('editorVal'));
  if (LS('editorVal') === null) LS('editorVal', editorVal());
  run();
})();

Flaro.router({
  "/": () => {},
  "/run": () => {
    document.documentElement.innerHTML = LS('editorVal')
    loadExternals(document,window.location.href)
  },
  "/debug": () => eruda.init(),
});
Flaro('input').on('click', () => window.open(window.location.href + "#/run", '_blank'));
// The END
