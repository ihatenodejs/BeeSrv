version=$(grep "version=" module/module.prop | cut -d "=" -f 2)

echo "BeeSrv ZIP Builder"
echo "=================="
echo ""

# Check if zip is installed
if ! command -v zip &> /dev/null; then
    echo "[!] zip is not installed"
    exit 1
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "[!] bun is not installed"
    exit 1
fi

# Check if filename to be created already exists
if [ -f "BeeSrv-$version.zip" ]; then
    echo "[i] BeeSrv-$version.zip already exists, would you like to overwrite it? (y/n)"
    read overwrite
    if [ "$overwrite" != "y" ]; then
        echo "[!] Aborting..."
        exit 1
    else
        rm -rf BeeSrv-$version.zip
        echo "[✔] Overwriting BeeSrv-$version.zip..."
    fi
fi

# Check for leftover tmp dir
if [ -d "tmp" ]; then
    echo "[i] tmp directory already exists, would you like to overwrite it? (y/n)"
    read overwrite
    if [ "$overwrite" != "y" ]; then
        echo "[!] Aborting..."
        exit 1
    else
        rm -rf tmp
    fi
fi

# Copy module to tmp
cp -r module tmp
echo "[✔] Created working directory"

# Clean any unnecessary files
rm -rf tmp/module/webroot/dist
rm -rf tmp/module/webroot/.gitignore
rm -rf tmp/module/webroot/package-lock.json
echo "[✔] Completed cleanup"

# Build webroot
echo "[i] Building webroot..."
cd tmp/webroot
echo "[i] Installing dependencies..."
bun install
echo ""
echo "[✔] Installed dependencies"
echo ""
echo "[i] Building with parcel..."
echo ""
bunx parcel build src/index.html
echo ""
echo "[✔] Built webroot"

# Clean up for zip
rm -rf .parcel-cache
rm -rf src
rm -rf node_modules
rm bun.lock*
rm package*
rm .gitignore
echo "[✔] Completed cleanup"

# Move built files to webroot
cd ..
cp -r webroot/dist/* webroot
echo "[✔] Moved built files to webroot"

# Remove build dir
rm -rf webroot/dist
echo "[✔] Completed cleanup"

# Create zip
echo "[i] Creating zip..."
zip -r ../BeeSrv-$version.zip *
cd ..
echo "[✔] Created zip"

# Clean up
rm -rf tmp
echo "[✔] Completed cleanup"

echo ""
echo "BeeSrv-$version.zip created successfully!"
