ui_print ""
ui_print "=== BEESRV ==="
ui_print "Version: $(grep_prop version $MODPATH/module.prop) ($(grep_prop versionCode $MODPATH/module.prop))"
ui_print "Made with ❤️ by ihatenodejs"
ui_print "==========================="
ui_print ""
sleep 0.4

# Environment checks
if ! $BOOTMODE; then
  ui_print "[!] Do not install this module from recovery"
  abort
fi

if ! $KSU; then
  ui_print "[i] Support is available only for KernelSU/KSU-Next"
  abort
fi

# Internet check - Pings Quad9 DNS
ui_print "[i] Checking internet connection"
ping -c 1 -W 5 9.9.9.9 > /dev/null 2>&1
if [ $? -ne 0 ]; then
  ui_print "[!] No internet connection"
  ui_print "    Internet is required to fetch beebox files!"
  ui_print ""
else
  ui_print "[✔] Internet is connected"
  ui_print ""
fi

# Create config
ui_print "[i] Creating config..."
mkdir -p /data/adb/beesrv

# Check if config file exists, and check if required variables are set
config_modified=false
if [ ! -f "/data/adb/beesrv/config.txt" ]; then
  echo "SERVER=" >> /data/adb/beesrv/config.txt
  echo "EMAIL=" >> /data/adb/beesrv/config.txt
  echo "DEBUG=false" >> /data/adb/beesrv/config.txt
  ui_print "[✔] Config created"
  ui_print ""
else
  ui_print "[i] Config file found, checking..."

  # Check SERVER var
  if ! grep -q "SERVER=" /data/adb/beesrv/config.txt; then
    ui_print "[i] SERVER variable not found, adding..."
    echo "SERVER=" >> /data/adb/beesrv/config.txt
    config_modified=true
  fi

  # Check EMAIL var
  if ! grep -q "EMAIL=" /data/adb/beesrv/config.txt; then
    ui_print "[i] EMAIL variable not found, adding..."
    echo "EMAIL=" >> /data/adb/beesrv/config.txt
    config_modified=true
  fi

  # Check DEBUG var
  if ! grep -q "DEBUG=" /data/adb/beesrv/config.txt; then
    ui_print "[i] DEBUG variable not found, adding..."
    echo "DEBUG=false" >> /data/adb/beesrv/config.txt
    config_modified=true
  fi

  if [ "$config_modified" = true ]; then
    ui_print "[✔] Config modified successfully"
    ui_print ""
  else
    ui_print "[✔] Config already valid, skipping update..."
    ui_print ""
  fi
fi

# Set permissions for scripts
ui_print "[i] Setting permissions for scripts..."
chmod 755 $MODPATH/util/*
sleep 0.5
ui_print "[✔] Permissions set"
ui_print ""

ui_print "== INSTALLATION COMPLETE! =="
ui_print ""
ui_print "Join our Telegram channel: t.me/pontushub"
am start -a android.intent.action.VIEW -d "https://t.me/pontushub"
sleep 0.4