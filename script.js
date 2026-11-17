
// OMWESO + SPIN AND WIN
// Human vs Human and Human vs Computer (Easy)

// Visual row order from index.html.
const ROW_IDS = ["row2", "row1", "row3", "row4"];

const PITS_PER_ROW = 8;
const TOTAL_PITS = 32;

let board = Array(TOTAL_PITS).fill(0);
let captured = [0, 0];
let bonusPoints = [0, 0];

let currentPlayer = 0;
let gameMode = "human";
let computerThinking = false;
let computerIsMakingMove = false;

let gameStarted = false;
let gameOver = false;

// Setup variables.
let setupPhase = false;
let setupPlayer = 0;
let selectedSetupPit = null;
let setupUsed = Array(TOTAL_PITS).fill(false);

const $ = (id) => document.getElementById(id);

// Player 1 owns bottom two rows.
// Player 2 owns top two rows.
function playerOwns(index, player) {
  return player === 0 ? index >= 16 : index < 16;
}

function playerName(player = currentPlayer) {
  return player === 0 ? "PLAYER 1" : "PLAYER 2";
}

// Movement paths.
function getPlayerPath(player) {
  if (player === 0) {
    return [
      24, 25, 26, 27, 28, 29, 30, 31,
      23, 22, 21, 20, 19, 18, 17, 16
    ];
  }

  return [
    7, 6, 5, 4, 3, 2, 1, 0,
    8, 9, 10, 11, 12, 13, 14, 15
  ];
}

// Start or restart.
function startGame() {
  gameMode = $("gameMode").value;

  computerThinking = false;
  computerIsMakingMove = false;

  board = Array(TOTAL_PITS).fill(0);

  // Player 2 initial arrangement.
  for (let i = 0; i < 8; i++) {
    board[i] = 4;
  }

  // Player 1 initial arrangement.
  for (let i = 24; i < 32; i++) {
    board[i] = 4;
  }

  captured = [0, 0];
  bonusPoints = [0, 0];

  currentPlayer = 0;
  gameStarted = false;
  gameOver = false;

  setupPhase = true;
  setupPlayer = 0;
  selectedSetupPit = null;
  setupUsed = Array(TOTAL_PITS).fill(false);

  $("result").textContent = "Bonus points are available during play.";

  render();

  setStatus("SETUP: Player 1, arrange your seeds.");
}

// Display the board.
function render() {
  const computerTurn =
    gameMode === "computer" &&
    currentPlayer === 1 &&
    gameStarted;

  ROW_IDS.forEach((rowId, rowIndex) => {
    const row = $(rowId);
    row.innerHTML = "";

    for (let col = 0; col < PITS_PER_ROW; col++) {
      const index = rowIndex * PITS_PER_ROW + col;

      const pit = document.createElement("button");

      pit.type = "button";
      pit.className = "pit";
      pit.textContent = board[index];

      pit.setAttribute(
        "aria-label",
        `Row ${rowIndex + 1}, pit ${col + 1}, ${board[index]} seeds`
      );

      pit.disabled = gameOver || (
        setupPhase
          ? (
              !playerOwns(index, setupPlayer) ||
              (gameMode === "computer" && setupPlayer === 1)
            )
          : (
              !gameStarted ||
              !playerOwns(index, currentPlayer) ||
              board[index] < 2 ||
              computerTurn ||
              computerThinking
            )
      );

      if (!pit.disabled) {
        pit.classList.add("selectable");
      }

      pit.addEventListener("click", () => {
        if (setupPhase) {
          handleSetupPit(index);
        } else {
          playPit(index);
        }
      });

      row.appendChild(pit);
    }
  });

  $("score1").textContent = captured[0] + bonusPoints[0];
  $("score2").textContent = captured[1] + bonusPoints[1];

  $("remaining").textContent =
    board.reduce((sum, n) => sum + n, 0);

  $("turn").textContent = gameOver
    ? "FINISHED"
    : setupPhase
      ? `${playerName(setupPlayer)} SETUP`
      : computerThinking
        ? "COMPUTER THINKING"
        : computerTurn
          ? "COMPUTER"
          : playerName();
}

