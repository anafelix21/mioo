/* ============================================
   CLASE POCHIBOT
   Asistente de chatbot interactivo 🐮
   ============================================ */

class PochiBot {
  constructor() {
    this.toggle = document.getElementById("chatbot-toggle");
    this.close = document.getElementById("chatbot-close");
    this.chatbot = document.getElementById("chatbot");
    this.send = document.getElementById("chatbot-send");
    this.input = document.getElementById("chatbot-input");
    this.messages = document.getElementById("chatbot-messages");
    this.isTyping = false;
    this.conversationHistory = [];
    this.responseDatabase = this.initializeResponseDatabase();
    this.loadChatHistory();
    this.init();
  }

  init() {
    this.toggle.addEventListener("click", () => this.toggleChat());
    this.close.addEventListener("click", () => this.closeChat());
    this.send.addEventListener("click", () => this.sendMessage());
    this.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    this.input.addEventListener("input", () => this.handleInput());
  }

  initializeResponseDatabase() {
    return {
      saludo: {
        patrones: ["hola", "hi", "hey", "buenos", "buenas", "qué tal", "cómo estás"],
        respuestas: [
          "¡Hola! 👋 Soy PochiBot, tu asistente de Carnicería Pochito. ¿Qué necesitas hoy? 🐮",
          "¡Bienvenido a Carnicería Pochito! 🐮 ¿En qué puedo ayudarte?",
          "¡Hola! 😊 ¿Buscas carne fresca? Tenemos res, cerdo y pollo de excelente calidad."
        ]
      },
      res: {
        patrones: ["res", "vaca", "vacuno", "carne roja", "lomo", "bistec", "entrecot"],
        respuestas: [
          "🥩 La carne de res es perfecta para asados, guisos y parrillas. Contamos con cortes premium:\n- Lomo\n- Bistec\n- Entrecot\n¿Te interesa alguno?",
          "¡Excelente elección! 🔥 Nuestras carnes de res están frescas y de óptima calidad. Tenemos varios cortes disponibles."
        ]
      },
      pollo: {
        patrones: ["pollo", "ave", "pechuga", "muslo", "alita", "pollo entero"],
        respuestas: [
          "🍗 ¡Delicioso pollo fresco! Disponemos de:\n- Pechuga\n- Muslo\n- Alitas\n- Pollo entero\n¿Cuál prefieres?",
          "Tenemos pollo de excelente calidad, ideal para asados, guisos y frituras. ¿Qué corte necesitas?"
        ]
      },
      cerdo: {
        patrones: ["cerdo", "cercha", "chuleta", "costilla", "puerco", "jamón"],
        respuestas: [
          "🐷 ¡Deliciosas opciones de cerdo! Contamos con:\n- Chuletas\n- Costillas\n- Lomo\n- Tocino\n¿Qué te atrae?",
          "Nuestro cerdo es fresco y sabroso. Perfecto para barbacoas y comidas especiales. ¿Qué corte buscas?"
        ]
      },
      horario: {
        patrones: ["horario", "hora", "abierto", "cierra", "atención", "cuándo"],
        respuestas: [
          "⏰ *Nuestros horarios son:*\n📅 Lunes a Viernes: 8:00 AM - 6:00 PM\n📅 Sábados: 8:00 AM - 3:00 PM\n🛑 Domingos: Cerrados\n\n¿Hay algo más en lo que pueda ayudarte?"
        ]
      },
      contacto: {
        patrones: ["whatsapp", "llamar", "teléfono", "contacto", "pedido", "pedidos", "envío", "entrega"],
        respuestas: [
          "📱 ¡Fácil! Puedes contactarnos por:\n✅ *WhatsApp*: +51 913 608 946\n✅ *Tienda física*: Visítanos en nuestras instalaciones\n\nPodemos hacer envíos según tu ubicación. ¿Necesitas más información?"
        ]
      },
      gratitud: {
        patrones: ["gracias", "thanks", "muchas gracias", "agradecido", "ok perfecto"],
        respuestas: [
          "¡De nada! 🐮 Si necesitas algo más, aquí estaré. ¡Que disfrutes!",
          "¡Con gusto! 😊 Vuelve pronto a Carnicería Pochito."
        ]
      },
      producto: {
        patrones: ["precio", "cuánto cuesta", "valor", "costo", "pedir", "comprar"],
        respuestas: [
          "💰 Puedes ver todos nuestros precios en la tienda. ¿Hay algo específico que busques?",
          "Para conocer precios exactos, visita nuestra tienda o contáctanos por WhatsApp. ¿Qué producto te interesa?"
        ]
      },
      equipo: {
        patrones: ["cuchillo", "parrilla", "utensilios", "herramientas", "encendedor", "todo para asar"],
        respuestas: [
          "🔪 Contamos con una completa sección de *Todo para Asar*:\n- Cuchillos y utensilios\n- Parrillas y soportes\n- Combustible y encendido\n- Equipos de limpieza\n¿Te interesa conocer alguno?"
        ]
      }
    };
  }

