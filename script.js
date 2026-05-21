const WIDTH = 60;
const HEIGHT = 60;
const CELL_SIZE = 10;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = WIDTH * CELL_SIZE;
canvas.height = HEIGHT * CELL_SIZE;

let running = false;
let intervalId = null;

let grid = createRandomGrid();


// --------------------------
// GRID
// --------------------------

function createRandomGrid() {
    return Array.from({ length: HEIGHT }, () =>
        Array.from({ length: WIDTH }, () => Math.random() > 0.7 ? 1 : 0)
    );
}

function createEmptyGrid() {
    return Array.from({ length: HEIGHT }, () =>
        Array(WIDTH).fill(0)
    );
}


// --------------------------
// DRAW
// --------------------------

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {

            ctx.fillStyle = grid[y][x] ? "black" : "white";

            ctx.fillRect(
                x * CELL_SIZE,
                y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );

            ctx.strokeRect(
                x * CELL_SIZE,
                y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
        }
    }
}


// --------------------------
// NEIGHBORS
// --------------------------

function neighbors(x, y) {
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


// --------------------------
// STEP
// --------------------------

function step() {
    const newGrid = grid.map(row => [...row]);

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {

            const n = neighbors(x, y);

            if (grid[y][x] === 1) {
                newGrid[y][x] = (n === 2 || n === 3) ? 1 : 0;
            } else {
                newGrid[y][x] = (n === 3) ? 1 : 0;
            }
        }
    }

    grid = newGrid;
}


// --------------------------
// LOOP CONTROL
// --------------------------

function startLoop() {
    if (intervalId) return;

    intervalId = setInterval(() => {
        step();
        draw();
    }, 100);
}

function stopLoop() {
    clearInterval(intervalId);
    intervalId = null;
}


// --------------------------
// BUTTONS
// --------------------------

const startBtn = document.getElementById("startBtn");

startBtn.onclick = () => {
    running = !running;

    if (running) {
        startBtn.textContent = "Stop";
        startBtn.style.background = "red";
        startLoop();
    } else {
        startBtn.textContent = "Start";
        startBtn.style.background = "green";
        stopLoop();
    }
};

document.getElementById("stepBtn").onclick = () => {
    if (!running) {
        step();
        draw();
    }
};

document.getElementById("renewBtn").onclick = () => {
    grid = createRandomGrid();
    draw();
};

document.getElementById("clearBtn").onclick = () => {
    grid = createEmptyGrid();
    draw();
};


// --------------------------
// INIT
// --------------------------

draw();
