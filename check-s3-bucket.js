// Author: Sanket
// Purpose: Final S3 Production Verification
const { S3Client, ListObjectsV2Command, HeadBucketCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

const config = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucketName: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES
};

async function verify() {
    console.log('🚀 Starting Final S3 Production Verification');
    console.log(`- Bucket: ${config.bucketName}`);
    console.log(`- Region: ${config.region}\n`);

    if (!config.accessKeyId || !config.secretAccessKey || !config.region || !config.bucketName) {
        console.error('❌ ERROR: Missing configuration in .env');
        process.exit(1);
    }

    const client = new S3Client({ 
        region: config.region, 
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        }
    });

    try {
        console.log('🛰️ Testing HeadBucket...');
        await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
        console.log('✅ SUCCESS: Bucket found and accessible.');

        console.log('🛰️ Testing ListObjects...');
        const list = await client.send(new ListObjectsV2Command({ Bucket: config.bucketName, MaxKeys: 1 }));
        console.log(`✅ SUCCESS: List permissions verified.`);
        
        console.log('\n✨ ALL PRODUCTION S3 CHECKS PASSED!');
        console.log('Credentials are valid, region is correct, and bucket is ready for uploads.');
    } catch (error) {
        console.error('\n❌ ERROR: Verification failed.');
        console.error(`Name: ${error.name}`);
        console.error(`Message: ${error.message}`);
        process.exit(1);
    }
}

verify();
