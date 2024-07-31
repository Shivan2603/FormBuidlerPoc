document.addEventListener('DOMContentLoaded', () => {
    initializeDraggableElements(); // Initialize draggable elements outside of the initializeFormEvents function
    initializeFormEvents(); // Initialize form events
    const urlParams = new URLSearchParams(window.location.search);
    const formIdToEdit = urlParams.get('id');
    if (formIdToEdit) {
        loadFormForEditing(formIdToEdit);
    }
});
function initializeDraggableElements() {
    document.querySelectorAll('.draggable').forEach(item => {
        item.addEventListener('dragstart', dragStart);
    });

    formCanvas.addEventListener('dragover', dragOver);
    formCanvas.addEventListener('drop', drop);
}
function initializeFormEvents() {
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const formElements = [];

            //Gather form elements and their data
            formCanvas.querySelectorAll('.form-element-container, .group-container').forEach(container => {
                const elements = container.querySelectorAll('.form-element');
                elements.forEach(element => {
                    let labelText = container.querySelector('label')?.textContent || "Untitled Element";
                    let type = element.tagName.toLowerCase();

                    if (container.classList.contains('group-container')) {
                        const groupName = container.querySelector('h3').textContent;
                        labelText = `${groupName} ${element.parentElement.querySelector('label')?.textContent || ''}`;
                        if (type === 'input') {
                            type = element.type;
                        }
                    }

                    const options = [];
                    if (type === 'select') {
                        element.querySelectorAll('option').forEach(option => {
                            options.push(option.text);
                        });
                    }

                    // Get values for radio buttons and checkboxes
                    let value = element.value;
                    if (type === 'radio' || type === 'checkbox') {
                        value = element.checked ? element.value : null;
                    }

                    formElements.push({
                        type,
                        label: labelText,
                        name: element.name || '',
                        placeholder: element.placeholder || '',
                        options: options,
                        checked: element.checked || false,
                        value: value || '',
                    });
                });
            });
            //Prompts for Title and Description before Save (updated)
            const formTitle = prompt("Enter form title:", document.getElementById('formTitleInput')?.value || "Untitled Form") || "Untitled Form"; // Prompt for title with default value
            const formDescription = prompt("Enter form description:", document.getElementById('formDescriptionInput')?.value || "") || ""; // Prompt for description with default value

            const formData = {
                title: formTitle, // Use prompted title
                description: formDescription, // Use prompted description
                formData: JSON.stringify(formElements)
            };

            const urlParams = new URLSearchParams(window.location.search);
            const formId = urlParams.get('id');

            await saveForm(formData, formId);
        });
    }
}

document.querySelectorAll('.draggable').forEach(item => {
    item.addEventListener('dragstart', dragStart);
});

const formCanvas = document.getElementById('formCanvas');
let editingElement = null;

formCanvas.addEventListener('dragover', dragOver);
formCanvas.addEventListener('drop', drop);

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.type);
}


function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');

    if (type === 'checkbox' || type === 'radio') {
        const groupName = prompt("Enter group name for checkboxes/radio buttons:", "Group Name");
        if (!groupName) return;
        addMultipleElements(type, groupName);
    } else if (type === 'select') {
        const groupName = prompt("Enter group name for the dropdown:", "Dropdown Name");
        if (!groupName) return;
        addDropdown(groupName);
    } else {
        const labelText = prompt("Enter label for the element:", "Label");
        if (!labelText) return;
        const container = document.createElement('div');
        container.classList.add('form-element-container');

        const label = document.createElement('label');
        label.textContent = labelText;

        const element = addElementToForm(type);
        container.appendChild(label);
        container.appendChild(element);

        label.setAttribute('for', element.id);
        addEditAndDeleteButtons(container, label, element);

        formCanvas.appendChild(container);
    }
}
// Function to load form data into the form builder (used in formEdit.html)
async function loadFormForViewing() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');

    if (!formId) {
        console.error('No form ID provided');
        return;
    }

    const response = await fetch(`/api/form/${formId}`);
    if (response.ok) {
        const submittedForm = await response.json();
        const formData = JSON.parse(submittedForm.formData);

        const formTitle = document.getElementById('formTitle');
        const formDescription = document.getElementById('formDescription');
        const formElements
            = document.getElementById('formElements');
        formTitle.textContent = submittedForm.title;
        formDescription.textContent = submittedForm.description;

        formData.forEach(elementData => {
            const container = document.createElement('div');
            container.classList.add('form-element-container');

            const label = document.createElement('label');
            label.textContent = elementData.label;
            container.appendChild(label);

            const element = renderFormElement(elementData);
            if (element) {
                container.appendChild(element);
                formElements.appendChild(container);
            }
        });
    } else {
        console.error('Failed to load form:', response.status);
    }
}

