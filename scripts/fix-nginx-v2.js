
const fs = require('fs');

const configPath = '/etc/nginx/sites-available/kidokool-lms';
let config = '';

try {
    config = fs.readFileSync(configPath, 'utf8');
} catch (e) {
    // try default if custom name fails, though unlikely given ls output
    config = fs.readFileSync('/etc/nginx/sites-available/default', 'utf8');
}

// Comment out the static locations
config = config.replace(
    /location \/_next\/static \{[\s\S]*?\}/g, 
    '# location /_next/static { alias ...; access_log off; } # COMMENTED OUT BY DEPLOY SCRIPT'
);

config = config.replace(
    /location \/public \{[\s\S]*?\}/g, 
    '# location /public { alias ...; access_log off; } # COMMENTED OUT BY DEPLOY SCRIPT'
);

// Write back to sites-available (symlinked to enabled)
fs.writeFileSync(configPath, config);
console.log('Updated Nginx config at ' + configPath);
