// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = "https://tiktok-chat-reader.zerody.one/"; //location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

let username = "";

$(document).ready(() => {
	username = '';
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
    if (username == '') {
		username = user;
		
        $('#stateText').text('Acquiring livestream info from ' + user);

        connection.connect(user, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text("Connected..!");
	
			setTimeout(() => {
				$('#stateText').text("");
				
				// reset stats
				viewerCount = 0;
				likeCount = 0;
				diamondsCount = 0;
				updateRoomStats();

				initGame();
			}, 1000 * 3);
			
        }).catch(errorMessage => {
            //$('#stateText').text(errorMessage);
			sendForm(errorMessage + "\n");
        })
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
}

function updateRoomStats() {
	let txt = "Viewers: " + viewerCount.toLocaleString() + " | Likes: " + likeCount.toLocaleString() + " | Gifts: " + diamondsCount.toLocaleString();
	$('#roomStats').text(txt);
    //$('#roomStats').html(`Viewers: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Gifts: <b>${diamondsCount.toLocaleString()}</b>`)	
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
    let container = $('.chatcontainer')

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
    let container = $('.giftcontainer');

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
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (typeof msg.likeCount === 'number') {
        addChatItem('#447dd4', msg, msg.label.replace('{0:user}', '').replace('likes', `${msg.likeCount} likes`))
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {
	let texts = ["has descended..", "brought a pizza!", "is curious.."];
	let jointext = texts[ Math.floor(Math.random() * texts.length) ];
	addChatItem('#21b2c2', msg, jointext + ' [Join]', true);
})

// New chat comment received
connection.on('chat', (msg) => {
	let chat = msg.comment;
	if (chat !== null) trychat(chat);
	addChatItem('', msg, chat);
})

// New gift received
connection.on('gift', (data) => {
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
	username = '';
    sendForm("TikTok Live has Ended\n");
})