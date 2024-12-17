/**
 * @param {Element} canvas. The canvas element to create a context from.
 * @return {WebGLRenderingContext} The created context.
 */
var gl;
var points = [];
var numSubdivisions = 3;
var earthTexture;
var startTime;

function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);

    const shaderProgram = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(shaderProgram);

    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
    const fovy = 45.0;
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 10.0;
    const perspectiveMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(perspectiveMatrix));

    loadCubeMap(function(texture) {
        earthTexture = texture;
        createSphere();
        bufferGeometry();
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

    startTime = performance.now();
};

function loadCubeMap(callback) {
    const cubemapPaths = [
        '/Week8/textures/cm_left.png',    // POSITIVE_X
        '/Week8/textures/cm_right.png',   // NEGATIVE_X
        '/Week8/textures/cm_top.png',     // POSITIVE_Y
        '/Week8/textures/cm_bottom.png',  // NEGATIVE_Y
        '/Week8/textures/cm_back.png',    // POSITIVE_Z
        '/Week8/textures/cm_front.png'    // NEGATIVE_Z
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
    points = [];
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    tetrahedron(va, vb, vc, vd, numSubdivisions);
}

function resetGeometry() {
    createSphere();
    bufferGeometry();
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
        points.push(a);
        points.push(b);
        points.push(c);
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

function bufferGeometry() {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var currentTime = performance.now();
    var theta = 0.001 * (currentTime - startTime);

    var eye = vec3(5 * Math.sin(theta), 0, 5 * Math.cos(theta));
    var modelViewMatrix = lookAt(eye, [0, 0, 0], [0, 1, 0]);

    var uModelViewMatrix = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), "uModelViewMatrix");
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, earthTexture);
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    requestAnimationFrame(render);
}
