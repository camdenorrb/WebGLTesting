
import { initBuffers } from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

// Vertex shader program
const vsSource1 = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

// Adds shader code for color
const vsSource2 = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

const fsSource1 = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

const fsSource2 = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

main();

function main() {

    const canvas = document.getElementById('glcanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
      alert('Unable to initialize WebGL. Your browser may not support it.');
      return;
    }

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource2, fsSource2);

    // Collect all the info needed to use the shader program.
    // Look up which attribute our shader program is using
    // for aVertexPosition and look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
        },
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers(gl);

    // Draw the scene
    drawScene(gl, programInfo, buffers);

    let previousTime = 0;
    // Rotation in radians, 0.01 radians per second, doesn't reset
    let cubeRotation = 0.0;
    let deltaTime = 0;

    const frameTimes = [];
    let   frameCursor = 0;
    let   numFrames = 0;
    const maxFrames = 500;
    let   totalFPS = 0;

    const fpsElem = document.querySelector("#fps");


    // Draw the scene repeatedly
    function render(now) {

        now *= 0.001; // convert to seconds from milliseconds

        deltaTime = now - previousTime;
        previousTime = now;

        drawScene(gl, programInfo, buffers, cubeRotation);
        cubeRotation += deltaTime;

        const fps = 1 / deltaTime;             // compute frames per second

        // add the current fps and remove the oldest fps
        totalFPS += fps - (frameTimes[frameCursor] || 0);

        // record the newest fps
        frameTimes[frameCursor++] = fps;

        // needed so the first N frames, before we have maxFrames, is correct.
        numFrames = Math.max(numFrames, frameCursor);

        // wrap the cursor
        frameCursor %= maxFrames;

        const averageFPS = totalFPS / numFrames;

        fpsElem.textContent = averageFPS.toFixed(1);  // update avg display

        // Asks the browser to keep updating the animation by calling render
        requestAnimationFrame(render);
    }

    // Start the animation by asking the browser to call render
    requestAnimationFrame(render);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(
            `Unable to initialize the shader program: ${gl.getProgramInfoLog(
                shaderProgram,
            )}`,
        );
        return null;
    }

    return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(
            `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
        );
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}
