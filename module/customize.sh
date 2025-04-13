ui_print ""
ui_print "=== BEESRV ==="
ui_print "Version: $(grep_prop version $MODPATH/module.prop)"
ui_print "Made with ❤️ by ihatenodejs"
ui_print "================================"
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
touch /data/adb/beesrv/config.txt
chmod 664 /data/adb/beesrv/config.txt

echo "SERVER=" >> /data/adb/beesrv/config.txt

ui_print "[✔] Config created"

ui_print ""
ui_print "== INSTALLATION COMPLETE! =="
ui_print "Join our Telegram channel: t.me/pontushub"
sleep 0.4