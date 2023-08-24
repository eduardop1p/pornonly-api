const util = require('util');
const cp = require('child_process');
const ffprobePath = require('ffprobe-static').path;
const axios = require('axios');

const promisifiedExec = util.promisify(cp.exec);

module.exports = async function getVideoDimensions(videoUrl) {
  const command = `${ffprobePath} -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoUrl}"`;

  try {
    const { stdout } = await promisifiedExec(command);
    const [width, height] = stdout.trim().split('x');
    // console.log({ width: parseInt(width), height: parseInt(height), err: null });
    return {
      width: parseInt(width),
      height: parseInt(height),
      err: null,
    };
  } catch (error) {
    return {
      width: null,
      height: null,
      err: error,
    };
    // throw new Error('Erro ao obter dimensões do vídeo:', error);
  }
};
