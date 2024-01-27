const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteButton = document.querySelector("#delete-btn");
const response_model_class = document.querySelector(".response-model");
const restart_response_model = document.querySelector(".restart-response-model");
const chat_history = document.querySelector(".chat_history");

let count = localStorage.getItem("chat-count") || 0;
let userText = null;
const going = {
    chat:false,
    next: false
};


// endpoint name :
/* ------------------------------------------------------------- */
const currentPath = window.location.pathname;
console.log("pathname the website is working : ",currentPath)
/* ----------------------------------------------------------- */


const hideAnimation = () =>{
    document.getElementById("key-animation").style.visibility = "hidden";
    document.getElementById("send-btn").style.visibility = "visible"; 
}

const showAnimation = () =>{
    document.getElementById("key-animation").style.visibility = "visible";
    document.getElementById("send-btn").style.visibility = "hidden";
}

hideAnimation();

const loadDataFromLocalstorage = () => {

    const defaultText = `<div class="default-text">
                            <img class="logo-llm" src="./static/images/llm_logo.svg" style="width:120px;margin-top:100px;">
                            <h1>DocBot: Clicnical Related Query</h1>
                            <h2>SLM (Small Language Model)</h2>
                            <p>If you have any query regarding the Medical,<br>just type the query and you will get the answer</p>
                        </div>`

    chatContainer.innerHTML = defaultText;
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
}


const createChatElement = (content, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = content;
    return chatDiv;
}

function formatTimestamp(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const getChatResponse = async (incomingChatDiv) => {
    const API_URL = `${currentPath}/api/instruct_resp`;
    const pElement = document.createElement("p");

    if (document.getElementById("restart")){
        hideRestart();
    }
    
    showResponse();
    showAnimation();
    
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: userText,
        })
    }
    
    let send_title = ""
    var inputWords = userText.split(" ");
    var title = inputWords.slice(0, 3).join(" ");
    var titleDiv = document.getElementById("title "+sessionStorage.getItem("present_session"));
    
    if (titleDiv){
        if (titleDiv.innerText == "New Chat"){
            titleDiv.innerText = title;
            send_title = titleDiv.innerText;
        }

    }
    if (!sessionStorage.getItem("start")){
        send_title = title;
        createNewDiv(title);
        showResponse();
    }
    sessionStorage.setItem("start", true);

    going.next = false;

    try {
        const response = await fetch(API_URL,requestOptions);
        const contentType = response.headers.get("Content-Type");
        const stream = new ReadableStream({
            start(controller){
                const reader = response.body.getReader();
                function read(){
                    return reader.read().then(({done,value}) => {
                        if(done){
                            controller.close();
                            return;
                        }
                        controller.enqueue(value);
                        return read();
                    });
                }
                return read();
            }
        });
        const readableStreamResponse = new Response(stream,{
            headers: {'Content-Type': contentType}
        });
        const decoder = new TextDecoder();
        let result = "";
        const reader = readableStreamResponse.body.getReader();

        while (true){
            const {done,value} = await reader.read();
            going.chat = true;

            if (done){
                going.chat = false;
                hideAnimation();
                break;
            }
            result += decoder.decode(value);
            pElement.textContent = result;  
            incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
        }
    } catch (error) { 
        pElement.classList.add("error");
        pElement.textContent = error;
    }

    incomingChatDiv.querySelector(".typing-animation").remove();
    incomingChatDiv.querySelector(".chat-details").appendChild(pElement);

    /* CODE FOR STORING CONVERSATION IN REDIS */
    const sendmsgoptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session_id: sessionStorage.getItem("present_session"),
            userText: userText,
            html: chatContainer.innerHTML,
            title: send_title ? send_title: titleDiv.innerText,
            timestamp: formatTimestamp(new Date())
        })
    }

    await (await fetch("/conv",sendmsgoptions)).json();
    /* --------------------------------------------------------------------- */
    hideStop();
    restartResponse();
    localStorage.setItem("all-chats", chatContainer.innerHTML);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

}

