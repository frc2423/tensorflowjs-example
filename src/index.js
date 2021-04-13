import { browser } from '@tensorflow/tfjs';

// Note: Require the cpu and webgl backend and add them to package.json as peer dependencies.
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

import * as cocoSsd from '@tensorflow-models/coco-ssd';

const IMAGE_SIZE = 500;

const setupVideoStream = async (video) => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  video.srcObject = stream;
  video.width = IMAGE_SIZE;
  video.height = IMAGE_SIZE;
};

const waitForVideoLoad = (video) => {
  return new Promise(resolve => {
    if (video.readyState >= 3){
      resolve();
    } else {
      video.addEventListener('loadeddata', () => {
        resolve();
      });
    }
  });
};

(async () => {

  const video = document.getElementById("webcam");
  await setupVideoStream(video);
  await waitForVideoLoad(video);

  // Load the model.
  console.log('Loading model...');
  const model = await cocoSsd.load();
  console.log('Model loaded');


  const getImageAndPredict = async () => {
    const img = await browser.fromPixelsAsync(video);
    const predictions = await model.detect(img);

    if (predictions.length > 0) {
      const [prediction] = predictions;
      console.log('prediction:', prediction.class, prediction.score);
    }

    setTimeout(async () => {
      getImageAndPredict();
    }, 50);
  };

  getImageAndPredict();

})();