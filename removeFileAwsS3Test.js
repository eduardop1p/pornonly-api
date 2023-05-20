const s3 = require('./src/config/awsS3');

const input = {};

s3.deleteItem({ TableName: 'imgs', Key: '1684507574214_14758.jpg	' }, (err, data) => {
  if (err) {
    console.log(err);
  } else {
    console.log('arquiv deletado.');
  }
});
