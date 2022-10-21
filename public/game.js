const wordText = document.querySelector(".word");
const hintText = document.querySelector(".hint span");
const timeText = document.querySelector(".time b");
const statusBoard = document.querySelector(".status span");

let correctWord;

var words = getWords();
var heartbeat, timer;
var previousObj = "";
var leaderboard = []; //max of 10

var winner;
var phase = 0;

const getTime = {"phase0":5, "phase1":120, "phase2":5};

function initGame() {
	newRound();

	let heartbeat = setInterval(() => {
		engine();
	}, 1000);
}

function newRound() {
	winner = "";
	phase = 0;
	timer = getTime.phase0;
	
	wordText.innerText = "R E A D Y";
	hintText.innerText = "The witches are mixing the words!!";
}

function genWord() {
	if (previousObj !== "") words.push(previousObj);

	var randomObj = words[ Math.floor(Math.random() * words.length) ];
	
	if (randomObj == null) genWord();

	var previousObj = randomObj;

	//remove it from the array
	words.splice(randomObj);

	var wordArray = randomObj.word.split("");

	for (let i = wordArray.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1));
		[wordArray[i], wordArray[j]] = [wordArray[j], wordArray[i]];
	}

	wordText.innerText = wordArray.join("");
	hintText.innerText = randomObj.hint;
	correctWord = randomObj.word.toLowerCase();
}

function engine() {
	switch (phase) {
		// PRE-GAME
		case 0:
			if (timer <= 0) {
				phase++;
				timer = getTime.phase1;
				
				genWord();
			} else {
				statusBoard.innerText = "Like & Share please!";
				timeText.innerText = parsetime(timer);
			}
		break;
		
		// DURING GAME
		case 1:
			if (timer <= 0) {
				phase++;
				timer = getTime.phase2; //time is up..
			} else {
				statusBoard.innerText = "Comment your Guess!";
				timeText.innerText = parsetime(timer);
			}
		break;

		// POST-GAME
		case 2:
			if (timer <= 0) {
				newRound();
			} else {
				wordText.innerText = correctWord;
				statusBoard.innerText = "Time is up..!";
				timeText.innerText = "--:--:--";
			}
		break;

		// HAS WINNER
		default:
			if (timer <= 0) {
				newRound();
			} else {
				statusBoard.innerText = "WINNER: @" + winner;
				timeText.innerText = "--:--:--";
			}
		break;
	}

	timer--;
}

function broadcaster() {
	broadcaster = setInterval(() => {
		//to do, add broadcast messages
	}, 1000 * 4);
}
//broadcaster();

function reward(username) {
	timer = 5;
	phase = 3;
	winner = username;
	
	if (username in leaderboard) {
		leaderboard.username += 1;
	} else {
		leaderboard.username = 0;
	}
}

function trychat(username, chat) {
	try {
		if (chat.length == correctWord.length) {
			if (chat == correctWord) {
				reward(username);
			}
		}
	} catch (e) {
		//i dont want to deal with it for the meantime
	}
}

function parsetime(i) {
	var sec_num = parseInt(i, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num % 3600) / 60);
	var seconds = Math.floor(sec_num % 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}

	return hours + ":" + minutes + ":" + seconds;
}
