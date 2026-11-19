const { exec } = require('child_process');

const googleStartUrl = 'http://localhost:3000/auth/google';

function abrirBrowser(url) {
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`);
  } else if (process.platform === 'darwin') {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

console.log('A abrir o fluxo de ligação com Google...');
console.log(googleStartUrl);
abrirBrowser(googleStartUrl);
