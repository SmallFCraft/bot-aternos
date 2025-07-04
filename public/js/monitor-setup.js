// Monitor Setup JavaScript

// Monitor Setup Guide functions
function showMonitorSetupGuide() {
    document.getElementById('monitorSetupModal').style.display = 'block';
    addLocalLog('📖 Monitor setup guide opened');
}

function closeMonitorSetupGuide() {
    document.getElementById('monitorSetupModal').style.display = 'none';
}

async function testProductionEndpoint() {
    try {
        addLocalLog('🌐 Testing production endpoint...');
        
        const response = await fetch('https://bot-aternos-6ltq.onrender.com/api/health');
        const data = await response.json();
        
        if (response.ok) {
            addLocalLog('✅ Production endpoint is healthy');
            alert(`✅ Production endpoint is healthy!\n\nStatus: ${data.status}\nUptime: ${data.uptime}\nBots: ${data.bots?.total || 0}`);
        } else {
            addLocalLog('❌ Production endpoint returned error', 'error');
            alert('❌ Production endpoint returned an error');
        }
    } catch (error) {
        addLocalLog(`❌ Failed to reach production endpoint: ${error.message}`, 'error');
        alert(`❌ Failed to reach production endpoint:\n${error.message}\n\nThis might be normal if the app is sleeping on Render.`);
    }
}

async function testHealthEndpoint() {
    try {
        addLocalLog('💓 Testing health endpoint...');
        
        const response = await fetch('https://bot-aternos-6ltq.onrender.com/api/health');
        const data = await response.json();
        
        if (response.ok) {
            addLocalLog('✅ Health endpoint working correctly');
            alert(`✅ Health endpoint working correctly!\n\n${JSON.stringify(data, null, 2)}`);
        } else {
            addLocalLog('❌ Health endpoint error', 'error');
            alert('❌ Health endpoint returned an error');
        }
    } catch (error) {
        addLocalLog(`❌ Health endpoint test failed: ${error.message}`, 'error');
        alert(`❌ Health endpoint test failed:\n${error.message}`);
    }
}