function renderFormElement(elementData) {
    const type = elementData.type;
    let element;

    switch (type) {
        case 'text':
        case 'email':
        case 'number':
        case 'date':
        case 'time':
        case 'url':
        case 'color':
            element = document.createElement('input');
            element.type = type;
            element.value = elementData.value || '';
            element.placeholder = elementData.placeholder || '';
            break;
        case 'textarea':
            element = document.createElement('textarea');
            element.value = elementData.value || '';
            element.placeholder = elementData.placeholder || '';
            break;
        case 'select':
            element = document.createElement('select');
            elementData.options.forEach(optionText => {
                const option = document.createElement('option');
                option.value = optionText;
                option.text = optionText;
                option.selected = optionText === elementData.value;
                element.add(option);
            });
            break;
        case 'checkbox':
        case 'radio':
            element = document.createElement('input');
            element.type = type;
            element.name = elementData.name;
            element.value = elementData.value;
            element.checked = elementData.checked;
            // Create label for checkbox/radio button
            const optionLabel = document.createElement('label');
            optionLabel.textContent = elementData.label;
            optionLabel.setAttribute('for', element.id);
            formElements.appendChild(optionLabel); // Append the label
            break;
        default:
            console.error(`Unsupported element type: ${type}`);
            return null;
    }

    element.disabled = true; // Disable the element for viewing only
    element.classList.add('form-element');
    return element;
}


function addDropdown(labelText) {
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('group-container');

    // Create a header for the group
    const groupHeader = document.createElement('h3');
    groupHeader.textContent = labelText; // Use labelText as group name

    // Create a button container for edit and delete buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    // Edit Button for Group
    const editGroupButton = document.createElement('button');
    editGroupButton.textContent = '✏️'; // Edit icon
    editGroupButton.classList.add('icon-button', 'edit'); // Add specific class for edit

    editGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the label click event
        const newGroupName = prompt("Edit group name:", groupHeader.textContent);
        if (newGroupName !== null) {
            groupHeader.textContent = newGroupName; // Update group header
        }
    });

    // Delete Button for Group
    const deleteGroupButton = document.createElement('button');
    deleteGroupButton.textContent = '🗑️'; // Delete icon
    deleteGroupButton.classList.add('icon-button', 'delete'); // Add specific class for delete

    deleteGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the label click event
        groupContainer.remove(); // Remove the entire group container
    });

    // Append buttons to the button container
    buttonContainer.appendChild(editGroupButton);
    buttonContainer.appendChild(deleteGroupButton);

    // Append group header and button container to the group container
    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(buttonContainer);

    // Create the dropdown element
    const dropdown = document.createElement('select');
    dropdown.classList.add('form-element');
    dropdown.name = labelText; // Set the name of the dropdown

    // Set a fixed width for the dropdown
    dropdown.style.width = '200px'; // Set a fixed width for the dropdown

    // Add options to the dropdown
    let optionCount = parseInt(prompt("How many options do you want to add to the dropdown?", "1"), 10);
    if (isNaN(optionCount) || optionCount < 1) return; // Exit if invalid count is provided

    for (let i = 0; i < optionCount; i++) {
        const optionText = prompt(`Enter text for option ${i + 1}:`, `Option ${i + 1}`);
        const option = document.createElement('option');
        option.textContent = optionText || `Option ${i + 1}`; // Default text if none provided
        dropdown.appendChild(option);
    }

    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(buttonContainer);
    groupContainer.appendChild(dropdown); // Append the dropdown to the group container

    // Append the group container to the form canvas
    formCanvas.appendChild(groupContainer);
}

