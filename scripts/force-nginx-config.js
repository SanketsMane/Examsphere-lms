
const fs = require('fs');

const config = `
server {
    listen 80;
    server_name kidokool.xyz www.kidokool.xyz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

// Overwrite the file directly
fs.writeFileSync('/etc/nginx/sites-available/kidokool', config);
console.log('Overwrote Nginx config at /etc/nginx/sites-available/kidokool');
