// variable to hold db connection
let db;
// establish connection to IndexedDB (called pizza_hunt and set to version 1)
const request = indexedDB.open('pizza_hunt', 1);

// event if database version changes
request.onupgradeneeded = function(event) {
// save reference to database
const db = event.target.result;
// Create Object Store named 'new_pizza' set auto-incrementing primary key
db.createObjectStore('new_pizza', { autoIncrement: true });
};

// when successful
request.onsuccess = function(event) {
    // save reference to db in global variable
    db = event.target.result;

    // check if online, if yes, send local db data to api
    if (navigator.onLine) {
        uploadPizza();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// if pizza submit attempted and no internet connection
function saveRecord(record) {
    // open new transaction with database (with read/write permission)
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store for 'new_pizza'
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to store with add method
    pizzaObjectStore.add(record);
};

function uploadPizza() {
    // open a transaction on db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // access object store
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    // on successful getAll(), run function
    getAll.onsuccess = function() {
        // if there's data in the indexDB, send to api
        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open another transaction
                const transaction = db.transaction(['new_pizza'], 'readwrite');
                // access new_pizza object store
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                // clear all items in store
                pizzaObjectStore.clear();

                alert('All saved pizza has been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);