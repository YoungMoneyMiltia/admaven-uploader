document.getElementById('addEntryButton').addEventListener('click', addEntry);
document.getElementById('entryForm').addEventListener('submit', submitForm);
document.getElementById('excelFile').addEventListener('change', handleFileUpload);

function addEntry() {
    const urlInput = document.querySelector('input[name="url"]');
    const titleInput = document.querySelector('input[name="title"]');
    const url = urlInput.value.trim();
    const title = titleInput.value.trim();

    // Validate both fields are either filled or empty
    if ((url && !title) || (!url && title)) {
        alert('Both URL and Title fields must be filled or both must be empty.');
        return;
    }

    if (url && title) {
        const entryContainer = document.getElementById('entriesContainer');
        const newEntry = document.createElement('div');
        newEntry.classList.add('entry');

        newEntry.innerHTML = `
            <span><strong>URL:</strong> ${url}</span>
            <span><strong>Title:</strong> ${title}</span>
        `;

        entryContainer.appendChild(newEntry);

        // Clear the input fields
        urlInput.value = '';
        titleInput.value = '';
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(firstSheet);

        const entryContainer = document.getElementById('entriesContainer');
        excelData.forEach(row => {
            const url = row.URL ? row.URL.trim() : '';
            const title = row.Title ? row.Title.trim() : '';

            if (url && title) {
                const newEntry = document.createElement('div');
                newEntry.classList.add('entry');
                newEntry.innerHTML = `
                    <span><strong>URL:</strong> ${url}</span>
                    <span><strong>Title:</strong> ${title}</span>
                `;
                entryContainer.appendChild(newEntry);
            }
        });
    };
    reader.readAsArrayBuffer(file);
}

function submitForm(event) {
    event.preventDefault();
    showLoader();

    const form = document.getElementById('entryForm');
    const formData = new FormData(form);

    const entries = [];
    document.querySelectorAll('#entriesContainer .entry').forEach(entry => {
        const entryData = {
            url: entry.children[0].textContent.replace('URL: ', ''),
            title: entry.children[1].textContent.replace('Title: ', '')
        };
        entries.push(entryData);
    });

    // Validate all URL and Title fields are either filled or empty
    const urlInput = document.querySelector('input[name="url"]').value.trim();
    const titleInput = document.querySelector('input[name="title"]').value.trim();
    if ((urlInput && !titleInput) || (!urlInput && titleInput)) {
        alert('Both URL and Title fields must be filled or both must be empty.');
        hideLoader();
        return;
    }

    const data = {
        sub_id: formData.get('subID'),
        bgImageUrl: formData.get('bgImageUrl'),
        entries: entries
    };

    fetch('https://4y81iezc94.execute-api.ap-south-1.amazonaws.com/Dev', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        downloadExcel(data);
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        hideLoader();
        clearForm();
    });
}

function downloadExcel(data) {
    // Parse the response
    const parsedData = JSON.parse(data.body);
    console.log("parsed Data", parsedData);

    // Prepare data for Excel
    const excelData = parsedData.map((item, index) => ({
        "Serial": index + 1,
        "Short Link": item.message[0].short,
        "Full Short Link": item.message[0].full_short,
        "Destination URL": item.message[0].destination_url,
        "Title": item.message[0].title,
        "Final Link": item.message[0].final_link
    }));

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Links");

    // Generate a file and trigger the download
    XLSX.writeFile(wb, "links.xlsx");
}

function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function clearForm() {
    document.getElementById('entryForm').reset();
    document.getElementById('entriesContainer').innerHTML = '';
}
