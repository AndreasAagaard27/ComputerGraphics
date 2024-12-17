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
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");

    let vertices = new Float32Array([
    ]);

    const bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const vPosition = gl.getAttribLocation(shaderProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.useProgram(shaderProgram);
    gl.drawArrays(gl.POINTS, 0, vertices.length / 2);

    // Event handler for mouse click
    canvas.addEventListener("click", function(event) {
        const rect = event.target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / canvas.width * 2 - 1;
        const y = (canvas.height - (event.clientY - rect.top)) / canvas.height * 2 - 1;

        // Add new point to vertices array
        const newVertices = new Float32Array(vertices.length + 2);
        newVertices.set(vertices);
        newVertices.set([x, y], vertices.length);
        vertices = newVertices;

        // Update buffer data
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Clear and redraw all points
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, vertices.length / 2);
    });
};