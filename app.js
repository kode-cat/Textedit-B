// App.js
let editor = ace.edit("editor");
let browser = document.getElementById("browser");
let editorVal = (txt) => { if (txt) { editor.session.setValue(txt) } else { return editor.session.getValue() } };
let browserVal = (txt) => { if (txt) { browser.srcdoc = txt } else { return browser.srcdoc } };

// Replaced LS with an async DB function using localforage
async function DB(k, v) {
  if (typeof k === 'string') {
    if (!k && !v) return undefined;
    if (k && !v) return await localforage.getItem(k);
    if (k && v) await localforage.setItem(k, v);
  }
}

// Ace editor setting 
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/html");

// The initial value is now set after the localforage data is retrieved
(async () => {
  const savedVal = await DB('editorVal');
  editor.session.setValue(savedVal !== null ? savedVal : `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Test Page</title>
<style>
  body {
    margin: 0;
    font-family: sans-serif;
    background: linear-gradient(45deg, #ff8a00, #e52e71);
    color: white;
    text-align: center;
  }
  h1 {
    margin-top: 20px;
    font-size: 2.5rem;
    text-shadow: 2px 2px rgba(0,0,0,0.3);
  }
  button {
    padding: 10px 20px;
    font-size: 1.2rem;
    background: rgba(255,255,255,0.2);
    border: 2px solid white;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: background 0.3s;
  }
  button:hover {
    background: rgba(255,255,255,0.4);
  }
  #clickCount {
    font-size: 1.5rem;
    margin-top: 15px;
  }
  canvas {
    display: block;
    margin: 20px auto;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
  }
</style>
</head>
<body>

<h1>🚀 Test HTML Playground</h1>
<button id="btn">Click Me!</button>
<div id="clickCount">Clicks: 0</div>

<canvas id="myCanvas" width="300" height="200"></canvas>

<script>
  // Click counter
  let count = 0;
  document.getElementById('btn').addEventListener('click', () => {
    count++;
    document.getElementById('clickCount').textContent = "Clicks: " + count;
  });

  // Canvas animation (bouncing ball)
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  let x = 50, y = 50, dx = 2, dy = 2, radius = 15;

  function drawBall() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();

    if (x + dx > canvas.width - radius || x + dx < radius) dx = -dx;
    if (y + dy > canvas.height - radius || y + dy < radius) dy = -dy;

    x += dx;
    y += dy;

    requestAnimationFrame(drawBall);
  }

  drawBall();
</script>

</body>
</html>`);
  
  // Now run the code after the editor value is set
  run();
})();

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

// onChange is now an async function
async function onChange() {
  await DB('editorVal', editorVal());
}
editor.session.on('change', onChange);

// Initialisations
let TempData = {
  browser: {
    url: `${window.location.href.split('#')[0]}#/run`
  }
};

// The SaveEditorVal IIFE is now an async function that handles localforage
(async function SaveEditorVal() {
  const savedVal = await DB('editorVal');
  if (savedVal !== null) {
    editorVal(savedVal);
  } else {
    await DB('editorVal', editorVal());
  }
  run();
})();

// RunPage is now an async function
async function RunPage(debug = false) {
  let html = await DB('editorVal');

  // If in debug mode, inject eruda script into <head> or <body>
  if (debug) {
    let erudaScript = `
      <script src="https://cdn.jsdelivr.net/npm/eruda@3.4.3/eruda.min.js"><\/script>
      <script>eruda.init();<\/script>
    `;
    // Put it before </body> if possible
    html = html.replace(/<\/body>/i, erudaScript + '</body>');
    if (html === (await DB('editorVal'))) {
      // If no </body> found, just append
      html += erudaScript;
      alert("1. On Debug Preview mode.\n\n2. Can be used for debugging this page.");
    }
  }

  document.documentElement.innerHTML = html;
  loadExternals(document, window.location.href);
}

Flaro.router({
  "/": () => {},
  "/run": async () => await RunPage(),
  "/run--debug": async () => await RunPage(true),
  "/debug": () => {
    eruda.init();
    TempData.browser.url = window.location.href.split('#')[0] + "#/run--debug";
    alert("1. Currently on Debug mode.\n\n2. This mode is only used for debugging editor, not important.\n\n3. Debug mode also doesn't support separate preview window for now.");
  },
  "*": (params) => { // 404 handler
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;font-family:sans-serif;color:#fff;background:#1c1c1c">
        <div>
          <h1 style="font-size:3em;color:#0CD;">404</h1>
          <p style="font-size:1.5em;">Page not found</p>
          <button style="padding:10px 20px;font-size:15px;background:#0CD;color:#fff;border:none;border-radius:5px;cursor:pointer"
            onclick="window.location.hash = '';window.location.reload();">Go Home</button>
        </div>
      </div>
    `;
  }
});
Flaro('input').on('click', () => {
  window.open(TempData.browser.url, '_blank')
});
Flaro('*[template]').html(Flaro.parseAndUseTemplate(Flaro('*[template]').html(), TempData));
// The END