function setStatus(message) {
  $("status").textContent = message;
}

// Player 1 seed arrangement.
function handleSetupPit(index) {
  if (
    gameMode === "computer" &&
    setupPlayer === 1
  ) {
    return;
  }

  const sources = setupPlayer === 0
    ? Array.from({ length: 8 }, (_, i) => i + 24)
    : Array.from({ length: 8 }, (_, i) => i);

  if (selectedSetupPit === null) {
    if (
      !sources.includes(index) ||
      setupUsed[index] ||
      board[index] < 4
    ) {
      setStatus("Select an unused starting pit with at least 4 seeds.");
      return;
    }

    selectedSetupPit = index;

    setStatus("Now select another pit on your side.");

    render();
    return;
  }

  const source = selectedSetupPit;

  if (source === index) {
    selectedSetupPit = null;

    setStatus("Selection cancelled.");

    render();
    return;
  }

  board[source] -= 4;
  board[index] += 4;

  setupUsed[source] = true;
  selectedSetupPit = null;

  const finished = sources.every(i => setupUsed[i]);

  if (finished && setupPlayer === 0) {

    // Computer keeps its automatic starting arrangement.
    if (gameMode === "computer") {
      setupPhase = false;
      gameStarted = true;
      currentPlayer = 0;

      render();

      setStatus(
        "Setup complete! You are Player 1. Make your first move."
      );

      return;
    }

    // Human vs Human: Player 2 arranges.
    setupPlayer = 1;

    render();

    setStatus("Player 1 finished. Player 2, arrange your seeds.");

    return;
  }

  if (finished && setupPlayer === 1) {
    setupPhase = false;
    gameStarted = true;
    currentPlayer = 0;

    render();

    setStatus("Setup complete! Player 1, make the first move.");

    return;
  }

  render();

  setStatus(`${playerName(setupPlayer)}: Continue arranging your seeds.`);
}

// Simplified capture check.
function checkCapture(position, player) {
  let opponentPits;

  if (player === 0) {
    if (position < 16 || position > 23) return 0;

    const column = position - 16;

    opponentPits = [column, column + 8];

  } else {
    if (position < 8 || position > 15) return 0;

    const column = position - 8;

    opponentPits = [column + 16, column + 24];
  }

  const first = opponentPits[0];
  const second = opponentPits[1];

  if (board[first] > 0 && board[second] > 0) {
    const taken = board[first] + board[second];

    board[first] = 0;
    board[second] = 0;

    captured[player] += taken;

    return taken;
  }

  return 0;
}

// Play a move.
function playPit(index) {

  // Protect the computer's turn.
  if (
    computerThinking &&
    !computerIsMakingMove
  ) return;

  if (
    gameMode === "computer" &&
    currentPlayer === 1 &&
    !computerIsMakingMove
  ) return;

  if (
    !gameStarted ||
    gameOver ||
    !playerOwns(index, currentPlayer) ||
    board[index] < 2
  ) return;

  const player = currentPlayer;
  const path = getPlayerPath(player);

  let pathIndex = path.indexOf(index);

  if (pathIndex === -1) return;

  let seeds = board[index];

  board[index] = 0;

  let position = index;
  let moves = 0;
  let totalCaptured = 0;
  let relayCount = 0;

  // Sow seeds along the player's path.
  while (moves < 2000 && relayCount < 128) {

    while (seeds > 0 && moves < 2000) {
      pathIndex = (pathIndex + 1) % path.length;

      position = path[pathIndex];

      board[position]++;

      seeds--;
      moves++;
    }

    // Check capture.
    totalCaptured += checkCapture(position, player);

    // Relay sowing.
    if (board[position] > 1 && moves < 2000) {
      seeds = board[position];

      board[position] = 0;

      relayCount++;

    } else {
      break;
    }
  }

  if (totalCaptured > 0) {
    setStatus(
      `${playerName(player)} captured ${totalCaptured} seeds!`
    );
  } else {
    setStatus(`${playerName(player)} completed a move.`);
  }

  currentPlayer = 1 - currentPlayer;

  render();

  checkEnd();

  // Automatically start computer's turn.
  if (
    !gameOver &&
    gameMode === "computer" &&
    currentPlayer === 1
  ) {
    computerMove();
  }
}

