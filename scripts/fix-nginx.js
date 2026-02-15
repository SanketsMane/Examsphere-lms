
const fs = require('fs');

const configPath = '/etc/nginx/sites-enabled/default';
let config = fs.readFileSync(configPath, 'utf8');

// Comment out the static locations
config = config.replace(
    /location \/_next\/static \{[\s\S]*?\}/g, 
    '# location /_next/static { alias ...; access_log off; } # COMMENTED OUT BY DEPLOY SCRIPT'
);

config = config.replace(
    /location \/public \{[\s\S]*?\}/g, 
    '# location /public { alias ...; access_log off; } # COMMENTED OUT BY DEPLOY SCRIPT'
);

fs.writeFileSync(configPath, config);
console.log('Updated Nginx config.');
