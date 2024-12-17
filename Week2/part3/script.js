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

    let pointVertices = new Float32Array([]);
    let pointColors = new Float32Array([]);
    let triangleVertices = new Float32Array([]);
    let triangleColors = new Float32Array([]);
    let points = [];
    let drawingMode = "point";

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

    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Draw points
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, pointVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, pointColors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.POINTS, 0, pointVertices.length / 2);

        // Draw triangles
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, triangleColors, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, triangleVertices.length / 2);
    }

    canvas.addEventListener("click", function(event) {
        const rect = event.target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / canvas.width * 2 - 1;
        const y = (canvas.height - (event.clientY - rect.top)) / canvas.height * 2 - 1;

        const pointColor = document.getElementById("pointColor").value;
        const r = parseInt(pointColor.substr(1, 2), 16) / 255;
        const g = parseInt(pointColor.substr(3, 2), 16) / 255;
        const b = parseInt(pointColor.substr(5, 2), 16) / 255;
        const a = 1.0;

        if (drawingMode === "point") {
            const newPointVertices = new Float32Array(pointVertices.length + 2);
            newPointVertices.set(pointVertices);
            newPointVertices.set([x, y], pointVertices.length);
            pointVertices = newPointVertices;

            const newPointColors = new Float32Array(pointColors.length + 4);
            newPointColors.set(pointColors);
            newPointColors.set([r, g, b, a], pointColors.length);
            pointColors = newPointColors;
        } else if (drawingMode === "triangle") {
            points.push({ x, y, r, g, b, a });

            // Draw the points of the triangle as they are clicked
            const newPointVertices = new Float32Array(pointVertices.length + 2);
            newPointVertices.set(pointVertices);
            newPointVertices.set([x, y], pointVertices.length);
            pointVertices = newPointVertices;

            const newPointColors = new Float32Array(pointColors.length + 4);
            newPointColors.set(pointColors);
            newPointColors.set([r, g, b, a], pointColors.length);
            pointColors = newPointColors;

            if (points.length === 3) {
                // Remove the last two points from pointVertices and pointColors
                pointVertices = pointVertices.slice(0, -6);
                pointColors = pointColors.slice(0, -12);

                // Add the triangle
                const newTriangleVertices = new Float32Array(triangleVertices.length + 6);
                newTriangleVertices.set(triangleVertices);
                newTriangleVertices.set([points[0].x, points[0].y, points[1].x, points[1].y, points[2].x, points[2].y], triangleVertices.length);
                triangleVertices = newTriangleVertices;

                const newTriangleColors = new Float32Array(triangleColors.length + 12);
                newTriangleColors.set(triangleColors);
                newTriangleColors.set([points[0].r, points[0].g, points[0].b, points[0].a, points[1].r, points[1].g, points[1].b, points[1].a, points[2].r, points[2].g, points[2].b, points[2].a], triangleColors.length);
                triangleColors = newTriangleColors;

                points = []; 
            }
        }

        draw();
    });

    document.getElementById("clearButton").addEventListener("click", function() {
        const clearColor = document.getElementById("clearColor").value;
        const r = parseInt(clearColor.substr(1, 2), 16) / 255;
        const g = parseInt(clearColor.substr(3, 2), 16) / 255;
        const b = parseInt(clearColor.substr(5, 2), 16) / 255;
        const a = 1.0;

        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);

        pointVertices = new Float32Array([]);
        pointColors = new Float32Array([]);
        triangleVertices = new Float32Array([]);
        triangleColors = new Float32Array([]);
        points = [];
    });

    document.getElementById("pointModeButton").addEventListener("click", function() {
        drawingMode = "point";
    });

    document.getElementById("triangleModeButton").addEventListener("click", function() {
        drawingMode = "triangle";
    });
};