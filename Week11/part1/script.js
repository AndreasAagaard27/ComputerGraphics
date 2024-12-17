/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

var gl;
var points = [];
var numSubdivisions = 3;

var kd = 0.8;
var ks = 0.5;
var shininess = 20.0;
var le = 1.0;
var la = 0.2;

var uModelViewMatrix, uKd, uKs, uShininess, uLe, uLa;

// Camera parameters
var radius = 5.0;
var theta = 0.0;    
var phi = Math.PI/2; 
var target = vec3(0,0,0); 

// Mouse interaction variables
var isMouseDown = false;
var lastMouseX, lastMouseY;
var mouseButton;  

// Sensitivity settings
var orbitSensitivity = 0.01;
var panSensitivity = 0.005;
var dollySensitivity = 0.1;

window.onload = function init() {
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

    createSphere();
    bufferGeometry();

    document.getElementById("kdSlider").addEventListener("input", function(event) {
        kd = parseFloat(event.target.value);
    });
    document.getElementById("ksSlider").addEventListener("input", function(event) {
        ks = parseFloat(event.target.value);
    });
    document.getElementById("shininessSlider").addEventListener("input", function(event) {
        shininess = parseFloat(event.target.value);
    });
    document.getElementById("leSlider").addEventListener("input", function(event) {
        le = parseFloat(event.target.value);
    });
    document.getElementById("laSlider").addEventListener("input", function(event) {
        la = parseFloat(event.target.value);
    });

    document.getElementById("increase").onclick = function() {
        numSubdivisions++;
        createSphere();
        bufferGeometry();
    };

    document.getElementById("decrease").onclick = function() {
        if (numSubdivisions > 0) {
            numSubdivisions--;
            createSphere();
            bufferGeometry();
        }
    };

    // Set up mouse events
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onMouseWheel);

    requestAnimationFrame(render);
};

function onMouseDown(event) {
    isMouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    mouseButton = event.button; 
}

function onMouseMove(event) {
    if (!isMouseDown) return;

    var dx = event.clientX - lastMouseX;
    var dy = event.clientY - lastMouseY;

    if (mouseButton === 0) {
        theta += dx * orbitSensitivity;
        phi -= dy * orbitSensitivity;
        phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));
    } else if (mouseButton === 1) {
        var eye = computeEyePosition();
        var forward = subtract(target, eye);
        forward = normalize(forward);

        var up = vec3(0,1,0);
        var right = normalize(cross(forward, up));
        up = normalize(cross(right, forward));

        var panX = scale(right, -dx * panSensitivity);
        var panY = scale(up, dy * panSensitivity);

        target = add(target, add(panX, panY));
    } else if (mouseButton === 2) {
        radius += dy * dollySensitivity;
        radius = Math.max(radius, 0.1); 
    }

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function onMouseUp(event) {
    isMouseDown = false;
}

function onMouseWheel(event) {
    event.preventDefault();
    radius += event.deltaY * 0.01;
    radius = Math.max(radius, 0.1);
}

function computeEyePosition() {
    var x = radius * Math.sin(phi) * Math.sin(theta);
    var y = radius * Math.cos(phi);
    var z = radius * Math.sin(phi) * Math.cos(theta);
    return vec3(x, y, z).map(function(v,i){return v+target[i];});
}

function createSphere() {
    points = [];
    var va = vec4(0.0, 0.0, -1.0, 1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1);

    tetrahedron(va, vb, vc, vd, numSubdivisions);
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

    var eye = computeEyePosition();
    var modelViewMatrix = lookAt(eye, target, vec3(0,1,0));

    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));

    gl.uniform1f(uKd, kd);
    gl.uniform1f(uKs, ks);
    gl.uniform1f(uShininess, shininess);
    gl.uniform1f(uLe, le);
    gl.uniform1f(uLa, la);

    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    requestAnimationFrame(render);
}
