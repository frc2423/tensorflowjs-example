import { browser, dispose, loadGraphModel, loadLayersModel, cast } from '@tensorflow/tfjs';
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


class ObjectDetectionModel extends LitElement {

  static get styles() {
    return css`

      :host {
        width: 500px;
        position: relative;
        display: inline-block;
        font-family: sans-serif;
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
      modelUrl: { type: String, attribute: 'model-url' },
    };
  }

  constructor() {
    super();
    this.predictions = [];
    this.robotStream = '';
    this.elementWidth = 0;
    this.tensorWidth = 0;
    this.modelUrl = '';
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

    const model = !this.modelUrl 
      ? await cocoSsd.load()
      : await loadGraphModel(this.modelUrl);

    console.log('Model loaded');

    const getImageAndPredict = async () => {
      
      let img = await browser.fromPixelsAsync(video);
      this.tensorWidth = img.shape[1];


      if (!this.modelUrl) {

        this.predictions = await model.detect(img);

      
      } else {
        // const tensor = img.reshape([1, 480, 640, 3]);
        const tensor = img.expandDims(0);

        // const tensor2 = tensor.slice([0, 0, 0, 0], [0, 224, 224, 3])
        // const tensor3 = cast(tensor2, 'float32');



        const output = await model.executeAsync(tensor);

        const scores = output[0].dataSync();
        const boxes = output[1].dataSync();
        

        console.log('shape:', output[0].shape, output[1].shape);
        // console.log('tensors:', scores, boxes);

        // console.log('output:', output, output[0].print());

        // const boxes = output[0].dataSync()
        // const scores = output[1].arraySync()
        // const classes = output[2].dataSync()

        dispose(tensor);
      }

      dispose(img);

      setTimeout(async () => {
        getImageAndPredict();
      }, 50);
    };
  
    getImageAndPredict();
  }

  render() {

    const element2TensorSizeRatio = (!this.elementWidth || !this.tensorWidth) ? 0 : this.elementWidth / this.tensorWidth;

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
            left: `${left * element2TensorSizeRatio}px`, 
            top: `${top * element2TensorSizeRatio}px`, 
            width: `${width * element2TensorSizeRatio}px`, 
            height: `${height * element2TensorSizeRatio}px`,
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
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
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

customElements.define('object-detection-model', ObjectDetectionModel);