function addMultipleElements(type, groupName) {
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('group-container');

    const groupHeader = document.createElement('h3');
    groupHeader.textContent = groupName;

    // Create a button container for edit and delete buttons for the group
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    // Edit Button for Group
    const editGroupButton = document.createElement('button');
    editGroupButton.textContent = '✏️'; // Edit icon
    editGroupButton.classList.add('icon-button', 'edit'); // Add specific class for edit

    editGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the label click event
        const newGroupName = prompt("Edit group name:", groupHeader.textContent);
        if (newGroupName !== null) {
            groupHeader.textContent = newGroupName; // Update group header
            updateOptionLabels(groupContainer, newGroupName); // Update option labels to match the new group name
        }
    });

    // Delete Button for Group
    const deleteGroupButton = document.createElement('button');
    deleteGroupButton.textContent = '🗑️'; // Delete icon
    deleteGroupButton.classList.add('icon-button', 'delete'); // Add specific class for delete

    deleteGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the label click event
        groupContainer.remove(); // Remove the entire group container
    });

    // Append buttons to the button container
    buttonContainer.appendChild(editGroupButton);
    buttonContainer.appendChild(deleteGroupButton);

    // Append group header and button container to the group container
    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(buttonContainer);

    let count = parseInt(prompt("How many elements do you want to add?", "1"), 10);
    if (isNaN(count) || count < 1) return;

    for (let i = 0; i < count; i++) {
        const container = document.createElement('div');
        container.classList.add('form-element-container');

        const optionName = prompt(`Enter name for option ${i + 1}:`, `${groupName} ${i + 1}`);

        const label = document.createElement('label');
        label.textContent = optionName || `${groupName} ${i + 1}`; // Use the custom name or the default

        const element = document.createElement('input');
        element.type = type;
        element.classList.add(type === 'checkbox' ? 'checkbox-element' : 'radio-element');
        element.name = groupName;
        element.value = optionName; // Set the value to the optionName

        container.appendChild(label);
        container.appendChild(element);
        groupContainer.appendChild(container);
        addEditAndDeleteButtons(container, label, element);
    }

    formCanvas.appendChild(groupContainer);
}
function addOptionElement(groupContainer, type, groupName, optionNumber) {
    const container = document.createElement('div');
    container.classList.add('form-element-container');

    // Input for Option Name (with label and event listener)
    const optionNameInput = document.createElement('input');
    optionNameInput.type = 'text';
    optionNameInput.placeholder = `Enter name for option ${optionNumber}`;

    const label = document.createElement('label');
    label.textContent = optionNameInput.value || `${groupName} ${optionNumber}`; // Default or user-entered name

    optionNameInput.addEventListener('input', () => {
        label.textContent = optionNameInput.value || `${groupName} ${optionNumber}`; // Update label on name change
        element.value = optionNameInput.value; // Update value for submission
    });

    const element = document.createElement('input');
    element.type = type;
    element.classList.add(type === 'checkbox' ? 'checkbox-element' : 'radio-element');
    element.name = groupName;
    element.value = optionNameInput.value || label.textContent; // Set initial value

    container.appendChild(optionNameInput);
    container.appendChild(label);
    container.appendChild(element);
    groupContainer.appendChild(container);
    addEditAndDeleteButtons(container, label, element);
}

// Helper function to update option labels
function updateOptionLabels(groupContainer, newGroupName) {
    const labels = groupContainer.querySelectorAll('.form-element-container label');
    labels.forEach((label, index) => {
        // Instead of taking value from input, just update with the new group name
        label.textContent = `${newGroupName} ${index + 1}`;
    });

    // Update the name and value of the radio/checkbox inputs
    const elements = groupContainer.querySelectorAll('.form-element');
    elements.forEach((element, index) => {
        element.name = newGroupName;
        element.value = `${newGroupName} ${index + 1}`;
    });
}


