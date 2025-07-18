// Dashboard and utility functions

function updateDashboardInfo() {
    if (window.StopFakeLeads && window.StopFakeLeads.config.apiKey) {
        const apiKey = window.StopFakeLeads.config.apiKey;
        const apiKeyElement = document.getElementById('apiKeyText');
        const scriptElement = document.getElementById('scriptText');
        
        if (apiKeyElement) {
            apiKeyElement.textContent = apiKey;
        }
        
        if (scriptElement) {
            const scriptTag = `<script src="${window.location.origin}/spam-protection.js" data-api-key="${apiKey}"></script>`;
            scriptElement.textContent = scriptTag;
        }
    }
}

// Copy functions for dashboard
function copyApiKey() {
    const apiKey = document.getElementById('apiKeyText').textContent;
    navigator.clipboard.writeText(apiKey).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#28a745';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#007bff';
        }, 2000);
    });
}

function copyScript() {
    const script = document.getElementById('scriptText').textContent;
    navigator.clipboard.writeText(script).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#28a745';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#007bff';
        }, 2000);
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Update dashboard info after StopFakeLeads is initialized
    setTimeout(updateDashboardInfo, 1000);
    
    // Retry every 2 seconds until API key is available
    const updateInterval = setInterval(() => {
        if (window.StopFakeLeads && window.StopFakeLeads.config.apiKey) {
            updateDashboardInfo();
            clearInterval(updateInterval);
        }
    }, 2000);
});