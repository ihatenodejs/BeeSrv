# BeeSrv

[![License: Unlicense](https://img.shields.io/badge/license-Unlicense-blue.svg)](http://unlicense.org/)

A KernelSU module which simplifies the installation of a keybox.xml file by fetching it from a server.

> [!IMPORTANT]
> **This project is not hosted on GitHub. If you are looking to contribute or open an issue, please see my repo on [LibreCloud Git](https://git.pontusmail.org/aidan/beesrv).**

## Module

This client module has been primarially written for KernelSU. I test the module with the latest version of KernelSU-Next. Community testing and support for other root providers is encouraged!

## Server

To create a server which is capable of serving the files to a client (user of the module), this will require a server. You can set one up below with minimal effort.

### Installing Dependencies

This project prioritizes support for [Bun](https://bun.sh) over NPM. These instructions are written for bun, although they could be adapted.

```bash
bun install
```

To run:

```bash
bun run index.ts
```

### Applying DB Changes

```
bunx drizzle-kit push
```

### Serving Files

A `beebox.xml` file should be placed the `server/serve/` directory. You will have to create this directory.

## Credits

Thank you to all of the people and projects I have come across while building this! Without you, this project wouldn't be a reality.

* [Re-Malwack by ZG089](https://github.com/ZG089/Re-Malwack) - 
  This helped me so much while writing the module

* [KernelSU Documentation](https://kernelsu.org/guide/module.html) - Very helpful resource for building a complete module

* [rootAVD by newbit](https://gitlab.com/newbit/rootAVD) -
  Very useful tool to root an emulator with Magisk, which I used for testing