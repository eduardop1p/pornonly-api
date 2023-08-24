const imageSize = require('image-size');
const axios = require('axios');

module.exports = async function getImageDimensions(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    const dimensions = imageSize(imageBuffer);

    // console.log({
    //   width: dimensions.width,
    //   height: dimensions.height,
    //   err: null,
    // });
    return {
      width: dimensions.width,
      height: dimensions.height,
      err: null,
    };
  } catch (err) {
    return {
      width: null,
      height: null,
      err,
    };
  }
};
