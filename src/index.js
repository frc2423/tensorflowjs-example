import { browser, dispose } from '@tensorflow/tfjs';

// Note: Require the cpu and webgl backend and add them to package.json as peer dependencies.
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

import * as cocoSsd from '@tensorflow-models/coco-ssd';

import { html, css, LitElement } from 'lit-element';

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


class TensorFlowExample extends LitElement {

  static get styles() {
    return css`
    
    `;
  }

  static get properties() {
    return {
      predictions: { type: Array, attribute: false }
    };
  }

  constructor() {
    super();
    this.predictions = [];
  }

  async firstUpdated() {
    const video = this.shadowRoot.getElementById("webcam");
    await setupVideoStream(video);
    await waitForVideoLoad(video);
  
    // Load the model.
    console.log('Loading model...');
    const model = await cocoSsd.load();
    console.log('Model loaded');
  
    const getImageAndPredict = async () => {
      const img = await browser.fromPixelsAsync(video);
      this.predictions = await model.detect(img);
      dispose(img);

      setTimeout(async () => {
        getImageAndPredict();
      }, 50);
    };
  
    getImageAndPredict();
  }

  render() {
    return html`
      <video autoplay id="webcam" width="500" height="500"></video>
      ${this.predictions.map(prediction => html`
        <p>${prediction.class}: ${prediction.score}</p>
      `)}
    `;
  };
}

customElements.define('tensorflow-example', TensorFlowExample);
