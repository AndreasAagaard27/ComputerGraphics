/**
 * @param {Element} canvas The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
var gl;
var spherePoints = [];
var numSubdivisions = 3;
var earthTexture;
var startTime;

var sphereBuffer;
var quadBuffer;

var uProjectionMatrixLoc;
var uModelViewMatrixLoc;
var uMtexLoc;

var shaderProgram;

var perspectiveMatrix;
var modelViewMatrix;

var quadVertices = [
    vec4(-1, -1, 0.999, 1),
    vec4(1, -1, 0.999, 1),
    vec4(1, 1, 0.999, 1),
    vec4(-1, 1, 0.999, 1)
];

function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.frontFace(gl.CW);

    shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    uProjectionMatrixLoc = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    uModelViewMatrixLoc = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
    uMtexLoc = gl.getUniformLocation(shaderProgram, "uMtex");

    var fovy = 45.0;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 10.0;
    perspectiveMatrix = perspective(fovy, aspect, near, far);

    loadCubeMap(function(texture) {
        earthTexture = texture;
        createSphere();
        bufferSphereGeometry();
        bufferQuadGeometry();
        startTime = performance.now();
        render();
    });

    document.getElementById("increase").onclick = function() {
        numSubdivisions++;
        resetGeometry();
    };

    document.getElementById("decrease").onclick = function() {
        if (numSubdivisions > 0) {
            numSubdivisions--;
            resetGeometry();
        }
    };
};

function loadCubeMap(callback) {
    const cubemapPaths = [
        '/Week8/textures/cm_left.png',
        '/Week8/textures/cm_right.png',
        '/Week8/textures/cm_top.png',
        '/Week8/textures/cm_bottom.png',
        '/Week8/textures/cm_back.png',
        '/Week8/textures/cm_front.png'
    ];
    
    const targets = [
        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    const cubemapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);

    let imagesLoaded = 0;
    cubemapPaths.forEach((path, index) => {
        const image = new Image();
        image.onload = function(event) {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
            gl.texImage2D(targets[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, event.target);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

            imagesLoaded++;
            if (imagesLoaded === 6) {
                callback(cubemapTexture);
            }
        };
        image.src = path;
    });
}

function createSphere() {
    spherePoints = [];
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);
    tetrahedron(va, vb, vc, vd, numSubdivisions);
}

function resetGeometry() {
    createSphere();
    bufferSphereGeometry();
    startTime = performance.now();  
    render();
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count) {
    if (count === 0) {
        spherePoints.push(a);
        spherePoints.push(b);
        spherePoints.push(c);
    } else {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);
        --count;
        divideTriangle(a, ab, ac, count);
        divideTriangle(ab, b, bc, count);
        divideTriangle(bc, c, ac, count);
        divideTriangle(ab, bc, ac, count);
    }
}

function bufferSphereGeometry() {
    sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(spherePoints), gl.STATIC_DRAW);
}

function bufferQuadGeometry() {
    var quadPoints = [
        quadVertices[0], quadVertices[1], quadVertices[2],
        quadVertices[0], quadVertices[2], quadVertices[3]
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, flatten(quadPoints), gl.STATIC_DRAW);
    quadBuffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var currentTime = performance.now();
    var theta = 0.001 * (currentTime - startTime);

    var eye = vec3(5 * Math.sin(theta), 0, 5 * Math.cos(theta));
    modelViewMatrix = lookAt(eye, [0, 0, 0], [0, 1, 0]);

    var rotationOnly = mat4(
        modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2], 0,
        modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2], 0,
        modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2], 0,
        0, 0, 0, 1
    );

    var inverseProjection = inverse(perspectiveMatrix);
    var inverseViewRotation = transpose(rotationOnly);
    var MtexForQuad = mult(inverseViewRotation, inverseProjection);

    var MtexForSphere = mat4();

    var identityMat = mat4();
    gl.uniformMatrix4fv(uProjectionMatrixLoc, false, flatten(identityMat));
    gl.uniformMatrix4fv(uModelViewMatrixLoc, false, flatten(identityMat));
    gl.uniformMatrix4fv(uMtexLoc, false, flatten(MtexForQuad));
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uIsBackground"), true);

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    var vPosition = gl.getAttribLocation(shaderProgram, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, earthTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.uniformMatrix4fv(uProjectionMatrixLoc, false, flatten(perspectiveMatrix));
    gl.uniformMatrix4fv(uModelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(uMtexLoc, false, flatten(MtexForSphere));
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uIsBackground"), false);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.TRIANGLES, 0, spherePoints.length);

    requestAnimationFrame(render);
}
