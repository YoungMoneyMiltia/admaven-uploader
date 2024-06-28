document.getElementById('addEntryButton').addEventListener('click', addEntry);
document.getElementById('entryForm').addEventListener('submit', submitForm);

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

function submitForm(event) {
    event.preventDefault();

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
    });
}

function downloadExcel(data) {
    // Parse the response
    const parsedData = JSON.parse(data.body);
    console.log("parsed Data");

    // Prepare data for Excel
    const excelData = parsedData.map((item, index) => ({
        "Serial": index + 1,
        "Short Link": item.message[0].short,
        "Full Short Link": item.message[0].full_short,
        "Destination URL": item.message[0].destination_url,
        "Title":item.message[0].title
    }));

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Links");

    // Generate a file and trigger the download
    XLSX.writeFile(wb, "links.xlsx");
}
