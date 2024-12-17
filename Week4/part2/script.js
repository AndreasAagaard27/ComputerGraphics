/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = function init() {
    var canvas = document.getElementById("c");
    var gl = setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT);

    const shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    // cube vertices
    const vertices = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        1, 1, 0,
        0, 1, 0,
        0, 0, 1,
        1, 0, 1,
        1, 1, 1,
        0, 1, 1
    ]);

    // Cube edges
    const edges = new Uint16Array([
        0, 1, 1, 2, 2, 3, 3, 0, // Bottom face
        4, 5, 5, 6, 6, 7, 7, 4, // Top face
        0, 4, 1, 5, 2, 6, 3, 7  // Vertical edges
    ]);

    // Buffer for vertices
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Buffer for edges
    const edgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, edges, gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(shaderProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //Perspective projection matrix
    const fovy = 45.0; //fov vertical
    const aspect = canvas.width / canvas.height
    const near = 0.1
    const far = 10.0
    const perspectiveMatrix = perspective(fovy, aspect, near, far);

    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");

    // Set the perspective matrix once
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(perspectiveMatrix));
    //these have been spread out to show the different view points and make it easier to look at instead of all the squares being at the same point ([0, 0, 0])
    // one point
    let modelViewMatrix = lookAt([0, 0, 5], [2, 0, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
    gl.drawElements(gl.LINES, edges.length, gl.UNSIGNED_SHORT, 0);

    // two point
    modelViewMatrix = lookAt([3, 0, 3], [-1, 0, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
    gl.drawElements(gl.LINES, edges.length, gl.UNSIGNED_SHORT, 0);

    //three point
    modelViewMatrix = lookAt([3, 3, 3], [0, 1.1, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
    gl.drawElements(gl.LINES, edges.length, gl.UNSIGNED_SHORT, 0);
};
