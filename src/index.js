import { browser, dispose } from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { html, css, LitElement } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';

const BOX_COLORS = ['#45f574', '#6275f0', '#f28377', '#ed80e2', '#edc879',  '#f7f37c'];
const BOX_BORDER_WIDTH = 2;

const setupVideoStream = async (video) => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  video.srcObject = stream;
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

      :host {
        width: 500px;
        position: relative;
        display: inline-block;
      }

      [part="video-container"] {
        position: relative;
        width: 100%;
        display: inline-block;
        overflow: hidden;
      }

      img, video {
        position: relative;
        display: block;
        width: 100%;
      }

    `;
  }

  static get properties() {
    return {
      predictions: { type: Array, attribute: false },
      robotStream: { type: String, attribute: 'robot-stream' },
      elementWidth: { type: Number, attribute: false },
      tensorWidth: { type: Number, attribute: false },
    };
  }

  constructor() {
    super();
    this.predictions = [];
    this.robotStream = '';
    this.elementWidth = 0;
    this.tensorWidth = 0;
  }

  observeResize() {
    this.elementWidth = this.getBoundingClientRect().width;

    const resizeObserver = new ResizeObserver(() => {
     this.elementWidth = this.getBoundingClientRect().width;
    });

    resizeObserver.observe(this);
  }

  async firstUpdated() {

    this.observeResize();

    const video = this.robotStream ?
      this.shadowRoot.getElementById('robot-stream')
      : this.shadowRoot.getElementById("webcam");

    if (!this.robotStream) {
      await setupVideoStream(video);
      await waitForVideoLoad(video);
    }
  
    // Load the model.
    console.log('Loading model...');
    const model = await cocoSsd.load();
    console.log('Model loaded');
  
    const getImageAndPredict = async () => {
      const img = await browser.fromPixelsAsync(video);
      this.tensorWidth = img.shape[1];
      this.predictions = await model.detect(img);
      dispose(img);

      setTimeout(async () => {
        getImageAndPredict();
      }, 50);
    };
  
    getImageAndPredict();
  }

  render() {

    const elementTensorSizeRatio = (!this.elementWidth || !this.tensorWidth) ? 0 : this.elementWidth / this.tensorWidth;

    return html`
      <div part="video-container">
        ${this.robotStream ? html`
          <img id="robot-stream" src="${this.robotStream}" crossorigin="anonymous" />
        `: html`
          <video autoplay id="webcam"></video>
        `}
        ${this.predictions.map((prediction, index) => {
          const color = BOX_COLORS[index % BOX_COLORS.length];
          const [left, top, width, height] = prediction.bbox;
          const boxStyles = { 
            left: `${left * elementTensorSizeRatio}px`, 
            top: `${top * elementTensorSizeRatio}px`, 
            width: `${width * elementTensorSizeRatio}px`, 
            height: `${height * elementTensorSizeRatio}px`,
            position: 'absolute',
            border: `${BOX_BORDER_WIDTH}px solid ${color}`,
            boxSizing: 'border-box'
          };
          const boxLabelStyles = {
            position: 'absolute',
            background: color,
            color: 'black',
            height: '20px',
            lineHeight: '20px',
            padding: '0 5px',
            top: '-20px',
            left: `-${BOX_BORDER_WIDTH}px`,
            whiteSpace: 'nowrap'
          };
          return html`
            <div style="${styleMap(boxStyles)}">
              <div style="${styleMap(boxLabelStyles)}">
                ${prediction.class}: ${(prediction.score * 100).toFixed(0)}%
              </div>
            </div>
          `;
        })}
      </div>
      ${this.predictions.map(prediction => html`
        <p>${prediction.class}: ${prediction.score}</p>
      `)}
    `;
  };
}

customElements.define('tensorflow-example', TensorFlowExample);
