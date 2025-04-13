import { exec } from "kernelsu"

const modules_dir = "/data/adb/modules/BeeSrv"
const persist_dir = "/data/adb/beesrv"

function showError(message) {
  const errorBox = document.getElementById("errorBox")
  const errorMessage = document.getElementById("errorMessage")
  errorMessage.textContent = message
  errorBox.classList.remove("hidden")
}

function hideError() {
  const errorBox = document.getElementById("errorBox")
  errorBox.classList.add("hidden")
}

async function getVersion() {
  try {
    const { errno, stdout, stderr } = await exec(`cat ${modules_dir}/module.prop`)
    if (errno !== 0) {
      showError("Failed to read module version")
      return "Unknown"
    }
    const version = stdout.split("\n").find(line => line.startsWith("version="))
    if (!version) {
      showError("Module version not found")
      return "Unknown"
    }
    return version.split("=")[1]
  } catch (error) {
    showError("Error reading module version")
    return "Unknown"
  }
}

async function getServer() {
  try {
    const { errno, stdout, stderr } = await exec(`cat ${persist_dir}/config.txt`)
    if (errno !== 0) {
      showError("Failed to read server configuration")
      return "Unknown"
    }
    const server = stdout.split("\n").find(line => line.startsWith("SERVER="))
    if (!server) {
      showError("Server configuration not found")
      return "Unknown"
    }
    return server.split("=")[1]
  } catch (error) {
    showError("Error reading server configuration")
    return "Unknown"
  }
}

async function checkConnection() {
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    return response.ok;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Connection check timed out. Please try again.');
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to reach the internet. Please check your network connection.');
    } else {
      throw new Error('Connection check failed. Please try again later.');
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const versionText = document.getElementById("versionText")
  const serverText = document.getElementById("serverText")
  const versionLoader = document.getElementById("versionLoader")
  const serverLoader = document.getElementById("serverLoader")

  try {
    const version = await getVersion()
    const server = await getServer()
    
    versionLoader.classList.add("hidden")
    serverLoader.classList.add("hidden")
    versionText.textContent = version
    serverText.textContent = server
  } catch (error) {
    versionLoader.classList.add("hidden")
    serverLoader.classList.add("hidden")
    versionText.textContent = "Error"
    serverText.textContent = "Error"
  }

  const checkConnectionBtn = document.getElementById("checkConnection")
  const testBtn = document.getElementById("testBtn")
  const testBtnLoading = document.getElementById("testBtnLoading")
  const connectionStatus = document.getElementById("connectionStatus")
  const connectionError = document.getElementById("connectionError")

  function resetButtonState() {
    testBtnLoading.classList.add("hidden")
    testBtn.classList.remove("hidden")
    checkConnectionBtn.disabled = false
  }

  function setLoadingState() {
    testBtn.classList.add("hidden")
    testBtnLoading.classList.remove("hidden")
    connectionStatus.classList.add("hidden")
    connectionError.classList.add("hidden")
    checkConnectionBtn.disabled = true
    hideError()
  }

  function showSuccessState() {
    connectionStatus.classList.remove("hidden")
    connectionError.classList.add("hidden")
    // Hide the button after successful test
    checkConnectionBtn.classList.add("hidden")
  }

  function showErrorState(message) {
    connectionStatus.classList.add("hidden")
    connectionError.classList.remove("hidden")
    showError(message)
    checkConnectionBtn.classList.add("hidden")
  }

  checkConnectionBtn.addEventListener("click", async () => {
    setLoadingState()
    try {
      const isConnected = await checkConnection()
      resetButtonState()
      if (isConnected) {
        showSuccessState()
      } else {
        showErrorState("No internet connection detected")
      }
    } catch (error) {
      resetButtonState()
      showErrorState(error.message)
    }
  })
})