const copyResponse = (copyBtn) => {
    const reponseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(reponseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
}


const showTypingAnimation = () => {
    const html = `
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 640 512" id=bot class=user_icon><style>user_icon{fill:#ffffff}</style><path d="M320 0c17.7 0 32 14.3 32 32V96H472c39.8 0 72 32.2 72 72V440c0 39.8-32.2 72-72 72H168c-39.8 0-72-32.2-72-72V168c0-39.8 32.2-72 72-72H288V32c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H208zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H304zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H400zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224H64V416H48c-26.5 0-48-21.5-48-48V272c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H576V224h16z"/></svg>
                </div>
                <div class="chat-content">
                    <div class="chat-details">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                    <span onclick="copyResponse(this)" class="material-symbols-rounded">content_copy</span>
                </div>
                `;

    const incomingChatDiv = createChatElement(html, "incoming");
    count++;
    
    chatContainer.appendChild(incomingChatDiv);
    sessionStorage.setItem("chat_count",`chat-${count}`);
    incomingChatDiv.classList.add(`chat-${count}`)
    chatContainer.scrollTo(0,chatContainer.scrollHeight);
    getChatResponse(incomingChatDiv);
    
}

const stopResponse = () => {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        }
    };
    $.ajax({
        url: `${currentPath}/api/stop`,
        type: requestOptions.method,
        headers: requestOptions.headers,
        dataType: "json",
        success: function(response) {
            hideStop();
            hideAnimation();
            restartResponse();
        },
        error: function(xhr, status, error) {
            console.error(status, error);
        }
    });
}


const restart_generation = async () => {
    const API_URL = `${currentPath}/api/restart`;
    
    const chat_count = `.chat.incoming.chat-${localStorage.getItem("chat-count")}`;
    const incomingChatDiv = document.querySelector(chat_count);
    const chatDetailsDiv = incomingChatDiv.querySelector(".chat-details");
    const existingParagraphs = chatDetailsDiv.querySelectorAll("p");
    const pElement = document.createElement("p");
    
    existingParagraphs.forEach((paragraph) => {
        chatDetailsDiv.removeChild(paragraph);
    }); 
    hideRestart();
    showResponse();
    showAnimation();
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: userText,
        }),
    };
    try {
        const response = await fetch(API_URL, requestOptions);
        const contentType = response.headers.get("Content-Type");
        const stream = new ReadableStream({
            start(controller) {
                const reader = response.body.getReader();
                function read() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        controller.enqueue(value);
                        return read();
                    });
                }
                return read();
            },
        });
        const readableStreamResponse = new Response(stream, {
            headers: { 'Content-Type': contentType },
        });
        const decoder = new TextDecoder();
        let result = "";
        const reader = readableStreamResponse.body.getReader();
        while (true) {
            going.chat = true;
            const { done, value } = await reader.read();
            if (done) {
                pElement.textContent = result;
                chatDetailsDiv.appendChild(pElement);
                localStorage.setItem("all-chats", chatContainer.innerHTML);
                chatContainer.scrollTo(0, chatContainer.scrollHeight);
                hideAnimation();
                going.chat=false;
                break;
            }
            result += decoder.decode(value);
            pElement.textContent = result;
            incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
        }
    } catch (error) {
        pElement.classList.add("error");
        pElement.textContent = error;
        chatDetailsDiv.appendChild(pElement);
        localStorage.setItem("all-chats", chatContainer.innerHTML);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }
    incomingChatDiv.querySelector(".typing-animation").remove();
};

const hideStop = () => {
    response_model_class.classList.add("hidden");
}

const hideRestart = () => {
    restart_response_model.classList.add("hidden");
}

const hideAllResponse = () => {
    hideStop();
    hideRestart();
}

