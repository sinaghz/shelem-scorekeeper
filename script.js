document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const newRoundBtn = document.getElementById('new-round-btn');
    const resetGameBtn = document.getElementById('reset-game-btn');
    const undoBtn = document.getElementById('undo-btn');
    const roundControlsDiv = document.getElementById('round-controls');
    const historyList = document.getElementById('history-list');
    const team1TotalScore = document.getElementById('team1-total-score');
    const team2TotalScore = document.getElementById('team2-total-score');
    const team1NameDisplay = document.getElementById('team1-name-display');
    const team2NameDisplay = document.getElementById('team2-name-display');
    const pNameDisplays = {
        t1p1: document.getElementById('t1p1-display'), t1p2: document.getElementById('t1p2-display'),
        t2p1: document.getElementById('t2p1-display'), t2p2: document.getElementById('t2p2-display'),
    };
    const newGameModal = document.getElementById('new-game-modal');
    const confirmNewGameBtn = document.getElementById('confirm-new-game-btn');
    const cancelNewGameBtn = document.getElementById('cancel-new-game-btn');
    const winningScoreSelect = document.getElementById('winning-score');
    const winningScoreDisplay = document.getElementById('winning-score-display');
    const modalPlayerInputs = {
        t1p1: document.getElementById('modal-t1p1'), t1p2: document.getElementById('modal-t1p2'),
        t2p1: document.getElementById('modal-t2p1'), t2p2: document.getElementById('modal-t2p2'),
    };
    const winnerModal = document.getElementById('winner-modal');
    const winnerMessage = document.getElementById('winner-message');
    const closeWinnerModalBtn = document.getElementById('close-winner-modal-btn');
    
    let gameState = {};

    function setupNewGame(winningScore, playerNames, gameMode) {
        gameState = {
            team1Score: 0, team2Score: 0,
            roundHistory: [], roundCounter: 0,
            winningScore: parseInt(winningScore),
            playerNames: playerNames, gameMode: gameMode,
            roundPhase: 'inactive', currentRound: null
        };
        saveState();
        updateFullUI();
    }
    
    function saveState() { localStorage.setItem('shelemScorekeeperState', JSON.stringify(gameState)); }

    function loadState() {
        const savedState = localStorage.getItem('shelemScorekeeperState');
        if (savedState) { gameState = JSON.parse(savedState); } 
        else { setupNewGame(665, { t1p1: 'Player 1', t1p2: 'Player 2', t2p1: 'Player 3', t2p2: 'Player 4' }, 'no-joker'); }
        updateFullUI();
    }

    function updateFullUI() {
        const team1Name = `${gameState.playerNames.t1p1} & ${gameState.playerNames.t1p2}`;
        const team2Name = `${gameState.playerNames.t2p1} & ${gameState.playerNames.t2p2}`;
        const modeText = gameState.gameMode === 'joker' ? 'With Joker' : 'Without Joker';

        winningScoreDisplay.textContent = `${gameState.winningScore} (${modeText})`;
        team1NameDisplay.textContent = team1Name;
        team2NameDisplay.textContent = team2Name;
        team1TotalScore.textContent = gameState.team1Score;
        team2TotalScore.textContent = gameState.team2Score;
        
        for (const id in gameState.playerNames) { pNameDisplays[id].textContent = gameState.playerNames[id]; }

        historyList.innerHTML = '';
        if (gameState.roundHistory.length > 0) {
            gameState.roundHistory.forEach(round => {
                const li = document.createElement('li');
                li.innerHTML = round.log;
                historyList.appendChild(li);
            });
        }
        
        newRoundBtn.disabled = gameState.roundPhase !== 'inactive';
        undoBtn.disabled = gameState.roundHistory.length === 0 || gameState.roundPhase !== 'inactive';
        roundControlsDiv.innerHTML = ''; 
        
        if (gameState.roundPhase === 'bidding') {
            roundControlsDiv.innerHTML = getBiddingPhaseHTML(team1Name, team2Name);
            document.getElementById('confirm-bid-btn').addEventListener('click', confirmBid);
            document.getElementById('cancel-bid-btn').addEventListener('click', cancelRound);
        } else if (gameState.roundPhase === 'scoring') {
            roundControlsDiv.innerHTML = getScoringPhaseHTML(team1Name, team2Name);
            document.getElementById('finish-round-btn').addEventListener('click', finishRound);
            document.getElementById('cancel-score-btn').addEventListener('click', cancelRound);
        }
    }

    function getBiddingPhaseHTML(team1Name, team2Name) {
        const bidStart = gameState.gameMode === 'joker' ? 120 : 100;
        const bidEnd = gameState.gameMode === 'joker' ? 200 : 165;
        let options = '';
        for (let i = bidStart; i <= bidEnd; i += 5) { options += `<option value="${i}">${i}</option>`; }
        return `<div id="bid-phase"><h3>1. Set the Bid</h3><div class="form-group"><label>Bidding Team (Hakem):</label><div class="radio-group"><label><input type="radio" name="bidding-team" value="1" checked> ${team1Name}</label> <label><input type="radio" name="bidding-team" value="2"> ${team2Name}</label></div></div><div class="form-group"><label for="bid-amount">Bid Amount:</label><select id="bid-amount">${options}</select></div><div class="button-group"><button id="confirm-bid-btn">Confirm Bid</button><button id="cancel-bid-btn" class="cancel">Cancel Round</button></div></div>`;
    }

    function getScoringPhaseHTML(team1Name, team2Name) {
        const round = gameState.currentRound;
        const biddingTeamName = round.biddingTeam === '1' ? team1Name : team2Name;
        const maxScore = gameState.gameMode === 'joker' ? 200 : 165;
        const defaultScore = gameState.gameMode === 'joker' ? 80 : 65;
        let scoreOptions = '';
        for (let i = 0; i <= maxScore; i += 5) {
            const isSelected = (i === defaultScore) ? 'selected' : '';
            scoreOptions += `<option value="${i}" ${isSelected}>${i}</option>`;
        }
        return `<div id="round-status"><strong>Round in Progress:</strong> ${biddingTeamName} has bid <strong>${round.bidAmount}</strong>.</div><div id="score-phase"><h3>2. Enter Score</h3><div class="form-group"><label for="opponent-score">Opponent's Score:</label><select id="opponent-score">${scoreOptions}</select></div><div class="button-group"><button id="finish-round-btn">Finish Round</button><button id="cancel-score-btn" class="cancel">Cancel Round</button></div></div>`;
    }
    
    function startNewRound() {
        if (!gameState.winningScore) { alert("Please start a new game first!"); return; }
        gameState.roundPhase = 'bidding';
        saveState();
        updateFullUI();
    }

    function confirmBid() {
        gameState.currentRound = {
            biddingTeam: document.querySelector('input[name="bidding-team"]:checked').value,
            bidAmount: parseInt(document.getElementById('bid-amount').value)
        };
        gameState.roundPhase = 'scoring';
        saveState();
        updateFullUI();
    }

    function cancelRound() {
        gameState.roundPhase = 'inactive';
        gameState.currentRound = null;
        saveState();
        updateFullUI();
    }

    function finishRound() {
        const opponentScore = parseInt(document.getElementById('opponent-score').value);
        if (isNaN(opponentScore)) { alert("Invalid score selected."); return; }
        const totalHandScore = gameState.gameMode === 'joker' ? 200 : 165;
        if (opponentScore > totalHandScore) { alert(`Opponent score cannot be more than ${totalHandScore}.`); return; }

        const { biddingTeam, bidAmount } = gameState.currentRound;
        const biddingTeamPoints = totalHandScore - opponentScore;
        let biddingTeamScoreChange = (biddingTeamPoints < bidAmount) ? -bidAmount : bidAmount;
        let opponentTeamScoreChange = opponentScore;
        
        if (biddingTeamScoreChange < 0 && opponentScore >= 85) { biddingTeamScoreChange *= 2; }
        if (biddingTeamScoreChange > 0 && biddingTeamPoints === totalHandScore) { biddingTeamScoreChange *= 2; }

        let team1Change = (biddingTeam === '1') ? biddingTeamScoreChange : opponentTeamScoreChange;
        let team2Change = (biddingTeam === '2') ? biddingTeamScoreChange : opponentTeamScoreChange;

        let threshold;
        switch(gameState.winningScore) {
            case 665: threshold = 600; break;
            case 800: threshold = 700; break;
            case 1165: threshold = 1000; break;
            case 1400: threshold = 1200; break;
            default: threshold = gameState.winningScore;
        }

        const didBidderSucceed = biddingTeamScoreChange > 0;
        if (gameState.team1Score >= threshold && !((biddingTeam === '1' && didBidderSucceed) || (biddingTeam === '2' && !didBidderSucceed))) { team1Change = 0; }
        if (gameState.team2Score >= threshold && !((biddingTeam === '2' && didBidderSucceed) || (biddingTeam === '1' && !didBidderSucceed))) { team2Change = 0; }

        gameState.team1Score += team1Change;
        gameState.team2Score += team2Change;
        logRoundHistory(biddingTeam, bidAmount, biddingTeamPoints, team1Change, team2Change);
        cancelRound();
        checkForWinner();
    }

    function logRoundHistory(biddingTeam, bid, points, team1Change, team2Change) {
        gameState.roundCounter++;
        const team1Name = `${gameState.playerNames.t1p1} & ${gameState.playerNames.t1p2}`;
        const team2Name = `${gameState.playerNames.t2p1} & ${gameState.playerNames.t2p2}`;
        const biddingTeamName = biddingTeam === '1' ? team1Name : team2Name;
        const formatChange = (change) => `<span class="score-change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change}</span>`;
        const log = `<strong>Round ${gameState.roundCounter}:</strong> ${biddingTeamName} bid ${bid} & got ${points}.<br>${team1Name}: ${formatChange(team1Change)} | ${team2Name}: ${formatChange(team2Change)}`;
        
        gameState.roundHistory.unshift({ log: log, team1Change: team1Change, team2Change: team2Change });
    }

    function undoLastRound() {
        if (gameState.roundHistory.length === 0) return;
        
        const isConfirmed = confirm("Are you sure you want to undo the last round?");
        if (isConfirmed) {
            const lastRound = gameState.roundHistory.shift();
            gameState.team1Score -= lastRound.team1Change;
            gameState.team2Score -= lastRound.team2Change;
            gameState.roundCounter--;
            saveState();
            updateFullUI();
        }
    }
    
    function checkForWinner() {
        const team1Name = `${gameState.playerNames.t1p1} & ${gameState.playerNames.t1p2}`;
        const team2Name = `${gameState.playerNames.t2p1} & ${gameState.playerNames.t2p2}`;
        let winnerName = '';
        if (gameState.team1Score >= gameState.winningScore && gameState.team1Score > gameState.team2Score) {
            winnerName = team1Name;
        } else if (gameState.team2Score >= gameState.winningScore) {
            winnerName = team2Name;
        }

        if (winnerName) {
            winnerMessage.textContent = `${winnerName} Wins!`;
            winnerModal.classList.remove('hidden');
            newRoundBtn.disabled = true;
            undoBtn.disabled = true;
        }
    }
    
    newRoundBtn.addEventListener('click', startNewRound);
    undoBtn.addEventListener('click', undoLastRound);
    resetGameBtn.addEventListener('click', () => {
        for (const id in gameState.playerNames) { modalPlayerInputs[id].value = gameState.playerNames[id]; }
        const currentMode = gameState.gameMode || 'no-joker';
        document.querySelector(`input[name="game-mode"][value="${currentMode}"]`).checked = true;
        newGameModal.classList.remove('hidden');
    });
    cancelNewGameBtn.addEventListener('click', () => newGameModal.classList.add('hidden'));
    closeWinnerModalBtn.addEventListener('click', () => {
        winnerModal.classList.add('hidden');
        resetGameBtn.click();
    });
    
    confirmNewGameBtn.addEventListener('click', () => {
        const newNames = {};
        for (const id in modalPlayerInputs) {
            newNames[id] = modalPlayerInputs[id].value || modalPlayerInputs[id].placeholder;
        }
        const gameMode = document.querySelector('input[name="game-mode"]:checked').value;
        setupNewGame(winningScoreSelect.value, newNames, gameMode);
        newGameModal.classList.add('hidden');
    });
    
    loadState();

});
