function saveMax(exercise, maxValue, date) {
    auth.onAuthStateChanged(user => {
        if (user) {
            const maxRef = db.collection("massimali").doc(user.uid);

            maxRef.update({
                [exercise]: firebase.firestore.FieldValue.arrayUnion({
                    value: parseFloat(maxValue),
                    date: date
                })
            }).then(() => {
                showNotification("Massimale salvato!", "green");
                document.getElementById("maxForm").reset();
                loadMax();
            }).catch(error => {
                maxRef.set({
                    [exercise]: [{ value: parseFloat(maxValue), date: date }]
                }, { merge: true }).then(() => {
                    showNotification("Massimale salvato!", "green");
                    document.getElementById("maxForm").reset();
                    loadMax();
                }).catch(error => {
                    console.error("Errore nel salvataggio del massimale:", error);
                });
            });
        } else {
            showNotification("Devi essere loggato per salvare i massimali.", "red");
        }
    });
}

// Funzione per caricare i massimali dal DB
function loadMax() {
    showLoader()
    auth.onAuthStateChanged(user => {
        if (user) {
            const maxRef = db.collection("massimali").doc(user.uid);
            maxRef.get().then((doc) => {
                const maxListEl = document.getElementById("maxList");
                maxListEl.innerHTML = "";

                if (doc.exists) {
                    const data = doc.data();

                    for (const exercise in data) {
                        const records = data[exercise];

                        if (Array.isArray(records) && records.length > 0) {
                            records.sort((a, b) => new Date(b.date) - new Date(a.date));
                            const { value, date } = records[0];

                            const maxItem = document.createElement("div");
                            maxItem.className = "max-item";
                            maxItem.innerHTML = `
                            <div class="button-massimali">
<div class="text">
<strong>${exercise}</strong>: 
<input type="number" value="${value}" id="max-${exercise}" style="width: 80px; background-color: #444; color: white; border-radius: 5px; padding: 5px;" /> - 
<input type="date" value="${date}" id="date-${exercise}" style="background-color: #444; color: white; border-radius: 5px; padding: 5px;" />
</div>
<div class="button-modifica">
<button class="edit-btn" onclick="updateMax('${exercise}')" style="padding: 10px;">Modifica</button>
<button class="delete-btn" onclick="deleteMax('${exercise}')">Elimina</button>
<button class="progress-btn" onclick="toggleProgress('${exercise}')" style="padding: 10px; margin: 5px;">Visualizza progresso</button>
</div>
<div id="progress-${exercise}" class="progress-section" style="display:none;">
<canvas id="chart-${exercise}" width="300" height="200"></canvas>
</div>
</div>

`;
                            maxListEl.appendChild(maxItem);
                        }
                    }
                } else {
                    maxListEl.innerHTML = "<p>Nessun massimale trovato.</p>";
                }
            }).catch((error) => {
                console.error("Errore nel caricamento dei massimali:", error);
            });
        } else {
            showNotification("Devi essere loggato per visualizzare i massimali.", "red");
        }
        hideLoader();
    });
}

// Funzione per aggiornare un massimale
function updateMax(exercise) {
    const newValue = parseFloat(document.getElementById(`max-${exercise}`).value);
    const newDate = document.getElementById(`date-${exercise}`).value; // Nuova data

    auth.onAuthStateChanged(user => {
        if (user) {
            const maxRef = db.collection("massimali").doc(user.uid);

            // Recupera l'array esistente
            maxRef.get().then((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    const records = data[exercise] || [];

                    // Trova l'indice dell'elemento da aggiornare o lo aggiunge come nuovo
                    const existingIndex = records.findIndex(record => record.date === newDate);

                    if (existingIndex > -1) {
                        // Se la data esiste già, aggiorna il valore
                        records[existingIndex].value = newValue;
                    } else {
                        // Altrimenti, aggiungi un nuovo oggetto
                        records.push({ value: newValue, date: newDate });
                    }

                    // Salva di nuovo l'array aggiornato
                    maxRef.update({
                        [exercise]: records
                    }).then(() => {
                        showNotification("Massimale aggiornato!", "green");
                        loadMax(); // Ricarica la lista
                    }).catch(error => {
                        console.error("Errore nell'aggiornamento del massimale:", error);
                    });
                }
            }).catch(error => {
                console.error("Errore nel recupero del massimale:", error);
            });
        }
    });
}
// Funzione per eliminare un massimale
function deleteMax(exercise) {
    auth.onAuthStateChanged(user => {
        if (user) {
            const maxRef = db.collection("massimali").doc(user.uid);
            maxRef.update({
                [exercise]: firebase.firestore.FieldValue.delete()
            }).then(() => {
                showNotification("Massimale eliminato!", "green");
                loadMax(); // Ricarica la lista dopo l'eliminazione
            }).catch(error => {
                console.error("Errore nell'eliminazione del massimale:", error);
            });
        }
    });
}

function loadChart(exercise, canvas) {
    auth.onAuthStateChanged(user => {
        if (user) {
            const maxRef = db.collection("massimali").doc(user.uid);
            maxRef.get().then((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    const records = data[exercise];

                    if (Array.isArray(records)) {
                        const labels = records.map(record => record.date);
                        const values = records.map(record => record.value);

                        const ctx = canvas.getContext('2d');
                        new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: exercise,
                                    data: values,
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }
                        });
                    }
                }
            }).catch(error => {
                console.error("Errore nel caricamento dei massimali:", error);
            });
        }
    });
}
