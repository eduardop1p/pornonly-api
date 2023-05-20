const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = require('../../config/awsS3Client');

module.exports = async fileKey => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  });

  await s3.send(command);
};
