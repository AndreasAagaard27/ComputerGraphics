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

    let vertices = new Float32Array([]);
    let colors = new Float32Array([]);

    const bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    const vPosition = gl.getAttribLocation(shaderProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    const colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);

    const vColor = gl.getAttribLocation(shaderProgram, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.useProgram(shaderProgram);

    canvas.addEventListener("click", function(event) {
        const rect = event.target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / canvas.width * 2 - 1;
        const y = (canvas.height - (event.clientY - rect.top)) / canvas.height * 2 - 1;

        const newVertices = new Float32Array(vertices.length + 2);
        newVertices.set(vertices);
        newVertices.set([x, y], vertices.length);
        vertices = newVertices;

        const pointColor = document.getElementById("pointColor").value;
        const r = parseInt(pointColor.substr(1, 2), 16) / 255;
        const g = parseInt(pointColor.substr(3, 2), 16) / 255;
        const b = parseInt(pointColor.substr(5, 2), 16) / 255;
        const a = 1.0;

        const newColors = new Float32Array(colors.length + 4);
        newColors.set(colors);
        newColors.set([r, g, b, a], colors.length);
        colors = newColors;

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, vertices.length / 2);
    });

    document.getElementById("clearButton").addEventListener("click", function() {
        const clearColor = document.getElementById("clearColor").value;
        const r = parseInt(clearColor.substr(1, 2), 16) / 255;
        const g = parseInt(clearColor.substr(3, 2), 16) / 255;
        const b = parseInt(clearColor.substr(5, 2), 16) / 255;
        const a = 1.0;

        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);

        vertices = new Float32Array([]);
        colors = new Float32Array([]);
    });
};