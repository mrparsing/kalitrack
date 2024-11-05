async function logout() {
    try {
        await auth.signOut();
        showNotification("Logout effettuato con successo!", "green");
        window.location.href = "../../index.html";
    } catch (error) {
        console.error("Errore durante il logout:", error);
        showNotification("Si è verificato un errore durante il logout.", "red");
    }
}

function showNotification(message, backgroundColor) {
    // Crea l'elemento della notifica
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = message;

    // Applica i colori personalizzati
    notification.style.backgroundColor = backgroundColor;

    // Aggiungi la notifica al body
    document.body.appendChild(notification);

    // Usa un timeout per aggiungere la classe 'show' per la transizione di visibilità e opacità
    setTimeout(() => {
        notification.classList.add('show'); // Aggiungi la classe 'show'
    }, 10); // Piccolo timeout per assicurarsi che la classe venga applicata dopo essere aggiunta al DOM

    // Fai svanire la notifica dopo 3 secondi
    setTimeout(() => {
        notification.classList.remove('show'); // Rimuovi la classe 'show'
        setTimeout(() => {
            document.body.removeChild(notification); // Rimuovila dal DOM
        }, 500); // Attendi la transizione di fade-out
    }, 3000); // Notifica visibile per 3 secondi
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    const menuButton = document.getElementById('menuButton');

    sidebar.classList.toggle('active');
    overlay.classList.toggle('visible');

    // Cambia l'icona del pulsante in base allo stato del menu
    if (sidebar.classList.contains('active')) {
        menuButton.innerHTML = '<i class="fas fa-times"></i>'; // Icona "X" quando il menu è aperto
    } else {
        menuButton.innerHTML = '<i class="fas fa-bars"></i>'; // Icona di hamburger quando il menu è chiuso
    }
}

function showLoader() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
}

function hideLoader() {
    const loader = document.getElementById('loader');
    loader.style.display = 'none';
}

// Configura Firebase con le tue impostazioni
const firebaseConfig = {
    apiKey: "AIzaSyB2qNYCMQMjm6pAqTEWvP-1FWfPfKaQCi8",
    authDomain: "kalitrack.firebaseapp.com",
    projectId: "kalitrack",
    storageBucket: "kalitrack.appspot.com",
    messagingSenderId: "253824979149",
    appId: "1:253824979149:web:21f3085e86bb3a41821984",
    measurementId: "G-498X9RNHLC"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();