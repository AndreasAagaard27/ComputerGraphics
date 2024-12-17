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
    let circleVertices = new Float32Array([]);
    let circleColors = new Float32Array([]);
    let points = [];
    let drawingMode = "point";
    let circleCenter = null;
    let drawCommands = [];

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

        drawCommands.forEach(command => {
            command();
        });
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

            drawCommands.push(() => {
                gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
                gl.bufferData(gl.ARRAY_BUFFER, pointVertices, gl.STATIC_DRAW);
                gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
                gl.bufferData(gl.ARRAY_BUFFER, pointColors, gl.STATIC_DRAW);
                gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

                gl.drawArrays(gl.POINTS, 0, pointVertices.length / 2);
            });
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

                drawCommands.push(() => {
                    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
                    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
                    gl.bufferData(gl.ARRAY_BUFFER, triangleColors, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

                    gl.drawArrays(gl.TRIANGLES, 0, triangleVertices.length / 2);
                });
            }
        } else if (drawingMode === "circle") {
            if (!circleCenter) {
                circleCenter = { x, y, r, g, b, a };
                const newPointVertices = new Float32Array(pointVertices.length + 2);
                newPointVertices.set(pointVertices);
                newPointVertices.set([x, y], pointVertices.length);
                pointVertices = newPointVertices;

                const newPointColors = new Float32Array(pointColors.length + 4);
                newPointColors.set(pointColors);
                newPointColors.set([r, g, b, a], pointColors.length);
                pointColors = newPointColors;
            } else {
                const dx = x - circleCenter.x;
                const dy = y - circleCenter.y;
                const radius = Math.sqrt(dx * dx + dy * dy);

                const numSegments = 100;
                const angleStep = (2 * Math.PI) / numSegments;

                const newCircleVertices = new Float32Array(circleVertices.length + numSegments * 6);
                const newCircleColors = new Float32Array(circleColors.length + numSegments * 12);

                for (let i = 0; i < numSegments; i++) {
                    const angle1 = i * angleStep;
                    const angle2 = (i + 1) * angleStep;

                    const x1 = circleCenter.x + radius * Math.cos(angle1);
                    const y1 = circleCenter.y + radius * Math.sin(angle1);
                    const x2 = circleCenter.x + radius * Math.cos(angle2);
                    const y2 = circleCenter.y + radius * Math.sin(angle2);

                    newCircleVertices.set([circleCenter.x, circleCenter.y, x1, y1, x2, y2], circleVertices.length + i * 6);
                    newCircleColors.set([circleCenter.r, circleCenter.g, circleCenter.b, circleCenter.a, r, g, b, a, r, g, b, a], circleColors.length + i * 12);
                }

                circleVertices = new Float32Array([...circleVertices, ...newCircleVertices]);
                circleColors = new Float32Array([...circleColors, ...newCircleColors]);

                // Remove the center point from pointVertices and pointColors
                pointVertices = pointVertices.slice(0, -2);
                pointColors = pointColors.slice(0, -4);

                circleCenter = null;

                drawCommands.push(() => {
                    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
                    gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
                    gl.bufferData(gl.ARRAY_BUFFER, circleColors, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

                    gl.drawArrays(gl.TRIANGLES, 0, circleVertices.length / 2);
                });
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
        circleVertices = new Float32Array([]);
        circleColors = new Float32Array([]);
        points = [];
        circleCenter = null;
        drawCommands = [];
    });

    document.getElementById("pointModeButton").addEventListener("click", function() {
        drawingMode = "point";
    });

    document.getElementById("triangleModeButton").addEventListener("click", function() {
        drawingMode = "triangle";
    });

    document.getElementById("circleModeButton").addEventListener("click", function() {
        drawingMode = "circle";
    });
};