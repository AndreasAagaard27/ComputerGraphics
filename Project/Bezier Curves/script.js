/**
* @param {Element} canvas. 
* @return {WebGLRenderingContext} 
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
    let bezierVertices = new Float32Array([]);
    let bezierColors = new Float32Array([]);


    let placeholderVertices = new Float32Array([]);
    let placeholderColors = new Float32Array([]);

    let points = [];
    let drawingMode = "point";
    let circleCenter = null;
    let drawCommands = [];

    let bezierControlPoints = [];

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

        if (placeholderVertices.length > 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
            gl.bufferData(gl.ARRAY_BUFFER, placeholderVertices, gl.STATIC_DRAW);
            gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
            gl.bufferData(gl.ARRAY_BUFFER, placeholderColors, gl.STATIC_DRAW);
            gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.POINTS, 0, placeholderVertices.length / 2);
        }
    }

    function getCurrentColor() {
        const pointColor = document.getElementById("pointColor").value;
        const r = parseInt(pointColor.substr(1, 2), 16) / 255;
        const g = parseInt(pointColor.substr(3, 2), 16) / 255;
        const b = parseInt(pointColor.substr(5, 2), 16) / 255;
        const a = 1.0;
        return {r, g, b, a};
    }

    function rationalQuadraticBezier(P0, P1, P2, w1, t) {
        let mt = (1 - t);
        let numeratorX = P0.x * mt * mt + 2 * w1 * P1.x * mt * t + P2.x * t * t;
        let numeratorY = P0.y * mt * mt + 2 * w1 * P1.y * mt * t + P2.y * t * t;

        let denominator = mt*mt + 2*w1*mt*t + t*t;
        return {
            x: numeratorX / denominator,
            y: numeratorY / denominator
        };
    }

    function addPlaceholderPoint(x, y, r, g, b, a) {
        let newPlaceholderVertices = new Float32Array(placeholderVertices.length + 2);
        newPlaceholderVertices.set(placeholderVertices);
        newPlaceholderVertices.set([x, y], placeholderVertices.length);
        placeholderVertices = newPlaceholderVertices;

        let newPlaceholderColors = new Float32Array(placeholderColors.length + 4);
        newPlaceholderColors.set(placeholderColors);
        newPlaceholderColors.set([r, g, b, a], placeholderColors.length);
        placeholderColors = newPlaceholderColors;
    }

    function removeLastNPlaceholderPoints(n) {
        placeholderVertices = placeholderVertices.slice(0, placeholderVertices.length - n * 2);
        placeholderColors = placeholderColors.slice(0, placeholderColors.length - n * 4);
    }

    canvas.addEventListener("click", function(event) {
        const rect = event.target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / canvas.width * 2 - 1;
        const y = (canvas.height - (event.clientY - rect.top)) / canvas.height * 2 - 1;

        const {r, g, b, a} = getCurrentColor();

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
            addPlaceholderPoint(x, y, r, g, b, a);

            if (points.length === 3) {
                removeLastNPlaceholderPoints(3);
                const newTriangleVertices = new Float32Array(triangleVertices.length + 6);
                newTriangleVertices.set(triangleVertices);
                newTriangleVertices.set([points[0].x, points[0].y,
                                         points[1].x, points[1].y,
                                         points[2].x, points[2].y], triangleVertices.length);
                triangleVertices = newTriangleVertices;

                const newTriangleColors = new Float32Array(triangleColors.length + 12);
                newTriangleColors.set(triangleColors);
                newTriangleColors.set([points[0].r, points[0].g, points[0].b, points[0].a,
                                       points[1].r, points[1].g, points[1].b, points[1].a,
                                       points[2].r, points[2].g, points[2].b, points[2].a],
                                        triangleColors.length);
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
                addPlaceholderPoint(x, y, r, g, b, a);
            } else {
                removeLastNPlaceholderPoints(1);

                const dx = x - circleCenter.x;
                const dy = y - circleCenter.y;
                const radius = Math.sqrt(dx * dx + dy * dy);

                const numSegments = 100;
                const angleStep = (2 * Math.PI) / numSegments;

                const newCircleVertices = [];
                const newCircleColors = [];

                for (let i = 0; i < numSegments; i++) {
                    const angle1 = i * angleStep;
                    const angle2 = (i + 1) * angleStep;

                    const x1 = circleCenter.x + radius * Math.cos(angle1);
                    const y1 = circleCenter.y + radius * Math.sin(angle1);
                    const x2 = circleCenter.x + radius * Math.cos(angle2);
                    const y2 = circleCenter.y + radius * Math.sin(angle2);

                    newCircleVertices.push(circleCenter.x, circleCenter.y, x1, y1, x2, y2);
                    newCircleColors.push(circleCenter.r, circleCenter.g, circleCenter.b, circleCenter.a,
                                         r, g, b, a,
                                         r, g, b, a);
                }

                circleVertices = new Float32Array([...circleVertices, ...newCircleVertices]);
                circleColors = new Float32Array([...circleColors, ...newCircleColors]);

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
        } else if (drawingMode === "bezier") {
            bezierControlPoints.push({ x, y, r, g, b, a });
            addPlaceholderPoint(x, y, r, g, b, a);

            if (bezierControlPoints.length === 3) {
                let P0 = bezierControlPoints[0];
                let P1 = bezierControlPoints[1];
                let P2 = bezierControlPoints[2];

                let w1 = parseFloat(prompt("Enter weight for the middle control point (default=1):", "1"));
                if (isNaN(w1)) {
                    w1 = 1.0;
                }

                removeLastNPlaceholderPoints(3);

                const segments = 100;
                const curveVertices = [];
                const curveColors = [];
                for (let i = 0; i <= segments; i++) {
                    let t = i / segments;
                    const pt = rationalQuadraticBezier(P0, P1, P2, w1, t);
                    curveVertices.push(pt.x, pt.y);
                    curveColors.push(r, g, b, a);
                }

                const startIndex = bezierVertices.length / 2;
                bezierVertices = new Float32Array([...bezierVertices, ...curveVertices]);
                bezierColors = new Float32Array([...bezierColors, ...curveColors]);

                const curveCount = segments + 1; 
                const offset = startIndex;
                drawCommands.push(() => {
                    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
                    gl.bufferData(gl.ARRAY_BUFFER, bezierVertices, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
                    gl.bufferData(gl.ARRAY_BUFFER, bezierColors, gl.STATIC_DRAW);
                    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

                    gl.drawArrays(gl.LINE_STRIP, offset, curveCount);
                });

                bezierControlPoints = [];
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
        bezierVertices = new Float32Array([]);
        bezierColors = new Float32Array([]);

        placeholderVertices = new Float32Array([]);
        placeholderColors = new Float32Array([]);

        points = [];
        circleCenter = null;
        bezierControlPoints = [];
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

    document.getElementById("bezierModeButton").addEventListener("click", function() {
        drawingMode = "bezier";
    });
};
