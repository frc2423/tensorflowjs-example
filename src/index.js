import '@tensorflow/tfjs';

// Note: Require the cpu and webgl backend and add them to package.json as peer dependencies.
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

import * as cocoSsd from '@tensorflow-models/coco-ssd';

(async () => {
  const img = document.querySelector('img');

  // Load the model.
  console.log('Loading model...');
  const model = await cocoSsd.load();
  console.log('Model loaded');

  // Classify the image.
  console.log('Classifying image...');
  const predictions = await model.detect(img);
  console.log('Image classified');

  console.log('Predictions: ');
  console.log(predictions);
})();