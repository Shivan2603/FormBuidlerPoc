document.addEventListener('DOMContentLoaded', () => {
    initializeDraggableElements(); 
    initializeFormEvents();
    loadFormForViewing();
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
async function viewForm(id) {
    window.location.href = `formView.html?id=${id}`; 
}
function initializeFormEventsForViewing() {
    document.querySelectorAll('input, textarea, select').forEach(element => {
        element.disabled = true;
    });
}
function initializeFormEvents() {
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const formElements = [];

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

                    let value;
                    switch (type) {
                        case 'checkbox': value = element.checked; break;
                        case 'radio': value = element.checked ? element.value : null; break;
                        default: value = element.value; break;
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

            const formTitle = prompt("Enter form title:", document.getElementById('formTitleInput')?.value || "Untitled Form") || "Untitled Form"; // Prompt for title with default value
            const formDescription = prompt("Enter form description:", document.getElementById('formDescriptionInput')?.value || "") || ""; // Prompt for description with default value

            const formData = {
                title: formTitle,
                description: formDescription,
                formData: JSON.stringify(formElements)
            };

            const urlParams = new URLSearchParams(window.location.search);
            const formId = urlParams.get('id');
            console.log("Form Data Before Saving:", formData); 

            await saveForm(formData, formId);
        });
    }
}
function initializeFormEvents() {
    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const formElements = [];

            console.log('Form elements containers:', formCanvas.querySelectorAll('.form-element-container, .group-container'));

            formCanvas.querySelectorAll('.form-element-container, .group-container').forEach(container => {
                const elements = container.querySelectorAll('.form-element');
                console.log('Elements in container:', elements);

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

                    let value;
                    switch (type) {
                        case 'checkbox': value = element.checked; break;
                        case 'radio': value = element.checked ? element.value : null; break;
                        default: value = element.value; break;
                    }

                    console.log(`Processing element: ${labelText} (${type}) with value: ${value}`);

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

            console.log('Form elements array:', formElements);

            const formTitle = prompt("Enter form title:", document.getElementById('formTitleInput')?.value || "Untitled Form") || "Untitled Form"; // Prompt for title with default value
            const formDescription = prompt("Enter form description:", document.getElementById('formDescriptionInput')?.value || "") || ""; // Prompt for description with default value

            const formData = {
                title: formTitle,
                description: formDescription,
                formData: JSON.stringify(formElements)
            };

            const urlParams = new URLSearchParams(window.location.search);
            const formId = urlParams.get('id');
            console.log("Form Data Before Saving:", formData);

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
async function loadFormForViewing() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');

    if (!formId) {
        console.error('No form ID provided');
        return;
    }

    try {
        const response = await fetch(`/api/form/${formId}`);
        if (response.ok) {
            const submittedForm = await response.json();
            displayForm(submittedForm);
        } else {
            console.error('Failed to load form:', response.status);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

function displayForm(submittedForm) {
    console.log("Submitted Form Data:", submittedForm);  
    console.log("Form Elements:", submittedForm.elements); 

    const formTitle = document.getElementById('formTitle');
    const formDescription = document.getElementById('formDescription');
    const formElements
        = document.getElementById('formElements');

    formTitle.textContent = submittedForm.title || "Untitled Form";
    formDescription.textContent = submittedForm.description || "";

    let elementsToDisplay = submittedForm.elements;

    if (submittedForm.formData && typeof submittedForm.formData === 'string') {
        try {
            elementsToDisplay = JSON.parse(submittedForm.formData); 
        } catch (error) {
            console.error("Error parsing formData:", error);
            return;
        }
    }

    if (!Array.isArray(elementsToDisplay)) {
        console.error('Form data is not in the expected format:', elementsToDisplay);
        return;
    }

    elementsToDisplay.forEach(elementData => {
        const container = renderFormElement(elementData);
        if (container) {
            formElements.appendChild(container);
        }
    });
}
function renderFormElement(elementData) {
    const type = elementData.type;
    let element;
    container.classList.add('form-element-container');

    switch (type) {
        case 'text':
        case 'email':
        case 'number':
        case 'date':
        case 'url':
        case 'time':
        case 'color':
        case 'radio':
        case 'checkbox':
            element = document.createElement('input');
            element.type = type;
            element.value = elementData.value;
            element.placeholder = elementData.placeholder;

            if (elementData.validationRule) {
                const [ruleType, ruleValue] = elementData.validationRule.split(':');
                switch (ruleType) {
                    case 'required':
                        element.required = true;
                        break;
                    case 'minlength':
                    case 'maxlength':
                        element[ruleType] = ruleValue;
                        break;
                    case 'pattern':
                        element.pattern = ruleValue;
                        break;
                }
            }
            break;
        case 'textarea':
            element = document.createElement('textarea');
            element.value = elementData.value;
            element.placeholder = elementData.placeholder;
            break;
        case 'select':
            element = document.createElement('select');
            if (!elementData.options || !Array.isArray(elementData.options)) {
                console.error("Invalid options for select element:", elementData);
                return null; 
            }
            elementData.options.forEach(optionText => {
                const option = document.createElement('option');
                option.value = optionText;
                option.text = optionText;
                option.selected = optionText === elementData.value;
                element.add(option);
            });
            break;
        case 'radio':
            const radioGroup = document.createElement('div');

            if (!elementData.options || !Array.isArray(elementData.options)) {
                console.error("Invalid options for radio element:", elementData);
                return null;
            }

            elementData.options.forEach(optionText => {
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = elementData.label;
                radio.value = optionText;
                radio.checked = optionText === elementData.value;
                radioGroup.appendChild(radio);

                const label = document.createElement('label');
                label.textContent = optionText;
                radioGroup.appendChild(label);
            });

            return radioGroup;
        case 'checkbox':
            element = document.createElement('input');
            element.type = 'checkbox';
            element.checked = elementData.checked;
            break;
        default:
            console.error(`Unsupported element type: ${type}`);
            return null;
    }

    element.disabled = true;
    const container = document.createElement('div');
    container.classList.add('form-element-container');

    const label = document.createElement('label');
    label.textContent = elementData.label;
    container.appendChild(label);
    container.appendChild(label);
    const input = document.createElement('input');
    input.type = elementData.type;
    input.name = elementData.name;
    input.value = elementData.value;
    input.disabled = true;

    container.appendChild(input);

    return container;
}


function addDropdown(labelText) {
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('group-container');

    const groupHeader = document.createElement('h3');
    groupHeader.textContent = labelText;

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const editGroupButton = document.createElement('button');
    editGroupButton.textContent = '✏️'; 
    editGroupButton.classList.add('icon-button', 'edit'); 

    editGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        const newGroupName = prompt("Edit group name:", groupHeader.textContent);
        if (newGroupName !== null) {
            groupHeader.textContent = newGroupName;
        }
    });

    const deleteGroupButton = document.createElement('button');
    deleteGroupButton.textContent = '🗑️';
    deleteGroupButton.classList.add('icon-button', 'delete');

    deleteGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        groupContainer.remove();
    });

    buttonContainer.appendChild(editGroupButton);
    buttonContainer.appendChild(deleteGroupButton);

    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(buttonContainer);

    const dropdown = document.createElement('select');
    dropdown.classList.add('form-element');
    dropdown.name = labelText; 

    dropdown.style.width = '200px'; 

    let optionCount = parseInt(prompt("How many options do you want to add to the dropdown?", "1"), 10);
    if (isNaN(optionCount) || optionCount < 1) return; 

    for (let i = 0; i < optionCount; i++) {
        const optionText = prompt(`Enter text for option ${i + 1}:`, `Option ${i + 1}`);
        const option = document.createElement('option');
        option.textContent = optionText || `Option ${i + 1}`;
        dropdown.appendChild(option);
    }

    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(buttonContainer);
    groupContainer.appendChild(dropdown); 

    formCanvas.appendChild(groupContainer);
}

function addMultipleElements(type, groupName) {
    const groupContainer = document.createElement('div');
    groupContainer.classList.add('group-container');

    const groupHeader = document.createElement('h3');
    groupHeader.textContent = groupName;

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const editGroupButton = document.createElement('button');
    editGroupButton.textContent = '✏️';   
    editGroupButton.classList.add('icon-button', 'edit');

    editGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        const newGroupName = prompt("Edit group name:", groupHeader.textContent);
        if (newGroupName !== null) {
            groupHeader.textContent = newGroupName;
            updateOptionLabels(groupContainer, newGroupName);
        }
    });

    const deleteGroupButton = document.createElement('button');
    deleteGroupButton.textContent = '🗑️'; 
    deleteGroupButton.classList.add('icon-button', 'delete'); 

    deleteGroupButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        groupContainer.remove(); 
    });

    buttonContainer.appendChild(editGroupButton);
    buttonContainer.appendChild(deleteGroupButton);

    groupContainer.appendChild(groupHeader);
    groupContainer.appendChild(buttonContainer);

    let count = parseInt(prompt("How many elements do you want to add?", "1"), 10);
    if (isNaN(count) || count < 1) return;

    for (let i = 0; i < count; i++) {
        const container = document.createElement('div');
        container.classList.add('form-element-container');

        const optionName = prompt(`Enter name for option ${i + 1}:`, `${groupName} ${i + 1}`);

        const label = document.createElement('label');
        label.textContent = optionName || `${groupName} ${i + 1}`;

        const element = document.createElement('input');
        element.type = type;
        element.classList.add(type === 'checkbox' ? 'checkbox-element' : 'radio-element');
        element.name = groupName;
        element.value = optionName;

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

    const optionNameInput = document.createElement('input');
    optionNameInput.type = 'text';
    optionNameInput.placeholder = `Enter name for option ${optionNumber}`;

    const label = document.createElement('label');
    label.textContent = optionNameInput.value || `${groupName} ${optionNumber}`;

    optionNameInput.addEventListener('input', () => {
        label.textContent = optionNameInput.value || `${groupName} ${optionNumber}`;
        element.value = optionNameInput.value; 
    });

    const element = document.createElement('input');
    element.type = type;
    element.classList.add(type === 'checkbox' ? 'checkbox-element' : 'radio-element');
    element.name = groupName;
    element.value = optionNameInput.value || label.textContent;

    container.appendChild(optionNameInput);
    container.appendChild(label);
    container.appendChild(element);
    groupContainer.appendChild(container);
    addEditAndDeleteButtons(container, label, element);
}

