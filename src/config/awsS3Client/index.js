const { S3Client } = require('@aws-sdk/client-s3');
const dotEnv = require('dotenv');
const { resolve } = require('path');

dotEnv.config(resolve(__dirname, '..', '..', '..', '.env'));

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3;
