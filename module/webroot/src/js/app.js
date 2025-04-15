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

async function getDebugMode() {
  const { errno, stdout } = await exec(`cat ${persist_dir}/config.txt`)
  if (errno !== 0) {
    showError("Failed to read debug mode")
    return false
  }
  const debug = stdout.split("\n").find(line => line.startsWith("DEBUG="))
  if (!debug) {
    return false
  }
  return debug.split("=")[1] === "true"
}

async function getEmail() {
  try {
    const { errno, stdout, stderr } = await exec(`cat ${persist_dir}/config.txt`)
    if (errno !== 0) {
      if (await getDebugMode() !== true) {
        showError("Failed to read email configuration")
      } else {
        showError(stderr)
      }
      return "Unknown"
    }
    const email = stdout.split("\n").find(line => line.startsWith("EMAIL="))
    if (!email) {
      return "Not set"
    }
    return email.split("=")[1]
  } catch (error) {
    showError("Error reading email configuration")
    return "Unknown"
  }
}


async function getVersion() {
  try {
    const { errno, stdout, stderr } = await exec(`cat ${modules_dir}/module.prop`)
    if (errno !== 0) {
      if (await getDebugMode() !== true) {
        showError("Failed to read module version")
      } else {
        showError(stderr)
      }
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
      if (await getDebugMode() !== true) {
        showError("Failed to read server configuration")
      } else {
        showError(stderr)
      }
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

async function setEmail(email) {
  try {
    const { errno, stderr } = await exec(`${modules_dir}/util/config.sh -e "${email.replace(/['"]/g, '')}"`)
    if (errno !== 0) {
      if (await getDebugMode() !== true) {
        showError("Failed to update email configuration")
      } else {
        showError(stderr)
      }
      return false
    }
    return true
  } catch (error) {
    if (await getDebugMode() !== true) {
      showError("Error updating email configuration")
    } else {
      showError(error)
    }
    return false
  }
}

async function setServer(server) {
  try {
    const { errno, stderr } = await exec(`${modules_dir}/util/config.sh -s "${server.replace(/['"]/g, '')}"`)
    if (errno !== 0) {
      if (await getDebugMode() !== true) {
        showError("Failed to update server configuration")
      } else {
        showError(stderr)
      }
      return false
    }
    return true
  } catch (error) {
    if (await getDebugMode() !== true) {
      showError("Error updating server configuration")
    } else {
      showError(error)
    }
    return false
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const versionText = document.getElementById("versionText")
  const serverText = document.getElementById("serverText")
  const emailText = document.getElementById("emailText")
  const debugText = document.getElementById("debugText")
  const versionLoader = document.getElementById("versionLoader")
  const serverLoader = document.getElementById("serverLoader")
  const emailLoader = document.getElementById("emailLoader")
  const debugLoader = document.getElementById("debugLoader")
  const emailInput = document.getElementById("emailInput")
  const serverInput = document.getElementById("serverInput")
  const editEmailBtn = document.getElementById("editEmailBtn")
  const editServerBtn = document.getElementById("editServerBtn")
  const saveEmailBtn = document.getElementById("saveEmailBtn")
  const saveServerBtn = document.getElementById("saveServerBtn")
  const cancelEmailBtn = document.getElementById("cancelEmailBtn")
  const cancelServerBtn = document.getElementById("cancelServerBtn")

  // Server editing
  function startServerEditing() {
    serverText.classList.add("hidden")
    serverInput.classList.remove("hidden")
    editServerBtn.classList.add("hidden")
    saveServerBtn.classList.remove("hidden")
    cancelServerBtn.classList.remove("hidden")
    serverInput.value = serverText.textContent
    serverInput.focus()
  }

  function stopServerEditing() {
    serverText.classList.remove("hidden")
    serverInput.classList.add("hidden")
    editServerBtn.classList.remove("hidden")
    saveServerBtn.classList.add("hidden")
    cancelServerBtn.classList.add("hidden")
  }

  editServerBtn.addEventListener("click", startServerEditing)
  
  cancelServerBtn.addEventListener("click", stopServerEditing)

  saveServerBtn.addEventListener("click", async () => {
    const newServer = serverInput.value.trim()
    if (!newServer) {
      showError("Server URL cannot be empty")
      return
    }

    serverLoader.classList.remove("hidden")
    serverText.textContent = "Saving..."
    stopServerEditing()

    const success = await setServer(newServer)
    if (success) {
      serverText.textContent = newServer
    } else {
      serverText.textContent = "Error"
    }
    serverLoader.classList.add("hidden")
  })

  // Handle enter button for server input
  serverInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      saveServerBtn.click()
    } else if (event.key === "Escape") {
      cancelServerBtn.click()
    }
  })

  // Email editing
  function startEditing() {
    emailText.classList.add("hidden")
    emailInput.classList.remove("hidden")
    editEmailBtn.classList.add("hidden")
    saveEmailBtn.classList.remove("hidden")
    cancelEmailBtn.classList.remove("hidden")
    emailInput.value = emailText.textContent
    emailInput.focus()
  }

  function stopEditing() {
    emailText.classList.remove("hidden")
    emailInput.classList.add("hidden")
    editEmailBtn.classList.remove("hidden")
    saveEmailBtn.classList.add("hidden")
    cancelEmailBtn.classList.add("hidden")
  }

  editEmailBtn.addEventListener("click", startEditing)
  
  cancelEmailBtn.addEventListener("click", stopEditing)

  saveEmailBtn.addEventListener("click", async () => {
    const newEmail = emailInput.value.trim()
    if (!newEmail) {
      showError("Email cannot be empty")
      return
    }

    emailLoader.classList.remove("hidden")
    emailText.textContent = "Saving..."
    stopEditing()

    const success = await setEmail(newEmail)
    if (success) {
      emailText.textContent = newEmail
    } else {
      emailText.textContent = "Error"
    }
    emailLoader.classList.add("hidden")
  })

  // Handle enter button for email input
  emailInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      saveEmailBtn.click()
    } else if (event.key === "Escape") {
      cancelEmailBtn.click()
    }
  })

  try {
    const version = await getVersion()
    const server = await getServer()
    const email = await getEmail()
    const debug = await getDebugMode()
    versionLoader.classList.add("hidden")
    serverLoader.classList.add("hidden")
    emailLoader.classList.add("hidden")
    debugLoader.classList.add("hidden")
    versionText.textContent = version
    serverText.textContent = server
    emailText.textContent = email
    debugText.textContent = debug ? "Enabled" : "Disabled"
  } catch (error) {
    versionLoader.classList.add("hidden")
    serverLoader.classList.add("hidden")
    emailLoader.classList.add("hidden")
    debugLoader.classList.add("hidden")
    versionText.textContent = "Error"
    serverText.textContent = "Error"
    emailText.textContent = "Error"
    debugText.textContent = "Error"
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