const showResponse = () => {
    const html = `
        <div class="generate-response" id="stop">
            <span onclick="stopResponse()">Stop Generation</span>
        </div>
    `;
    if (response_model_class.classList.contains("hidden")){
        response_model_class.classList.remove("hidden");
    }
    const responseModel = createChatElement(html,"responses");
    response_model_class.appendChild(responseModel);
}

const restartResponse = () =>{
    const html = `
        <div class="restart-response" id="restart">
            <span onclick="restart_generation()">Restart Response</span>
        </div>  
    `;
    if (restart_response_model.classList.contains("hidden")){
        restart_response_model.classList.remove("hidden");
    }
    const responseModel = createChatElement(html,"restart-responses");
    restart_response_model.appendChild(responseModel);   
}


const handleOutgoingChat = () => {
    userText = chatInput.value.trim();
    if(!userText) return;

    chatInput.value = "";
    chatInput.style.height = `${initialInputHeight}px`;

    const html = `
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 448 512" class=user_icon><style>.user_icon{fill:#ffffff;}</style><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>

                </div>
                <div class="chat-content">
                    <div class="chat-details">
                        <p>${userText}</p>
                    </div>
                </div>`;

    const outgoingChatDiv = createChatElement(html, "outgoing");
    chatContainer.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outgoingChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    setTimeout(showTypingAnimation, 500);
}

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener("input", () => {   
    chatInput.style.height =  `${initialInputHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800 && !going.chat) {
        e.preventDefault();
        handleOutgoingChat();
    }
});


function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

var create_div = document.getElementById("create_div");
var id_count = 1;
var chat_hist_cont = document.getElementById("chat-history");
let globalDiv


async function localRefresh() {
    var sessionID = sessionStorage.getItem("present_session");
    going.next = false;

    const sendmsgoptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"   
        },
        body: JSON.stringify(
            {
                session_id: sessionID ? sessionID : 'none'
            }
        )
    };

    try {
        const resp = await fetch("/fetch_session", sendmsgoptions);
        const data = await resp.json(); 

        if (data === null){
            loadDataFromLocalstorage();
        }

        else{
            data.content.forEach((i) => {
                console.log(i);
                Object.entries(i).forEach(([key, value]) => {
                    const session_id = key;
                    const title = value;
                    createNewDiv(title, session_id);
                });
            });


            if (data.html === null){
                loadDataFromLocalstorage()
            }
            else{
                chatContainer.innerHTML = data.html;
                chatContainer.scrollTo(0, chatContainer.scrollHeight); 
            }

        }                
    }
    
    catch (error) {
        console.error("Error:", error);
    }
}

localRefresh();


function createNewDiv(title,session_id = undefined) {
    going.next = true;
    
    hideAllResponse();
    if (session_id === undefined){
        var sessionId = generateRandomString(5);
    }
    else{
        sessionId = session_id;
    }
    
    sessionStorage.setItem(sessionId, sessionId);
    sessionStorage.setItem("present_session",sessionId);

    var new_div = document.createElement("div");
    new_div.id = "history-" + sessionId;
    new_div.className = "chat-hist-div";
    
    var dict = new Map();
    dict.set("session_id", sessionId);
    new_div.dataMap = dict;
    document.body.appendChild(new_div);

    var deleteIcon = document.createElement("span");
    deleteIcon.className = "fas fa-trash-alt del-icon";
    deleteIcon.style.cursor = "pointer";

    var editIcon = document.createElement("span");
    editIcon.innerHTML = `
    <?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.0867 21.3877L13.7321 21.7697L13.0867 21.3877ZM13.6288 20.4718L12.9833 20.0898L13.6288 20.4718ZM10.3712 20.4718L9.72579 20.8539H9.72579L10.3712 20.4718ZM10.9133 21.3877L11.5587 21.0057L10.9133 21.3877ZM1.25 10.5C1.25 10.9142 1.58579 11.25 2 11.25C2.41421 11.25 2.75 10.9142 2.75 10.5H1.25ZM3.07351 15.6264C2.915 15.2437 2.47627 15.062 2.09359 15.2205C1.71091 15.379 1.52918 15.8177 1.68769 16.2004L3.07351 15.6264ZM7.78958 18.9915L7.77666 19.7413L7.78958 18.9915ZM5.08658 18.6194L4.79957 19.3123H4.79957L5.08658 18.6194ZM21.6194 15.9134L22.3123 16.2004V16.2004L21.6194 15.9134ZM16.2104 18.9915L16.1975 18.2416L16.2104 18.9915ZM18.9134 18.6194L19.2004 19.3123H19.2004L18.9134 18.6194ZM19.6125 2.7368L19.2206 3.37628L19.6125 2.7368ZM21.2632 4.38751L21.9027 3.99563V3.99563L21.2632 4.38751ZM4.38751 2.7368L3.99563 2.09732V2.09732L4.38751 2.7368ZM2.7368 4.38751L2.09732 3.99563H2.09732L2.7368 4.38751ZM9.40279 19.2098L9.77986 18.5615L9.77986 18.5615L9.40279 19.2098ZM13.7321 21.7697L14.2742 20.8539L12.9833 20.0898L12.4412 21.0057L13.7321 21.7697ZM9.72579 20.8539L10.2679 21.7697L11.5587 21.0057L11.0166 20.0898L9.72579 20.8539ZM12.4412 21.0057C12.2485 21.3313 11.7515 21.3313 11.5587 21.0057L10.2679 21.7697C11.0415 23.0767 12.9585 23.0767 13.7321 21.7697L12.4412 21.0057ZM10.5 2.75H13.5V1.25H10.5V2.75ZM21.25 10.5V11.5H22.75V10.5H21.25ZM7.8025 18.2416C6.54706 18.2199 5.88923 18.1401 5.37359 17.9265L4.79957 19.3123C5.60454 19.6457 6.52138 19.7197 7.77666 19.7413L7.8025 18.2416ZM1.68769 16.2004C2.27128 17.6093 3.39066 18.7287 4.79957 19.3123L5.3736 17.9265C4.33223 17.4951 3.50486 16.6678 3.07351 15.6264L1.68769 16.2004ZM21.25 11.5C21.25 12.6751 21.2496 13.5189 21.2042 14.1847C21.1592 14.8438 21.0726 15.2736 20.9265 15.6264L22.3123 16.2004C22.5468 15.6344 22.6505 15.0223 22.7007 14.2868C22.7504 13.5581 22.75 12.6546 22.75 11.5H21.25ZM16.2233 19.7413C17.4786 19.7197 18.3955 19.6457 19.2004 19.3123L18.6264 17.9265C18.1108 18.1401 17.4529 18.2199 16.1975 18.2416L16.2233 19.7413ZM20.9265 15.6264C20.4951 16.6678 19.6678 17.4951 18.6264 17.9265L19.2004 19.3123C20.6093 18.7287 21.7287 17.6093 22.3123 16.2004L20.9265 15.6264ZM13.5 2.75C15.1512 2.75 16.337 2.75079 17.2619 2.83873C18.1757 2.92561 18.7571 3.09223 19.2206 3.37628L20.0044 2.09732C19.2655 1.64457 18.4274 1.44279 17.4039 1.34547C16.3915 1.24921 15.1222 1.25 13.5 1.25V2.75ZM22.75 10.5C22.75 8.87781 22.7508 7.6085 22.6545 6.59611C22.5572 5.57256 22.3554 4.73445 21.9027 3.99563L20.6237 4.77938C20.9078 5.24291 21.0744 5.82434 21.1613 6.73809C21.2492 7.663 21.25 8.84876 21.25 10.5H22.75ZM19.2206 3.37628C19.7925 3.72672 20.2733 4.20752 20.6237 4.77938L21.9027 3.99563C21.4286 3.22194 20.7781 2.57144 20.0044 2.09732L19.2206 3.37628ZM10.5 1.25C8.87781 1.25 7.6085 1.24921 6.59611 1.34547C5.57256 1.44279 4.73445 1.64457 3.99563 2.09732L4.77938 3.37628C5.24291 3.09223 5.82434 2.92561 6.73809 2.83873C7.663 2.75079 8.84876 2.75 10.5 2.75V1.25ZM2.75 10.5C2.75 8.84876 2.75079 7.663 2.83873 6.73809C2.92561 5.82434 3.09223 5.24291 3.37628 4.77938L2.09732 3.99563C1.64457 4.73445 1.44279 5.57256 1.34547 6.59611C1.24921 7.6085 1.25 8.87781 1.25 10.5H2.75ZM3.99563 2.09732C3.22194 2.57144 2.57144 3.22194 2.09732 3.99563L3.37628 4.77938C3.72672 4.20752 4.20752 3.72672 4.77938 3.37628L3.99563 2.09732ZM11.0166 20.0898C10.8136 19.7468 10.6354 19.4441 10.4621 19.2063C10.2795 18.9559 10.0702 18.7304 9.77986 18.5615L9.02572 19.8582C9.07313 19.8857 9.13772 19.936 9.24985 20.0898C9.37122 20.2564 9.50835 20.4865 9.72579 20.8539L11.0166 20.0898ZM7.77666 19.7413C8.21575 19.7489 8.49387 19.7545 8.70588 19.7779C8.90399 19.7999 8.98078 19.832 9.02572 19.8582L9.77986 18.5615C9.4871 18.3912 9.18246 18.3215 8.87097 18.287C8.57339 18.2541 8.21375 18.2487 7.8025 18.2416L7.77666 19.7413ZM14.2742 20.8539C14.4916 20.4865 14.6287 20.2564 14.7501 20.0898C14.8622 19.936 14.9268 19.8857 14.9742 19.8582L14.2201 18.5615C13.9298 18.7304 13.7204 18.9559 13.5379 19.2063C13.3646 19.4441 13.1864 19.7468 12.9833 20.0898L14.2742 20.8539ZM16.1975 18.2416C15.7862 18.2487 15.4266 18.2541 15.129 18.287C14.8175 18.3215 14.5129 18.3912 14.2201 18.5615L14.9742 19.8582C15.0192 19.832 15.096 19.7999 15.2941 19.7779C15.5061 19.7545 15.7842 19.7489 16.2233 19.7413L16.1975 18.2416Z" fill="white"/>
    </svg>`
    editIcon.className = "chat-icon";

    deleteIcon.addEventListener("click", function (event) {
        var history = document.getElementById(new_div.id);
        console.log(history.dataMap.get("session_id"));
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"   
            },
            body: JSON.stringify(
                {
                    session_id: history.dataMap.get("session_id")
                }
            )
        }
        const API_URL = "/remove_session"
        fetch(API_URL,requestOptions);
        /* --------------------------------------------------- */
        event.stopPropagation();
        deleteDiv(new_div);
        loadDataFromLocalstorage();
    });
    new_div.appendChild(editIcon);
    new_div.appendChild(deleteIcon);
    var titleDiv = document.createElement("div");
    titleDiv.innerText = title;
    titleDiv.style.fontWeight = "bold";
    titleDiv.id = "title "+sessionStorage.getItem("present_session");
    titleDiv.className = "title-div"
    new_div.appendChild(titleDiv);
    chat_hist_cont.appendChild(new_div);
    // div click
    new_div.addEventListener("click", function () {
        // setting div-click true
        if (going.chat) {
            var overlay = document.getElementById("overlay");
            overlay.style.display = "block";
            stopResponse();
            going.chat = false;
            setTimeout(function () {
                hideAnimation();
                hideLoadingOverlay();
                executeOnClick();
            }, 3000);
        } else {
            executeOnClick();
        }
    
        function executeOnClick() {
            sessionStorage.setItem("new-div", true);
            var history = document.getElementById(new_div.id);
            sessionStorage.setItem("session", history.dataMap.get("session_id"));
            sessionStorage.removeItem("present_session");
            sessionStorage.setItem(
                "present_session",
                history.dataMap.get("session_id")
            );
    
            var allDivs = document.querySelectorAll(".chat-hist-div");
            allDivs.forEach((div) => {
                div.classList.remove("acitve-new_chat");
            });
    
            new_div.classList.add("acitve-new_chat");
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    session_id: history.dataMap.get("session_id"),
                }),
            };
            const API_URL = "/session";
            fetch(API_URL, requestOptions)
                .then((response) => response.json())
                .then((data) => {
                    if (data.content) {
                        chatContainer.innerHTML = data.content.trim();
                    } else {
                        loadDataFromLocalstorage();
                        hideAllResponse();
                    }
                    var newChats = document.querySelectorAll(".chat-hist-div");
                    newChats.forEach(function (chat) {
                        chat.classList.remove("active-new_chat");
                    });
                    new_div.classList.add("active-new_chat");
                })
                .catch((error) => {
                    console.error("Error fetching data:", error);
                });
        }
    });
    
    id_count++;
}


function deleteDiv(div) {
    var sessionId = div.dataMap.get("session_id");
    sessionStorage.removeItem(sessionId);
    div.remove();
    if (chat_hist_cont.querySelectorAll("div").length === 0) {
        sessionStorage.removeItem("start");
    }
    sessionStorage.removeItem("all-chats");
    hideAllResponse();
    count=0;
    sessionStorage.removeItem("present_session");
    sessionStorage.removeItem("start");
    loadDataFromLocalstorage();
}


create_div.addEventListener("click", function () {
    going.next = true;
    if (going.next && going.chat){
        showLoader();
    }
    
    else{
        var inputText = chatInput.value.trim();
        var allDivs = document.querySelectorAll('.chat-hist-div');
        if (allDivs){
            allDivs.forEach(div => {
                div.classList.remove('acitve-new_chat');
            });
        }
        
        if (inputText.length > 0) {
            var inputWords = inputText.split(" ");
            var title = inputWords.slice(0, 3).join(" ");
            createNewDiv(title);
            chatInput.value = "";
            sessionStorage.setItem("start", true);
        }
        else {
            createNewDiv("New Chat");    
            sessionStorage.setItem("start", true);
        }
        loadDataFromLocalstorage();
    }
    
    
});



function sendChat() {
    var inputText = chatInput.value.trim();

    if (inputText.length > 0) {
        var inputWords = inputText.split(" ");
        var title = inputWords.slice(0, 3).join(" ");
        if (!sessionStorage.getItem("start")) {
            createNewDiv(title);
        }
        chatInput.value = inputText;
        handleOutgoingChat();
        sessionStorage.setItem("start", true);
    }
}

create_div.addEventListener("click",sendChat);
sendButton.addEventListener("click", handleOutgoingChat);

/* ----------------- LOADER --------------------- */

function showLoader() {
    // Simulate a delay (e.g., API call, data loading)
    var overlay = document.getElementById("overlay");
    overlay.style.display = "block";
    stopResponse();
    going.chat = false;
    going.next = false;
    
    setTimeout(function () {
        var inputText = chatInput.value.trim();
        var allDivs = document.querySelectorAll('.chat-hist-div');
        if (allDivs){
            allDivs.forEach(div => {
                div.classList.remove('acitve-new_chat');
            });
        }
        
        if (inputText.length > 0) {
            var inputWords = inputText.split(" ");
            var title = inputWords.slice(0, 3).join(" ");
            createNewDiv(title);
            chatInput.value = "";
            sessionStorage.setItem("start", true);
        }
        else {
            createNewDiv("New Chat");    
            sessionStorage.setItem("start", true);
        }
        loadDataFromLocalstorage();
        hideAnimation();
        hideLoadingOverlay();
    }, 3000); // Adjust the delay time as needed
  };

  
function hideLoadingOverlay() {
    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
}

/* ------------------------------------- */