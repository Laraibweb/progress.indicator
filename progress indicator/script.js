// Multi-Step Form Application
class MultiStepForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = this.loadFormData();
        this.isAutoSaving = false;
        this.autoSaveTimeout = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.populateFormWithSavedData();
        this.updateProgressBar();
    }

    // Initialize DOM elements
    initializeElements() {
        this.form = document.getElementById('multiStepForm');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.submitBtn = document.getElementById('submitBtn');
        this.progressFill = document.getElementById('progressFill');
        this.progressStep = document.getElementById('progressStep');
        this.autosaveStatus = document.getElementById('autosaveStatus');
        this.summaryContainer = document.getElementById('summaryContainer');
        this.successMessage = document.getElementById('successMessage');
        this.resetBtn = document.getElementById('resetBtn');
    }

    // Attach event listeners
    attachEventListeners() {
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.prevBtn.addEventListener('click', () => this.prevStep());
        this.submitBtn.addEventListener('click', (e) => this.submitForm(e));
        this.resetBtn.addEventListener('click', () => this.resetForm());

        // Autosave on input change
        this.form.addEventListener('change', () => this.handleAutoSave());
        this.form.addEventListener('input', () => this.handleAutoSave());
    }

    // Load form data from localStorage
    loadFormData() {
        const saved = localStorage.getItem('formData');
        return saved ? JSON.parse(saved) : {};
    }

    // Save form data to localStorage
    saveFormData() {
        const formData = new FormData(this.form);
        const data = {};

        // Handle text inputs, selects, and text areas
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // For multiple values (like checkboxes), create an array
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        // Handle checkboxes that are unchecked
        this.form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (!data[checkbox.name] && checkbox.type === 'checkbox') {
                data[checkbox.name] = checkbox.checked ? 'on' : '';
            }
        });

        this.formData = data;
        localStorage.setItem('formData', JSON.stringify(data));
    }

    // Populate form with saved data
    populateFormWithSavedData() {
        if (Object.keys(this.formData).length === 0) return;

        // Restore text inputs, selects
        this.form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], select').forEach(input => {
            if (this.formData[input.name]) {
                input.value = this.formData[input.name];
            }
        });

        // Restore checkboxes
        this.form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (this.formData[checkbox.name]) {
                checkbox.checked = this.formData[checkbox.name] === 'on' || this.formData[checkbox.name] === true;
            }
        });
    }

    // Handle autosave
    handleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            this.saveFormData();
            this.showAutoSaveStatus();
        }, 1000);
    }

    // Show autosave status
    showAutoSaveStatus() {
        this.autosaveStatus.classList.add('show');
        setTimeout(() => {
            this.autosaveStatus.classList.remove('show');
        }, 2000);
    }

    // Get current step element
    getCurrentStepElement() {
        return document.querySelector(`[data-step="${this.currentStep}"]`);
    }

    // Validate current step
    validateStep() {
        const currentStep = this.getCurrentStepElement();
        const requiredInputs = currentStep.querySelectorAll('[required]');
        let isValid = true;
        const errors = {};

        requiredInputs.forEach(input => {
            const value = input.value.trim();
            let isFieldValid = true;

            // Check if field is empty
            if (value === '') {
                isFieldValid = false;
            }

            // Special validation for email
            if (input.type === 'email' && value !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isFieldValid = emailRegex.test(value);
            }

            // Special validation for phone
            if (input.type === 'tel' && value !== '') {
                const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
                isFieldValid = phoneRegex.test(value);
            }

            // Special validation for checkboxes (at least one should be checked)
            if (input.type === 'checkbox' && input.name === 'interests') {
                const checkedBoxes = currentStep.querySelectorAll('input[name="interests"]:checked');
                if (checkedBoxes.length === 0) {
                    isFieldValid = false;
                    errors['interests'] = 'Please select at least one interest';
                }
            }

            // Show error message if validation fails
            const errorElement = document.getElementById(`${input.id}Error`);
            if (errorElement) {
                if (!isFieldValid) {
                    isValid = false;
                    input.classList.add('error');
                    
                    // Set appropriate error message
                    let errorMessage = `${input.labels[0]?.textContent || input.name} is required`;
                    if (input.type === 'email') {
                        errorMessage = 'Please enter a valid email address';
                    } else if (input.type === 'tel') {
                        errorMessage = 'Please enter a valid phone number';
                    }
                    
                    errorElement.textContent = errorMessage;
                    errorElement.classList.add('show');
                } else {
                    input.classList.remove('error');
                    errorElement.classList.remove('show');
                    errorElement.textContent = '';
                }
            }
        });

        // Validate select dropdowns
        const selects = currentStep.querySelectorAll('select[required]');
        selects.forEach(select => {
            if (select.value === '') {
                isValid = false;
                select.classList.add('error');
                const errorElement = document.getElementById(`${select.id}Error`);
                if (errorElement) {
                    errorElement.textContent = 'Please select an option';
                    errorElement.classList.add('show');
                }
            } else {
                select.classList.remove('error');
                const errorElement = document.getElementById(`${select.id}Error`);
                if (errorElement) {
                    errorElement.classList.remove('show');
                    errorElement.textContent = '';
                }
            }
        });

        return isValid;
    }

    // Show specific step
    showStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(stepEl => {
            stepEl.classList.remove('active');
        });

        // Show current step
        const currentStepEl = document.querySelector(`[data-step="${step}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }

        // Update progress bar
        this.updateProgressBar();

        // Update button visibility
        this.updateButtonVisibility();

        // Generate summary if on last step
        if (step === this.totalSteps) {
            this.generateSummary();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update progress bar
    updateProgressBar() {
        const progress = (this.currentStep / this.totalSteps) * 100;
        this.progressFill.style.width = progress + '%';
        this.progressStep.textContent = `Step ${this.currentStep}`;
    }

    // Update button visibility
    updateButtonVisibility() {
        // Show/hide Previous button
        this.prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';

        // Show/hide Next button and Submit button
        if (this.currentStep === this.totalSteps) {
            this.nextBtn.style.display = 'none';
            this.submitBtn.style.display = 'block';
        } else {
            this.nextBtn.style.display = 'block';
            this.submitBtn.style.display = 'none';
        }
    }

    // Next step
    nextStep() {
        if (!this.validateStep()) {
            this.showValidationAlert();
            return;
        }

        this.saveFormData();

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }

    // Previous step
    prevStep() {
        this.saveFormData();

        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    // Show validation alert
    showValidationAlert() {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        alertDiv.textContent = 'Please fill in all required fields correctly before proceeding.';
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => alertDiv.remove(), 300);
        }, 3000);
    }

    // Generate summary
    generateSummary() {
        this.summaryContainer.innerHTML = '';

        const sections = [
            {
                title: 'Personal Information',
                fields: [
                    { label: 'First Name', key: 'firstName' },
                    { label: 'Last Name', key: 'lastName' },
                    { label: 'Email', key: 'email' }
                ]
            },
            {
                title: 'Contact Details',
                fields: [
                    { label: 'Phone Number', key: 'phone' },
                    { label: 'Address', key: 'address' },
                    { label: 'City', key: 'city' },
                    { label: 'ZIP Code', key: 'zipCode' }
                ]
            },
            {
                title: 'Preferences',
                fields: [
                    { label: 'Country', key: 'country' },
                    { label: 'Interests', key: 'interests' },
                    { label: 'Newsletter', key: 'newsletter' }
                ]
            }
        ];

        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'summary-section';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'summary-title';
            titleDiv.textContent = section.title;
            sectionDiv.appendChild(titleDiv);

            section.fields.forEach(field => {
                let value = this.formData[field.key] || 'Not provided';

                // Handle interests array
                if (field.key === 'interests' && Array.isArray(value)) {
                    value = value.join(', ');
                } else if (field.key === 'interests' && value === 'Not provided') {
                    value = 'No interests selected';
                }

                // Handle newsletter checkbox
                if (field.key === 'newsletter') {
                    value = value === 'on' ? 'Yes' : 'No';
                }

                const itemDiv = document.createElement('div');
                itemDiv.className = 'summary-item';

                const labelSpan = document.createElement('span');
                labelSpan.className = 'summary-label';
                labelSpan.textContent = field.label;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'summary-value';
                valueSpan.textContent = value;

                itemDiv.appendChild(labelSpan);
                itemDiv.appendChild(valueSpan);
                sectionDiv.appendChild(itemDiv);
            });

            this.summaryContainer.appendChild(sectionDiv);
        });
    }

    // Submit form
    submitForm(e) {
        e.preventDefault();

        // Validate final step (agreement checkbox)
        const agreeCheckbox = document.getElementById('agree');
        const agreeError = document.getElementById('agreeError');

        if (!agreeCheckbox.checked) {
            agreeError.textContent = 'Please agree to the terms and conditions';
            agreeError.classList.add('show');
            return;
        }

        // Save final data
        this.saveFormData();

        // Show success message
        this.form.style.display = 'none';
        this.successMessage.style.display = 'flex';

        // Log the collected data
        console.log('Form Data Submitted:', this.formData);
    }

    // Reset form
    resetForm() {
        localStorage.removeItem('formData');
        this.formData = {};
        this.currentStep = 1;
        this.form.reset();
        this.form.style.display = 'block';
        this.successMessage.style.display = 'none';
        
        // Clear all error states
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));

        this.showStep(1);
    }
}

// Initialize form when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MultiStepForm();
});
