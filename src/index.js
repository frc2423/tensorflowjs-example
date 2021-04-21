import { LitElement, html, css } from 'lit-element';
import './object-tracker';

export class TensorflowExample extends LitElement {

  static get styles() {
    return css`
      :host {
        display: block;
      }
    `;
  }

  render() {
    return html`
        <h2>Tensorflowjs Example</h2>

        <!-- 
        To use mjpg stream from the robot:
        <object-detection-model robot-stream="http://127.0.0.1:1181/?action=stream"></object-detection-model> 
        -->

        <!--
        To use a custom model:
        <object-detection-model model-url="/models/mobilenet_model/model.json"></object-detection-model> 
        -->
        <!-- <object-detection-model model-url="/models/ssdlite_mobilenet_v2/model.json"></object-detection-model>  -->
        <!-- <object-detection-model model-url="/models/ssdlite_mobilenet_v2/model.json"></object-detection-model> -->
        
        
        <!-- Uses builtin/usb webcam from computer using coco ssd model -->
        <object-detection-model></object-detection-model>
    `;
  }

}

window.customElements.define('tensorflow-example', TensorflowExample)