// Easy computer opponent.
function computerMove() {
  if (
    gameMode !== "computer" ||
    currentPlayer !== 1 ||
    gameOver ||
    !gameStarted ||
    computerThinking
  ) return;

  computerThinking = true;

  render();

  setStatus("Computer is thinking...");

  window.setTimeout(() => {

    const legalPits = [];

    for (let i = 0; i < TOTAL_PITS; i++) {
      if (
        playerOwns(i, 1) &&
        board[i] >= 2
      ) {
        legalPits.push(i);
      }
    }

    if (legalPits.length === 0) {
      computerThinking = false;

      finishGame();

      return;
    }

    // Easy AI selects a legal pit.
    const choice = legalPits[
      Math.floor(Math.random() * legalPits.length)
    ];

    computerIsMakingMove = true;

    playPit(choice);

    computerIsMakingMove = false;
    computerThinking = false;

    render();

  }, 800);
}

// Check for a player with no legal move.
function checkEnd() {
  const playerCanMove = (player) =>
    board.some(
      (seeds, index) =>
        playerOwns(index, player) && seeds >= 2
    );

  if (!playerCanMove(currentPlayer)) {
    finishGame();
  }
}

// Finish the game.
function finishGame() {
  board.forEach((seeds, index) => {
    if (seeds > 0) {
      const owner = playerOwns(index, 0) ? 0 : 1;

      captured[owner] += seeds;
    }
  });

  board = Array(TOTAL_PITS).fill(0);

  gameOver = true;
  computerThinking = false;
  computerIsMakingMove = false;

  render();

  const p1 = captured[0] + bonusPoints[0];
  const p2 = captured[1] + bonusPoints[1];

  let message = p1 === p2
    ? "It's a tie!"
    : p1 > p2
      ? "Player 1 wins!"
      : "Player 2 wins!";

  setStatus(
    `Game over! ${message} Player 1: ${p1}, Player 2: ${p2}.`
  );
}

// Non-monetary bonus points.
function spinWheel() {
  if (
    !gameStarted ||
    gameOver ||
    setupPhase ||
    computerThinking ||
    (gameMode === "computer" && currentPlayer === 1)
  ) {
    $("result").textContent = "Wait for your turn before using this feature.";
    return;
  }

  const spinBtn = $("spinBtn");
  const spinningPlayer = currentPlayer;

  spinBtn.disabled = true;

  $("wheel").textContent = "🌀";
  $("result").textContent = "Calculating bonus points...";

  window.setTimeout(() => {
    const bonus = Math.floor(Math.random() * 10) + 1;

    bonusPoints[spinningPlayer] += bonus;

    $("wheel").textContent = "🎡";

    $("result").textContent =
      `${playerName(spinningPlayer)} received ${bonus} bonus points!`;

    render();

    spinBtn.disabled = false;

  }, 900);
}

// Buttons.
$("startBtn").addEventListener("click", startGame);

$("spinBtn").addEventListener("click", spinWheel);

$("helpBtn").addEventListener("click", () => {
  $("rules").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

// Initial display.
render();

// Register OMWESO app service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => {
        console.log("OMWESO app is ready!");
      })
      .catch(error => {
        console.error("Service worker error:", error);
      });
  });
}