function updateOptionLabels(groupContainer, newGroupName) {
    const labels = groupContainer.querySelectorAll('.form-element-container label');
    labels.forEach((label, index) => {
        label.textContent = `${newGroupName} ${index + 1}`;
    });

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
            element.classList.add('checkbox-element');
            element.id = `element-${Math.random().toString(36).substr(2, 9)}`;
            break;
        case 'radio':
            element = document.createElement('input');
            element.type = 'radio';
            element.id = `element-${Math.random().toString(36).substr(2, 9)}`;
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

function addEditAndDeleteButtons(container, label, element) {
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

    if (label) {
        editButton.addEventListener('click', (event) => {
            event.stopPropagation();

            const newLabel = prompt("Edit label:", label.textContent);
            if (newLabel !== null) {
                label.textContent = newLabel;
                if (element.id) {
                    label.setAttribute('for', element.id);
                }
            }
            if (element.tagName === 'SELECT') {
                editDropdownOptions(element);
            } else if (element.type === 'checkbox' || element.type === 'radio') {
                editGroupedOption(element);
            } else {
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

    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        if (!confirm("Are you sure you want to delete this element?")) {
            return;
        }
        if (element.classList.contains('radio-element') || element.classList.contains('checkbox-element')) {
            const groupContainer = container.closest('.group-container');
            container.remove();
            if (groupContainer && groupContainer.children.length === 2) {
                groupContainer.remove();
            }
        } else {
            container.remove();
        }
    });
    if (editButton && deleteButton) {
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);
        container.appendChild(buttonContainer);
    } else {
        console.error("Could not create edit or delete buttons.");
    }
}

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
            const result = await response.json()

            alert(method === 'POST' ? 'Form saved successfully!' : 'Form updated successfully!');

            if (method === 'POST') {
                window.location.href = 'savedForms.html';
            } else {
                
            }
        } else {
            const error = await response.json();
            const errorMessage = error.message || 'An error occurred while saving the form.';
            alert(errorMessage); 
        }

    } catch (error) {
        alert('A network error occurred. Please try again.');
    }
}


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
        formData: JSON.stringify(formElements) 
    };
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    saveForm(formData);
});

document.getElementById('submitButton').addEventListener('click', () => {
    const formData = Array.from(formCanvas.children).filter(child => child.tagName === 'DIV').map(container => {
        const label = container.querySelector('label');
        const element = container.querySelector('.form-element');
        return {
            type: element.tagName.toLowerCase(),
            value: element.value || (element.checked ? true : false) 
        };
    });
    console.log('Form submitted with data:', formData);
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