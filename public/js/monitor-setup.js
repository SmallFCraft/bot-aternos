// Monitor Setup JavaScript

// Monitor Setup Guide functions
function showMonitorSetupGuide() {
  document.getElementById("monitorSetupModal").style.display = "block";
  addLocalLog("📖 Monitor setup guide opened");
}

function closeMonitorSetupGuide() {
  document.getElementById("monitorSetupModal").style.display = "none";
}

async function testProductionEndpoint() {
  try {
    addLocalLog("🌐 Testing production endpoint...");

    const response = await fetch(
      "https://bot-aternos-6ltq.onrender.com/api/health"
    );
    const data = await response.json();

    if (response.ok) {
      addLocalLog("✅ Production endpoint is healthy");
      Swal.fire({
        icon: "success",
        title: "Production Endpoint Healthy",
        html: `<strong>Status:</strong> ${
          data.status
        }<br><strong>Uptime:</strong> ${
          data.uptime
        }<br><strong>Bots:</strong> ${data.bots?.total || 0}`,
        confirmButtonColor: "#4CAF50",
      });
    } else {
      addLocalLog("❌ Production endpoint returned error", "error");
      Swal.fire({
        icon: "error",
        title: "Production Endpoint Error",
        text: "Production endpoint returned an error",
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(
      `❌ Failed to reach production endpoint: ${error.message}`,
      "error"
    );
    Swal.fire({
      icon: "warning",
      title: "Failed to Reach Production Endpoint",
      text: `${error.message}\n\nThis might be normal if the app is sleeping on Render.`,
      confirmButtonColor: "#4CAF50",
    });
  }
}

async function testHealthEndpoint() {
  try {
    addLocalLog("💓 Testing health endpoint...");

    const response = await fetch(
      "https://bot-aternos-6ltq.onrender.com/api/health"
    );
    const data = await response.json();

    if (response.ok) {
      addLocalLog("✅ Health endpoint working correctly");
      Swal.fire({
        icon: "success",
        title: "Health Endpoint Working",
        html: `<pre style="text-align: left; font-size: 12px;">${JSON.stringify(
          data,
          null,
          2
        )}</pre>`,
        confirmButtonColor: "#4CAF50",
        width: "600px",
      });
    } else {
      addLocalLog("❌ Health endpoint error", "error");
      Swal.fire({
        icon: "error",
        title: "Health Endpoint Error",
        text: "Health endpoint returned an error",
        confirmButtonColor: "#4CAF50",
      });
    }
  } catch (error) {
    addLocalLog(`❌ Health endpoint test failed: ${error.message}`, "error");
    Swal.fire({
      icon: "error",
      title: "Health Endpoint Test Failed",
      text: error.message,
      confirmButtonColor: "#4CAF50",
    });
  }
}