function addElementToForm(type) {
    let element;
    switch (type) {
        case 'text':
            element = document.createElement('input');
            element.type = 'text';
            element.placeholder = 'Enter text';
            break;
        case 'textarea':
            element = document.createElement('textarea');
            element.placeholder = 'Enter text';
            break;
        case 'number':
            element = document.createElement('input');
            element.type = 'number';
            element.placeholder = 'Enter number';
            break;
        case 'date':
            element = document.createElement('input');
            element.type = 'date';
            break;
        case 'checkbox':
            element = document.createElement('input');
            element.type = 'checkbox';
            element.classList.add('checkbox-element'); // Add a class for checkboxes
            element.id = `element-${Math.random().toString(36).substr(2, 9)}`; // Generate a unique ID
            break;
        case 'radio':
            element = document.createElement('input');
            element.type = 'radio';
            element.id = `element-${Math.random().toString(36).substr(2, 9)}`; // Generate a unique ID
            break;
        case 'select':
            element = document.createElement('select');
            const option = document.createElement('option');
            option.textContent = 'Select an option';
            element.appendChild(option);
            break;
        case 'file':
            element = document.createElement('input');
            element.type = 'file';
            break;
        case 'email':
            element = document.createElement('input');
            element.type = 'email';
            element.placeholder = 'Enter email';
            break;
        case 'phone':
            element = document.createElement('input');
            element.type = 'tel';
            element.placeholder = 'Enter phone number';
            break;
        case 'url':
            element = document.createElement('input');
            element.type = 'url';
            element.placeholder = 'Enter URL';
            break;
        case 'color':
            element = document.createElement('input');
            element.type = 'color';
            break;
        case 'range':
            element = document.createElement('input');
            element.type = 'range';
            break;
        case 'time':
            element = document.createElement('input');
            element.type = 'time';
            break;
        case 'range':
            element = document.createElement('input');
            element.type = 'range';
            element.min = 0;
            element.max = 100;
            break;
        default:
            return;
    }

    element.classList.add('form-element');
    return element;
}

// Function to add edit and delete buttons for labels
// Function to add edit and delete buttons (refined)
function addEditAndDeleteButtons(container, label, element) {
    // Create a button container
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const editButton = document.createElement('button');
    editButton.classList.add('icon-button',
        'edit');
    editButton.innerHTML = `
   <svg viewBox="0 0 24 24" class="icon-svg">
    <path d="M14.06 9l.94.94-2.93 2.93 2.93 2.93-.94.94L12.12 12l2.93-2.93zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM5.92 19H5v-.92l9.06-9.06.92.92L5.92 19z" /> 
   </svg>
  `;

    // Check if we have a valid label to edit. Some elements might not have associated labels (e.g., groups)
    if (label) {
        editButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the event from bubbling up

            const newLabel = prompt("Edit label:", label.textContent);
            if (newLabel !== null) {
                label.textContent = newLabel;
                if (element.id) {
                    label.setAttribute('for', element.id);
                }
            }
            if (element.tagName === 'SELECT') {
                // Dropdown (select)
                editDropdownOptions(element);
            } else if (element.type === 'checkbox' || element.type === 'radio') {
                // Checkbox or Radio Button
                editGroupedOption(element);
            } else {
                // Other elements (text, email, etc.)
                const newLabel = prompt("Edit label:", label.textContent);
                if (newLabel !== null) {
                    label.textContent = newLabel;
                    if (element.id) {
                        label.setAttribute('for', element.id);
                    }
                }
            }
        });
    }
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('icon-button', 'delete');
    deleteButton.innerHTML = `
  <svg viewBox="0 0 24 24" class="icon-svg">
   <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
 `;

    // Refined Delete Button Functionality
    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent event from bubbling up
        if (!confirm("Are you sure you want to delete this element?")) {
            return; // Don't delete if the user cancels
        }
        // Handle grouped elements
        if (element.classList.contains('radio-element') || element.classList.contains('checkbox-element')) {
            const groupContainer = container.closest('.group-container');
            container.remove(); // Remove the single option container
            if (groupContainer && groupContainer.children.length === 2) {
                // Only header and button container left
                groupContainer.remove(); // Remove the whole group
            }
        } else {
            container.remove(); // Remove the entire element container
        }
    });
    // Append buttons only if they are valid
    if (editButton && deleteButton) {
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
        container.appendChild(buttonContainer);
    } else {
        console.error("Could not create edit or delete buttons.");
    }
}

