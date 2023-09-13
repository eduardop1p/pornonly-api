const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const s3 = require('../../config/awsS3Client');

module.exports = async fileKeys => {
  const command = new DeleteObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Delete: {
      Objects: fileKeys,
    },
  });

  await s3.send(command);
};
