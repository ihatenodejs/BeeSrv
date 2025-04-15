function show_usage() {
  echo "Usage: $0 [-e <email>] [-s <server>]"
  echo "Options:"
  echo "  -e    Email address"
  echo "  -s    Server URL"
  exit 1
}

function set_email() {
  if [[ "$1" == "" ]]; then
    echo "[ERROR] Email address is required when using -e"
    show_usage
  fi

  if ! grep -q "EMAIL=" /data/adb/beesrv/config.txt; then
    echo "EMAIL=$1" >> /data/adb/beesrv/config.txt
  else
    sed -i "s/EMAIL=.*/EMAIL=$1/" /data/adb/beesrv/config.txt
  fi

  echo "Success"
}

function set_server() {
  if [[ "$1" == "" ]]; then
    echo "[ERROR] Server URL is required when using -s"
    show_usage
  fi

  if ! grep -q "SERVER=" /data/adb/beesrv/config.txt; then
    echo "SERVER=$1" >> /data/adb/beesrv/config.txt
  else
    sed -i "s/SERVER=.*/SERVER=$1/" /data/adb/beesrv/config.txt
  fi

  echo "Success"
}

while getopts "e:s:" opt; do
  case ${opt} in
    e )
      set_email "$OPTARG"
      ;;
    s )
      set_server "$OPTARG"
      ;;
    \? )
      echo "[ERROR] Invalid option -$OPTARG"
      show_usage
      ;;
    : )
      echo "[ERROR] Option -$OPTARG requires an argument"
      show_usage
      ;;
  esac
done