// Fetch existing forms from the API
async function fetchForms() {
    const response = await fetch('/api/form');
    if (response.ok) {
        const forms = await response.json();
        forms.forEach(form => {
            console.log(form);
        });
    } else {
        console.error('Failed to fetch forms:', response.status);
    }
}

// Save the form to the API

// Modify the saveForm function to handle both POST (new form) and PUT (update form)
async function saveForm(formData, formId = null) {
    const method = formId ? 'PUT' : 'POST';
    const url = formId ? `/api/form/${formId}` : '/api/form';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const result = await response.json(); // Get JSON response for more info (if any)

            // Display success message
            alert(method === 'POST' ? 'Form saved successfully!' : 'Form updated successfully!');

            // Update UI or redirect based on action
            if (method === 'POST') {
                window.location.href = 'savedForms.html'; // Redirect to the list of saved forms
            } else {
                // If updating, you might want to stay on the same page
                // Or you could refresh the page to show the updated data
                // window.location.reload(); 
            }
        } else {
            const error = await response.json(); // Try to get error message from API
            const errorMessage = error.message || 'An error occurred while saving the form.'; // Fallback message
            alert(errorMessage); // Show a specific error message
        }

    } catch (error) {
        alert('A network error occurred. Please try again.'); // Catch network issues
    }
}


// Handle save button click (updated)
document.getElementById('saveButton').addEventListener('click', async () => {
    const formElements = [];

    formCanvas.querySelectorAll('.form-element-container, .group-container').forEach(container => {
        const elements = container.querySelectorAll('.form-element');

        elements.forEach(element => {
            let labelText = "Untitled Element";
            if (container.classList.contains('group-container')) {
                const groupName = container.querySelector('h3').textContent;
                labelText = `${groupName} ${element.parentElement.querySelector('label')?.textContent || ''}`;
            } else if (container.querySelector('label')) {
                labelText = container.querySelector('label').textContent;
            }

            formElements.push({
                type: element.tagName.toLowerCase(),
                label: labelText,
                name: element.name || '',
                placeholder: element.placeholder || '',
                options: element.tagName.toLowerCase() === 'select' ? Array.from(element.options).map(option => option.text) : [], // Get dropdown options if applicable
                checked: element.checked || false,
                value: element.value || '',
                validationRule: ''
            });
        });
    });

    const formData = {
        title: "Your Form Title",
        description: "Your Form Description",
        formData: JSON.stringify(formElements) // Stringify the elements array
    };
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    saveForm(formData);
});

// Handle submit button click
document.getElementById('submitButton').addEventListener('click', () => {
    const formData = Array.from(formCanvas.children).filter(child => child.tagName === 'DIV').map(container => {
        const label = container.querySelector('label');
        const element = container.querySelector('.form-element');
        return {
            type: element.tagName.toLowerCase(),
            value: element.value || (element.checked ? true : false) // Capture value for checkboxes
        };
    });
    console.log('Form submitted with data:', formData);
    // Here you can send the form data to your backend for processing
});

async function submitForm() {
    const formElements = Array.from(formCanvas.children).filter(child => child.tagName === 'DIV').map(container => {
        const element = container.querySelector('.form-element');
        return {
            type: element.tagName.toLowerCase(),
            value: element.value || (element.checked ? true : false)
        };
    });
    const response = await fetch('/api/form/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formElements)
    });
    if (response.ok) {
        console.log('Form submitted successfully');
    } else {
        console.error('Failed to submit form:', response.status);
    }
}

document.getElementById('submitButton').addEventListener('click', submitForm);