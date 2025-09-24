document.addEventListener('DOMContentLoaded', function() {
    // Generate and display random code
    const codeDisplay = document.getElementById('codeDisplay');
    const verificationForm = document.getElementById('verificationForm');
    const verificationInput = document.getElementById('verificationCode');
    const companyNameInput = document.getElementById('companyName');
    const submitBtn = document.getElementById('submitBtn');
    
    // Generate random code (7 characters: uppercase, lowercase, and numbers)
    function generateRandomCode() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 7; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    
    const verificationValue = generateRandomCode();
    codeDisplay.textContent = verificationValue;
    
    // Form submission handler
    verificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const enteredCode = verificationInput.value.trim();
        const companyName = companyNameInput.value.trim();
        
        // Validate company name
        if (!companyName) {
            showError('Please enter your company name');
            companyNameInput.focus();
            return;
        }
        
        // Validate verification code
        if (!enteredCode) {
            showError('Please enter the verification code');
            verificationInput.focus();
            return;
        }
        
        if (enteredCode !== verificationValue) {
            showError('Verification code is incorrect. Please try again.');
            verificationInput.value = '';
            verificationInput.focus();
            return;
        }
        
        // Show success message
        showSuccess('Verification successful! Redirecting to dashboard...');
        
        // Disable button during redirect
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // If validation passes, redirect to dashboard after a brief delay
        setTimeout(() => {
            window.location.href = '../enter-dash/enterprise-dashboard.html';
        }, 1500);
    });
    
    // Add some input effects for better UX
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        // Add focus effect
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        // Remove focus effect
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
    
    // Function to show error messages
    function showError(message) {
        // Remove any existing messages
        removeMessages();
        
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        // Insert before the form
        verificationForm.parentNode.insertBefore(errorDiv, verificationForm);
        
        // Remove message after 5 seconds
        setTimeout(removeMessages, 5000);
    }
    
    // Function to show success messages
    function showSuccess(message) {
        // Remove any existing messages
        removeMessages();
        
        // Create success message element
        const successDiv = document.createElement('div');
        successDiv.className = 'message success';
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        // Insert before the form
        verificationForm.parentNode.insertBefore(successDiv, verificationForm);
    }
    
    // Function to remove all messages
    function removeMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(message => message.remove());
    }
    
    // Add styles for messages
    const style = document.createElement('style');
    style.textContent = `
        .message {
            padding: 12px 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: fadeIn 0.3s ease;
        }
        
        .message.error {
            background: #ffebee;
            color: #c62828;
            border: 1px solid #ef9a9a;
        }
        
        .message.success {
            background: #e8f5e9;
            color: #2e7d32;
            border: 1px solid #a5d6a7;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
});
