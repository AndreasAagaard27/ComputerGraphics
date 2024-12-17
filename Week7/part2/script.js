/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
// Setup WebGL and initialize shaders
var gl;
var uModelViewMatrix, uProjectionMatrix, uTexture;
var rectangleVertices, textureCoordinates;
var currentTexture;

// Initializes WebGL and loads the shaders
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    uTexture = gl.getUniformLocation(shaderProgram, "uTexture");

    const fovy = 90.0;
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 50.0;
    const perspectiveMatrix = perspective(fovy, aspect, near, far);
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(perspectiveMatrix));

    setupRectangle();
    setupTexture();

    // Event listeners for texture settings with render call to refresh on change
    document.getElementById("wrapMode").addEventListener("change", () => {
        updateTextureParameters();
        render(); // Refresh render after updating texture parameters
    });
    document.getElementById("filterMode").addEventListener("change", () => {
        updateTextureParameters();
        render(); // Refresh render after updating texture parameters
    });

    render();
};

// Sets up the rectangle geometry
function setupRectangle() {
    rectangleVertices = [
        vec4(-4, -1, -1, 1),
        vec4(4, -1, -1, 1),
        vec4(4, -1, -21, 1),
        vec4(-4, -1, -21, 1)
    ];

    textureCoordinates = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0)
    ];

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(rectangleVertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoordinates), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);
}

// Creates and sets up the checkerboard texture
function setupTexture() {
    currentTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, currentTexture);

    const size = 64;
    const numCheckers = 8;
    var imageData = new Uint8Array(size * size * 4);

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let checker = ((i / numCheckers | 0) + (j / numCheckers | 0)) % 2;
            let color = checker ? 255 : 0;

            let index = 4 * (i * size + j);
            imageData[index] = color;
            imageData[index + 1] = color;
            imageData[index + 2] = color;
            imageData[index + 3] = 255;
        }
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

    updateTextureParameters(); // Initial setup of texture parameters
}

// Updates texture wrapping and filtering modes based on user input
function updateTextureParameters() {
    gl.bindTexture(gl.TEXTURE_2D, currentTexture);

    // Set wrapping mode
    const wrapMode = document.getElementById("wrapMode").value;
    const wrap = (wrapMode === "REPEAT") ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);

    // Set filtering mode
    const filterMode = document.getElementById("filterMode").value;
    const filterOptions = {
        "NEAREST": gl.NEAREST,
        "LINEAR": gl.LINEAR,
        "NEAREST_MIPMAP_NEAREST": gl.NEAREST_MIPMAP_NEAREST,
        "LINEAR_MIPMAP_NEAREST": gl.LINEAR_MIPMAP_NEAREST,
        "NEAREST_MIPMAP_LINEAR": gl.NEAREST_MIPMAP_LINEAR,
        "LINEAR_MIPMAP_LINEAR": gl.LINEAR_MIPMAP_LINEAR,
    };
    const filter = filterOptions[filterMode];

    if (filterMode.includes("MIPMAP")) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, (filter === gl.LINEAR_MIPMAP_LINEAR || filter === gl.LINEAR) ? gl.LINEAR : gl.NEAREST);
}

// Render the rectangle with the applied texture settings
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const eye = vec3(0, 0, 10);
    const at = vec3(0, 0, -10);
    const up = vec3(0, 1, 0);
    const modelViewMatrix = lookAt(eye, at, up);

    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
    gl.uniform1i(uTexture, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}
