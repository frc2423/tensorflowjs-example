import { browser, dispose } from '@tensorflow/tfjs';

// Note: Require the cpu and webgl backend and add them to package.json as peer dependencies.
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

import * as cocoSsd from '@tensorflow-models/coco-ssd';

import { html, css, LitElement } from 'lit-element';


const setupVideoStream = async (video, imageSize) => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  video.srcObject = stream;
  video.width = imageSize;
  video.height = imageSize;
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
      predictions: { type: Array, attribute: false },
      robotStream: { type: String, attribute: 'robot-stream' },
      imageSize: { type: Number, attribute: 'image-size' },
    };
  }

  constructor() {
    super();
    this.predictions = [];
    this.robotStream = '';
    this.imageSize = 500;
  }

  async firstUpdated() {

    const video = this.robotStream ?
      this.shadowRoot.getElementById('robot-stream')
      : this.shadowRoot.getElementById("webcam");

    if (!this.robotStream) {
      await setupVideoStream(video, this.imageSize);
      await waitForVideoLoad(video);
    }
  
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
      ${this.robotStream ? html`
        <img id="robot-stream" src="${this.robotStream}" crossorigin="anonymous" />
      `: html`
        <video autoplay id="webcam" width="${this.imageSize}" height="${this.imageSize}"></video>
      `}
      ${this.predictions.map(prediction => html`
        <p>${prediction.class}: ${prediction.score}</p>
      `)}
    `;
  };
}

customElements.define('tensorflow-example', TensorFlowExample);
