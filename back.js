// ====== CONFIGURE GEMINI API ======
const API_KEY = "AIzaSyCSaSpWMx-H4dXvcmHwwt0hH0wC4DRXdQU"; // Your key
const MODEL = "gemini-2.0-flash";

// ====== SELECTORS ======
const chatArea = document.getElementById("chat-area");
const inputField = document.querySelector(".chat-input input");
const sendButton = document.getElementById("send-btn");
const greetingDiv = document.getElementById("greeting");
const undoBtn = document.getElementById("undo-btn");
const redoBtn = document.getElementById("redo-btn");
const voiceBtn = document.getElementById("voice-btn");
const historyBtn = document.getElementById("history-btn");
const historyModal = document.getElementById("history-modal");
const historyContent = document.getElementById("history-content");
const closeHistoryBtn = document.getElementById("close-history");
const clearHistoryBtn = document.getElementById("clear-history");
const toggleViewBtn = document.getElementById("toggle-view-btn");
const chatContainer = document.getElementById("chat-container");

// ====== GREETING ======
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning! How can I assist you today?";
  if (hour >= 12 && hour < 17) return "Good afternoon! How can I assist you today?";
  return "Good evening! How can I assist you today?";
}
greetingDiv.textContent = "Bot: " + getGreeting();

// ====== UTILITIES ======
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add(sender === "bot" ? "bot-message" : "user-message");
  div.textContent = (sender === "bot" ? "Bot: " : "You: ") + text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ====== DATE / TIME / MONTH HANDLER ======
function checkDateTimeQuery(msg) {
  const lowerMsg = msg.toLowerCase();

  const now = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (lowerMsg.includes("time")) {
    return `Current time is ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
  if (lowerMsg.includes("date")) {
    return `Today's date is ${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}`;
  }
  if (lowerMsg.includes("day")) {
    return `Today is ${days[now.getDay()]}`;
  }
  if (lowerMsg.includes("month")) {
    return `Current month is ${months[now.getMonth()]}`;
  }

  return null; // Not a date/time query
}

// ====== GEMINI FETCH ======
async function getGeminiResponse(userMsg) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: userMsg }] }
          ]
        }),
      }
    );

    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Gemini error:", data);
      return "⚠️ Sorry, I couldn’t fetch a proper response.";
    }
  } catch (err) {
    console.error("Network error:", err);
    return "⚠️ Network error. Please try again later.";
  }
}

// ====== MESSAGE HANDLING ======
async function sendMessage() {
  const msg = inputField.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  inputField.value = "";

  // Check for date/time/month queries first
  const dateTimeReply = checkDateTimeQuery(msg);
  let botReply;
  if (dateTimeReply) {
    botReply = dateTimeReply;
  } else {
    botReply = await getGeminiResponse(msg);
  }

  addMessage("bot", botReply);
}

sendButton.addEventListener("click", sendMessage);
inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ====== UNDO / REDO ======
let redoStack = [];

undoBtn.addEventListener("click", () => {
  const messages = chatArea.querySelectorAll(".user-message, .bot-message");
  if (messages.length > 1) {
    const lastMsg = messages[messages.length - 1];
    redoStack.push(lastMsg.outerHTML);
    chatArea.removeChild(lastMsg);
  } else alert("Nothing to undo!");
});

redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return alert("Nothing to redo!");
  const lastDeleted = redoStack.pop();
  chatArea.insertAdjacentHTML("beforeend", lastDeleted);
  chatArea.scrollTop = chatArea.scrollHeight;
});

// ====== VOICE READER ======
let isSpeaking = false;

voiceBtn.addEventListener("click", () => {
  const botMessages = chatArea.querySelectorAll(".bot-message");
  if (botMessages.length === 0) return alert("No bot message to read!");
  const lastBotMsg = botMessages[botMessages.length - 1].textContent.replace("Bot: ", "");

  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
  } else {
    const utterance = new SpeechSynthesisUtterance(lastBotMsg);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
    isSpeaking = true;
    utterance.onend = () => (isSpeaking = false);
  }
});

// ====== HISTORY MODAL ======
historyBtn.addEventListener("click", () => {
  const messages = chatArea.querySelectorAll(".bot-message, .user-message");
  historyContent.innerHTML = "";
  messages.forEach((m) => {
    const item = document.createElement("div");
    item.textContent = m.textContent;
    item.style.marginBottom = "8px";
    historyContent.appendChild(item);
  });
  historyModal.style.display = "flex";
});

closeHistoryBtn.addEventListener("click", () => (historyModal.style.display = "none"));

clearHistoryBtn.addEventListener("click", () => {
  historyContent.innerHTML = "";
  const allMessages = chatArea.querySelectorAll(".bot-message, .user-message");
  allMessages.forEach((msg) => {
    if (msg.id !== "greeting") msg.remove();
  });
  alert("Chat history cleared!");
});

// ====== TOGGLE MOBILE/LAPTOP VIEW ======
toggleViewBtn.addEventListener("click", () => {
  chatContainer.classList.toggle("mobile-view");

  if (chatContainer.classList.contains("mobile-view")) {
    toggleViewBtn.textContent = "💻 Laptop View";
  } else {
    toggleViewBtn.textContent = "📱 Mobile View";
  }
});
