// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = "https://tiktok-chat-reader.zerody.one/"; //location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined; //
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

var connected = false;

$(document).ready(() => {
	sendForm("");
})

function sendForm(msg) {
	let user = prompt(msg + "Enter your TikTok @username");
	if (user  == null || user  == "") {
		sendForm("Field cannot be empty\n");
	} else {
		connect(user);
	}
}

function connect(user) {
    if (connected == false) {
        $('#stateText').text('Connecting to ' + user);

        connection.connect(user, {
            enableExtendedGiftInfo: true
        }).then(state => {
			var i = 0;
			var delay = setInterval(() => {
				switch (i) {
					case 0:
						$('#stateText').text("Linking.");
					break;
						
					case 1:
						$('#stateText').text("Linking..");
					break;
						
					case 2:
						$('#stateText').text("Linking...");
					break;
						
					case 3:
						$('#stateText').text("Connected!!");
					break;
						
					default:
						$('#stateText').text("");

						// reset stats
						viewerCount = 0;
						likeCount = 0;
						diamondsCount = 0;
						connected = true;

						updateRoomStats();

						initGame();

						clearInterval(delay);
					break;
				}
				i++;
			}, 1000);
        }).catch(errorMessage => {
			sendForm(errorMessage + "\n");
		});
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
	let txt = "Viewers: " + viewerCount.toLocaleString() + " | Likes: " + likeCount.toLocaleString() + " | Gifts: " + diamondsCount.toLocaleString();
	$('#roomStats').text(txt);
    //$('#roomStats').html(text)	
}

function generateUsernameLink(data) {
    return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

/**
 * Add a new message to the chat container
 */
function addChatItem(color, data, text, summarize) {
    var container = $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    container.find('.temporary').remove();

    container.append(`
        <div class=${summarize ? 'temporary' : 'static'}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>
            </span>
        </div>
    `);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);
}

/**
 * Add a new gift to the gift container
 */
function addGiftItem(data) {
    var container = $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;

    let html = `
        <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Name: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Repeat: <b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Cost: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamonds</b><span>
                            </td>
                        </tr>
                    </tabl>
                </div>
            </span>
        </div>
    `;

    let existingStreakItem = container.find(`[data-streakid='${streakId}']`);

    if (existingStreakItem.length) {
        existingStreakItem.replaceWith(html);
    } else {
        container.append(html);
    }

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}

// viewer stats
connection.on('roomUser', (msg) => {
    if (connected == false) return;
	
	if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (connected == false) return;

	if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`))
    }
})

// Member join
//let joinMsgDelay = 0;
connection.on('member', (msg) => {
	if (connected == false) return;
	
	let texts = ["has descended..", "brought a pizza!", "is curious.."];
	let jointext = texts[ Math.floor(Math.random() * texts.length) ];
	addChatItem('#21b2c2', msg, jointext + ' [Join]', true);
})

// New chat comment received
connection.on('chat', (msg) => {
	let chat = msg.comment;
	trychat(msg.uniqueId, chat);
	addChatItem('', msg, chat);
})

// New gift received
connection.on('gift', (data) => {
    if (connected == false) return;
	
	if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        updateRoomStats();
    }

    addGiftItem(data);
})

// share, follow
connection.on('social', (data) => {
    let color = data.displayType.includes('follow') ? '#ff005e' : '#2fb816';
    addChatItem(color, data, data.label.replace('{0:user}', ''));
})

connection.on('streamEnd', () => {
	connected = false;
    sendForm("TikTok Live has Ended\n");
})
