/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
function setupWebGL(canvas) {
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.error("WebGL 2.0 is not available.");
        return null;
    }
    return gl;
}

var gl;
var theta = 0.0;
var lastTime = 0;

var kd = 0.8;
var ks = 0.5;
var shininess = 20.0;
var le = 1.0;
var la = 0.2;

var uKd, uKs, uShininess, uLe, uLa;
var uModelViewMatrix;

window.onload = async function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    uKd = gl.getUniformLocation(shaderProgram, "kd");
    uKs = gl.getUniformLocation(shaderProgram, "ks");
    uShininess = gl.getUniformLocation(shaderProgram, "shininess");
    uLe = gl.getUniformLocation(shaderProgram, "le");
    uLa = gl.getUniformLocation(shaderProgram, "la");

    const fovy = 45.0;
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 10.0;
    const perspectiveMatrix = perspective(fovy, aspect, near, far);
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(perspectiveMatrix));

    await loadAndBufferOBJ();

    requestAnimationFrame(render);
};

async function loadAndBufferOBJ() {
    const objFileName = 'Monkeeey.obj';
    const scale = 1.0;
    const reverse = false;

    
    const drawingInfo = await readOBJFile(objFileName, scale, reverse);
    if (!drawingInfo) {
        console.error("Failed to load OBJ file");
        return;
    }

    bufferOBJGeometry(drawingInfo);
}


function bufferOBJGeometry(drawingInfo) {
    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    // Create and bind normal buffer
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    // Create and bind color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    // Create and bind index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    // Store buffer information
    gl.vertexBuffer = vertexBuffer;
    gl.normalBuffer = normalBuffer;
    gl.colorBuffer = colorBuffer;
    gl.indexBuffer = indexBuffer;
    gl.numIndices = drawingInfo.indices.length;

    // Enable vertex attributes
    const vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const vColor = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vColor");
    if (vColor !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);
    }
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var currentTime = Date.now();
    
    if (lastTime !== 0) {
        var deltaTime = (currentTime - lastTime) / 1000.0;
        theta += deltaTime * 0.5; 
    }

    lastTime = currentTime; 

    var eye = vec3(5 * Math.sin(theta), 0, 5 * Math.cos(theta));
    var modelViewMatrix = lookAt(eye, [0, 0, 0], [0, 1, 0]);

    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));

    gl.uniform1f(uKd, kd);
    gl.uniform1f(uKs, ks);
    gl.uniform1f(uShininess, shininess);
    gl.uniform1f(uLe, le);
    gl.uniform1f(uLa, la);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.indexBuffer);
    gl.drawElements(gl.TRIANGLES, gl.numIndices, gl.UNSIGNED_INT, 0);

    requestAnimationFrame(render);
}
