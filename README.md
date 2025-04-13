# BeeSrv

## Server

### Installing Dependencies

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