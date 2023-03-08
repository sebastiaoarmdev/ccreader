'use strict';

const DEBUGGING = false;

class Reader {
    #isWriting;
    #isReading;
    #isReadingMore;
    #loaders;
    #data;
    #display;

    get isWriting() {
        return this.#isWriting;
    }

    set isWriting(newValue) {
        this.#isWriting = Boolean(newValue);
        for (const loader of loaders) {
            loader.style.display = (this.#isWriting ? 'block' : 'none');
        }
        if (DEBUGGING) console.log(this.isWriting ? 'Writing...' : 'End of writing.');
    }

    get isReading() {
        return this.#isReading;
    }

    set isReading(newValue) {
        this.#isReading = Boolean(newValue);
        if (DEBUGGING) console.log(this.isReading ? 'Reading...' : 'End of reading.');
    }

    get isReadingMore() {
        return this.#isReadingMore;
    }

    set isReadingMore(newValue) {
        this.#isReadingMore = Boolean(newValue);
        if (!(this.isReadingMore)) {
            this.display.innerText = '';
        }
    }

    get loaders() {
        return this.#loaders;
    }

    set loaders(newValue) {
        this.#loaders = Object(newValue);
    }

    get data() {
        return this.#data;
    }

    set data(newValue) {
        this.#data = Object(newValue);
    }

    get display() {
        return this.#display;
    }

    set display(newValue) {
        this.#display = Object(newValue);
    }

    async getData(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }     

    async read(username, maxTimestamp) {
        let url = `https://curiouscat.live/api/v2.1/profile/?username=${username}`;
        this.isReadingMore = (maxTimestamp !== null);
        if (this.isReadingMore) {
            url = `${url}&max_timestamp=${maxTimestamp}`;
        }
        this.isReading = true;
        this.data = await this.getData(url);
        this.isReading = false;
    }

    async showData(username, maxTimestamp = null) {
        this.isWriting = true;
        try {
            await this.read(username, maxTimestamp);
            let data = this.data;
            if (data.error) {
                let paragraph = document.createElement('p');
                paragraph.className = 'error';
                switch (data.error) {
                    case 404: {
                        paragraph.innerText = 'Error 404. Profile does not exist.';                
                        break;
                    }
                    default: {
                        paragraph.innerText = `Error ${data.error}. Code: ${data.errorCode}.`;
                        break;
                    }
                }
                this.display.appendChild(paragraph);
                return;
            }
            let answersCount = data.answers;
            if (answersCount < 1) {
                let paragraph = document.createElement('p');
                paragraph.innerText = 'No answer found.';
                this.display.appendChild(paragraph);
                return;
            }
            let posts = data.posts;
            let paragraph = document.createElement('p');
            if (this.isReadingMore) {
                paragraph.innerText = `Showing ${posts.length} more previous answers.`;
            } else {
                paragraph.innerText = `${answersCount} answer` + (answersCount > 1 ? 's' : '') + ` found at ${getCurrentDate()}. Showing the last ${posts.length}.`;
            }
            this.display.appendChild(paragraph);
            let lastTimestamp = 0;
            for (let element of posts) {
                let content = '';
                switch (element.type) {
                    case 'post': {
                        let post = element.post;
                        content = content + `<p>${secondsToDaysHoursMinutesAndSeconds(post.seconds_elapsed)} ago.</p>`;
                        content = content + `<img src="${post.senderData.avatar}" alt="Avatar" class="avatar">`;
                        content = content + `<p><strong>Comment:</strong></p>`;
                        content = content + `<p>${urlify(post.comment)}</p>`;
                        content = content + `<img src="${post.addresseeData.avatar}" alt="Avatar" class="avatar">`;
                        content = content + `<p><strong>Reply:</strong></p>`;
                        content = content + `<p>${urlify(post.reply)}</p>`;
                        lastTimestamp = post.timestamp;
                        break;
                    }
                    case 'status': {
                        let status = element.status.status;
                        content = content + `<p>${status}</p>`;
                        break;
                    }
                }        
                let article = document.createElement('article');
                article.innerHTML = content;
                this.display.appendChild(article);
            }
            lastTimestampInput.value = lastTimestamp;
            if (posts.length == 30) {           
                getMorePostsButton.style.display = 'inline';
            } else {
                paragraph = document.createElement('p');
                paragraph.innerText = 'No more posts.';
                this.display.appendChild(paragraph); 
                getMorePostsButton.style.display = 'none';
            }
        } catch (error) {
            console.error("Error!", error.message);
            let paragraph = document.createElement('p');
            paragraph.className = 'error';
            paragraph.innerText = `Error: ${error.message}.`;
            this.display.appendChild(paragraph);
        } finally {
            this.isWriting = false;
        }
    }
}

const loaders = document.querySelectorAll('p.loader');
const getPostsButton = document.getElementById('getPostsButton');
const getMorePostsButton = document.getElementById('getMorePostsButton');
const outputSection = document.getElementById('output');
const usernameInput = document.getElementById('usernameInput');
const lastTimestampInput = document.getElementById('lastTimestamp');
const reader = new Reader();

reader.display = document.getElementById('output');
reader.loaders = document.querySelectorAll('p.loader');

usernameInput.value = DEBUGGING ? 'zanfranceschi' : '';

function secondsToDaysHoursMinutesAndSeconds(seconds) {
    seconds = Number(seconds);
    let days = Math.floor(seconds / (3600 * 24));
    let hours = Math.floor(seconds % (3600 * 24) / 3600);
    let minutes = Math.floor(seconds % 3600 / 60);
    seconds = Math.floor(seconds % 60);
    
    let display = '';
    display = (days > 0) ? (days + (days == 1 ? ' day + ' : ' days + ')) : '';
    display = display + (hours > 0 ? hours + (hours == 1 ? ' hour + ' : ' hours + ') : '');
    display = display + (minutes > 0 ? minutes + (minutes == 1 ? ' minute + ' : ' minutes + ') : '');
    display = display + (seconds > 0 ? seconds + (seconds == 1 ? ' second' : ' seconds') : '');
    return display;
}

function urlify(text) {
    let urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank">${url}</a>`;
    });
}

function getCurrentDate() {
    let now = new Date(); 
    return now.toLocaleString();
}

function getUsername() {
    return usernameInput.value;
}

function getLastTimestamp() {
    return lastTimestampInput.value;
}

getPostsButton.addEventListener('click', function (event) {
    let username = getUsername();
    reader.showData(username);
});

getMorePostsButton.addEventListener('click', function (event) {
    let username = getUsername();
    let maxTimestamp = (getLastTimestamp() - 1);
    reader.showData(username, maxTimestamp);
});

usernameInput.addEventListener('click', function (event) {
    event.target.select();
});

usernameInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      getPostsButton.click();
    }
});