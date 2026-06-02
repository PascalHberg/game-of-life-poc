// ============================================
// GAME OF LIFE - PIXEL MODE
// ============================================

const CONFIG = {
    UPDATE_FREQUENCY: 10
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

let WIDTH = 200;
let HEIGHT = 120;

let running = false;
let grid = null;
let gridBuffer = null;

let frameCount = 0;

// ============================================
// GRID
// ============================================

function createRandomGrid() {
    return Array.from({ length: HEIGHT }, () =>
        new Uint8Array(WIDTH).map(() => (Math.random() > 0.7 ? 1 : 0))
    );
}

function createEmptyGrid() {
    return Array.from({ length: HEIGHT }, () => new Uint8Array(WIDTH));
}

function createGridBuffer() {
    return Array.from({ length: HEIGHT }, () => new Uint8Array(WIDTH));
}

// ============================================
// CANVAS
// ============================================

function initCanvas() {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    canvas.style.width = "100%";
    canvas.style.maxWidth = "800px";
    canvas.style.imageRendering = "pixelated";
}

// ============================================
// LOGIC
// ============================================

function countNeighbors(x, y) {
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const nx = (x + dx + WIDTH) % WIDTH;
            const ny = (y + dy + HEIGHT) % HEIGHT;

            count += grid[ny][nx];
        }
    }
    return count;
}

function step() {
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const n = countNeighbors(x, y);

            gridBuffer[y][x] =
                grid[y][x] === 1
                    ? (n === 2 || n === 3 ? 1 : 0)
                    : (n === 3 ? 1 : 0);
        }
    }

    [grid, gridBuffer] = [gridBuffer, grid];
}

// ============================================
// DRAW
// ============================================

function draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "black";

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (grid[y][x] === 1) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}

// ============================================
// LOOP
// ============================================

function loop() {
    if (running) {
        frameCount++;
        if (frameCount >= CONFIG.UPDATE_FREQUENCY) {
            step();
            frameCount = 0;
        }
    }

    draw();
    requestAnimationFrame(loop);
}

// ============================================
// INPUT (pixel mapping 1:1)
// ============================================

function getCell(e) {
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor((e.clientX - rect.left) * (WIDTH / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (HEIGHT / rect.height));

    if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
        return { x, y };
    }
    return null;
}

function paint(x, y, value) {
    grid[y][x] = value;
}

// Mouse
let isDown = false;

canvas.addEventListener("mousedown", (e) => {
    if (running) return;
    isDown = true;

    const c = getCell(e);
    if (c) paint(c.x, c.y, grid[c.y][c.x] ? 0 : 1);
});

canvas.addEventListener("mousemove", (e) => {
    if (!isDown || running) return;

    const c = getCell(e);
    if (c) paint(c.x, c.y, 1);
});

canvas.addEventListener("mouseup", () => (isDown = false));

// Touch
canvas.addEventListener("touchmove", (e) => {
    if (running) return;
    e.preventDefault();

    for (let t of e.touches) {
        const c = getCell(t);
        if (c) paint(c.x, c.y, 1);
    }
}, { passive: false });

// ============================================
// BUTTONS
// ============================================

document.getElementById("startBtn").onclick = () => {
    running = !running;
};

document.getElementById("stepBtn").onclick = () => {
    if (!running) {
        step();
        draw();
    }
};

document.getElementById("renewBtn").onclick = () => {
    grid = createRandomGrid();
    gridBuffer = createGridBuffer();
    draw();
};

document.getElementById("clearBtn").onclick = () => {
    grid = createEmptyGrid();
    gridBuffer = createGridBuffer();
    draw();
};

// ============================================
// INIT
// ============================================

function init() {
    initCanvas();
    grid = createRandomGrid();
    gridBuffer = createGridBuffer();

    loop();
}

init();
