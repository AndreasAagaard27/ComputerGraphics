/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}
var gl;
var uModelViewMatrix, uProjectionMatrix, uTexture;

var groundBuffer, groundTexBuffer;
var redQuad1Buffer, redQuad1TexBuffer;
var redQuad2Buffer, redQuad2TexBuffer;

var groundTexture, redTexture;

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    var shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    uModelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    uTexture = gl.getUniformLocation(shaderProgram, "uTexture");

    var fovy = 20.0;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 50.0;
    var perspectiveMatrix = perspective(fovy, aspect, near, far);
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(perspectiveMatrix));

    setupGround();
    setupRedQuads();
    setupTextures();

    render();
};

function setupGround() {
    var groundVertices = [
        vec4(-2, -1, 10, 1),
        vec4( 2, -1, 10, 1),
        vec4( 2, -1, -5, 1),
        vec4(-2, -1, -5, 1)
    ];    

    var groundTexCoords = [
        vec2(0.0, 0.0),
        vec2(1.0, 0.0),
        vec2(1.0, 1.0),
        vec2(0.0, 1.0)
    ];

    groundBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(groundVertices), gl.STATIC_DRAW);

    groundTexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, groundTexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(groundTexCoords), gl.STATIC_DRAW);
}

function setupRedQuads() {
    var redQuad1Vertices = [
        vec4(0.25, -0.5, -1.25, 1),
        vec4(0.75, -0.5, -1.25, 1),
        vec4(0.75, -0.5, -1.75, 1),
        vec4(0.25, -0.5, -1.75, 1)
    ];

    var redQuad2Vertices = [
        vec4(-1, -1, -2.5, 1),
        vec4(-1,  0, -2.5, 1),
        vec4(-1,  0, -3.0, 1),
        vec4(-1, -1, -3.0, 1)
    ];

    var redTexCoords = [
        vec2(0.0,0.0),
        vec2(1.0,0.0),
        vec2(1.0,1.0),
        vec2(0.0,1.0)
    ];

    redQuad1Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad1Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(redQuad1Vertices), gl.STATIC_DRAW);

    redQuad1TexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad1TexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(redTexCoords), gl.STATIC_DRAW);

    redQuad2Buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad2Buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(redQuad2Vertices), gl.STATIC_DRAW);

    redQuad2TexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad2TexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(redTexCoords), gl.STATIC_DRAW);
}

function setupTextures() {
    groundTexture = gl.createTexture();
    var groundImage = new Image();
    groundImage.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, groundTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, groundImage);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    groundImage.src = "/Week9/xamp23.png"; 

    gl.activeTexture(gl.TEXTURE1);
    redTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, redTexture);
    var redPixel = new Uint8Array([255, 0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,redPixel);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.activeTexture(gl.TEXTURE0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(0,0,10);
    var at = vec3(0,0,-10);
    var up = vec3(0,1,0);
    var modelViewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTexture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, groundBuffer);
    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.vertexAttribPointer(vPosition,4,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, groundTexBuffer);
    var vTexCoord = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vTexCoord");
    gl.vertexAttribPointer(vTexCoord,2,gl.FLOAT,false,0,0);
    gl.enableVertexAttribArray(vTexCoord);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform1i(uTexture, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad1Buffer);
    gl.vertexAttribPointer(vPosition,4,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad1TexBuffer);
    gl.vertexAttribPointer(vTexCoord,2,gl.FLOAT,false,0,0);

    gl.drawArrays(gl.TRIANGLE_FAN,0,4);

    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad2Buffer);
    gl.vertexAttribPointer(vPosition,4,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, redQuad2TexBuffer);
    gl.vertexAttribPointer(vTexCoord,2,gl.FLOAT,false,0,0);

    gl.drawArrays(gl.TRIANGLE_FAN,0,4);

    requestAnimationFrame(render);
}