  handleInput() {
    const text = this.input.value.trim();
    this.send.disabled = text.length === 0;
  }

  toggleChat() {
    this.chatbot.classList.toggle("hidden");
    if (!this.chatbot.classList.contains("hidden")) {
      this.input.focus();
    }
  }

  closeChat() {
    this.chatbot.classList.add("hidden");
  }

  sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isTyping) return;

    this.addMessage("user", text);
    this.conversationHistory.push({ sender: "user", text: text });
    this.saveChatHistory();
    this.input.value = "";
    this.send.disabled = true;

    this.showTypingIndicator();

    setTimeout(() => {
      const reply = this.getBotReply(text.toLowerCase());
      this.removeTypingIndicator();
      this.addMessage("bot", reply);
      this.conversationHistory.push({ sender: "bot", text: reply });
      this.saveChatHistory();
    }, 800 + Math.random() * 400);
  }

  getBotReply(text) {
    for (const [categoria, datos] of Object.entries(this.responseDatabase)) {
      for (const patron of datos.patrones) {
        if (text.includes(patron)) {
          return this.getRandomResponse(datos.respuestas);
        }
      }
    }
    return this.getRandomDefaultResponse();
  }

  getRandomResponse(respuestas) {
    return respuestas[Math.floor(Math.random() * respuestas.length)];
  }

  getRandomDefaultResponse() {
    const responses = [
      "🤔 Hmm, no entendí bien. ¿Puedes ser más específico? Pregúntame sobre nuestros productos, horarios o contacto.",
      "🐮 Disculpa, no capté bien tu pregunta. ¿Buscas carne de res, cerdo, pollo o algo para asar?",
      "😕 No sé mucho de eso, pero puedo ayudarte con:\n✅ Tipos de carne\n✅ Horarios\n✅ Contacto y pedidos\n¿Cuál te interesa?"
    ];
    return this.getRandomResponse(responses);
  }

  addMessage(sender, text) {
    const msg = document.createElement("div");
    msg.classList.add(sender === "user" ? "message-user" : "message-bot");
    msg.setAttribute("data-sender", sender);
    
    const contentDiv = document.createElement("div");
    msg.appendChild(contentDiv);
    
    this.messages.appendChild(msg);

    if (sender === "bot") {
      this.typeMessage(contentDiv, text);
    } else {
      contentDiv.innerHTML = text.replace(/\n/g, "<br>");
    }

    setTimeout(() => {
      this.messages.scrollTop = this.messages.scrollHeight;
    }, 50);
  }

  typeMessage(element, text, speed = 30) {
    let index = 0;
    const displayText = text.replace(/\n/g, "<br>");
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = displayText;
    const plainText = tempDiv.innerText;

    const typeInterval = setInterval(() => {
      if (index < plainText.length) {
        element.textContent = plainText.substring(0, index + 1);
        element.innerHTML = plainText.substring(0, index + 1).replace(/\n/g, "<br>");
        index++;
        this.messages.scrollTop = this.messages.scrollHeight;
      } else {
        clearInterval(typeInterval);
        element.innerHTML = text.replace(/\n/g, "<br>");
      }
    }, speed);
  }

  showTypingIndicator() {
    this.isTyping = true;
    const indicator = document.createElement("div");
    indicator.className = "message-bot typing-indicator";
    indicator.id = "typing-indicator";
    indicator.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    this.messages.appendChild(indicator);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  removeTypingIndicator() {
    this.isTyping = false;
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
  }

  saveChatHistory() {
    const history = this.conversationHistory.slice(-20);
    localStorage.setItem("pochibot-history", JSON.stringify(history));
  }

  loadChatHistory() {
    const saved = localStorage.getItem("pochibot-history");
    if (saved) {
      try {
        this.conversationHistory = JSON.parse(saved);
        this.conversationHistory.forEach(msg => {
          const msgDiv = document.createElement("div");
          msgDiv.classList.add(msg.sender === "user" ? "message-user" : "message-bot");
          msgDiv.innerHTML = msg.text.replace(/\n/g, "<br>");
          this.messages.appendChild(msgDiv);
        });
        this.messages.scrollTop = this.messages.scrollHeight;
      } catch (e) {
        console.error("Error cargando historial:", e);
      }
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    this.messages.innerHTML = `
      <div class="text-sm text-gray-600 mb-2">
        👋 ¡Hola! Soy <strong>PochiBot</strong>, tu asistente de la carnicería. ¿En qué puedo ayudarte hoy?
      </div>
    `;
    localStorage.removeItem("pochibot-history");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.pochiBot = new PochiBot();
});
