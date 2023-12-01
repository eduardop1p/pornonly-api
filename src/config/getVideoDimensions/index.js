const util = require('util');
const cp = require('child_process');
const ffprobePath = require('ffprobe-static').path;
const axios = require('axios');

const promisifiedExec = util.promisify(cp.exec);

function videoDurationHydration(duration) {
  // eslint-disable-next-line
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const segunds = Math.floor(duration % 60);
  const zeroLeft = value => (value > 9 ? value : `0${value}`);

  return `${minutes}:${zeroLeft(segunds)}`;
}

module.exports = async function getVideoDimensions(videoUrl) {
  // atenção! este comando não irar funcionar se o caminho do terminal estiver com caracteris não aceitos, por exemplo espaçamentos
  const commandDimensions = `${ffprobePath} -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoUrl}"`;
  const commandDuration = `${ffprobePath} -v error -select_streams v:0 -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoUrl}"`;

  try {
    const { stdout } = await promisifiedExec(commandDimensions);
    const [width, height] = stdout.trim().split('x');

    const execCommand = await promisifiedExec(commandDuration);
    const duration = parseFloat(execCommand.stdout.trim());
    // console.log({ width: parseInt(width), height: parseInt(height), err: null });

    return {
      width: parseInt(width),
      height: parseInt(height),
      duration: videoDurationHydration(duration),
      err: null,
    };
  } catch (error) {
    console.log(error);
    return {
      width: null,
      height: null,
      duration: null,
      err: error,
    };
    // throw new Error('Erro ao obter dimensões do vídeo:', error);
  }
};
