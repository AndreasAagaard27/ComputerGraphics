/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = function init() {
    const canvas = document.getElementById("c");
    const gl = WebGLUtils.setupWebGL(canvas);


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    const shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    const numSegments = 100;
    const radius = 0.5;
    const vertices = [0.0, 0.0];

    for (let i = 0; i <= numSegments; i++) {
        const angle = (i * 2 * Math.PI) / numSegments;
        vertices.push(radius * Math.cos(angle), radius * Math.sin(angle));
    }

    const colors = [1.0, 0.0, 0.0, 1.0];
    for (let i = 0; i <= numSegments; i++) {
        colors.push(0.0, 0.0, 0.0, 1.0); 
    }

    function createBuffer(data, attribute, size) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        const location = gl.getAttribLocation(shaderProgram, attribute);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(location);
    }

    createBuffer(vertices, "vPosition", 2);
    createBuffer(colors, "vColor", 4);

    let bounce = 0;
    let direction = 1;

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        const bounceMatrix = new Float32Array([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, bounce, 0.0, 1.0
        ]);

        const uBounceMatrix = gl.getUniformLocation(shaderProgram, "uRotationMatrix");
        gl.uniformMatrix4fv(uBounceMatrix, false, bounceMatrix);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);

        bounce += direction * 0.01;
        if (bounce > 0.5 || bounce < -0.5) direction *= -1;

        requestAnimationFrame(render);
    }

    render();
};