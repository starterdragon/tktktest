const wordText = document.querySelector(".word");
hintText = document.querySelector(".hint span");
timeText = document.querySelector(".time b");
statusBoard = document.querySelector(".status span");

let correctWord, session, timer;
let leaderboard = {}; //max of 10

let guessTimer = 120;
let resetTimer = 15;
let phase = 1;

function startSession() {
	switch (phase) {
		case 1:
			if (timer <= 0) {
				phase++;
				timer = resetTimer;
			} else {
				statusBoard.innerText = "Comment your Guess!";
				timeText.innerText = parsetime(timer);
			}
		break;
		
		case 2:
			if (timer < 1) {
				phase++;
				timer = resetTimer;
				
			} else if (timer < 5) {
				statusBoard.innerText = "Ready your fingers..!";
				timeText.innerText = parsetime(timer);
			} else {
				statusBoard.innerText = "Loading the next word..";
				timeText.innerText = parsetime(timer);
			}
		break;
		
		default:
			statusBoard.innerText = "";
			clearInterval(timer);
			initGame();
		break;
	}
	
	return timer--;
}

const broadcaster = () => {
	let broadcaster = setInterval(() => {
		//to do, add broadcast messages
	}, 1000 * 4);
}
//broadcaster();

const initGame = () => {
	phase = 1;
	timer = guessTimer;

    session = setInterval(() => {
		startSession();
	});

    let randomObj = words[Math.floor(Math.random() * words.length)];
    let wordArray = randomObj.word.split("");
	
    for (let i = wordArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [wordArray[i], wordArray[j]] = [wordArray[j], wordArray[i]];
    }
	
    wordText.innerText = wordArray.join("");
    hintText.innerText = randomObj.hint;
    correctWord = randomObj.word.toLowerCase();;
}

function trychat(chat) {
	if (chat.length == correctWord.length) {
		if (chat == correctWord) {
			initGame();
		}
	}
}

function parsetime(i) {
	var minutes = Math.floor(i / 60);
	var seconds = i - minutes * 60;
	var hours = Math.floor(i / 3600);

	return hours + ":" + minutes + ":" + seconds;
}
