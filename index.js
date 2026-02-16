import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import next from "next";
import { createBareServer } from "@nebula-services/bare-server-node";
import { uvPath as ultravioletPath } from "@titaniumnetwork-dev/ultraviolet";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import basicAuth from "express-basic-auth";
import mime from "mime";
import fetch from "node-fetch";
import config from "./config.js";

const __dirname = process.cwd();
const PORT = Number(process.env.PORT || 8080);
const dev = process.env.NODE_ENV !== "production";

const nextApp = next({ dev, port: PORT });
const nextHandler = nextApp.getRequestHandler();

const server = http.createServer();
const app = express();
const bareServer = createBareServer("/baremux/");
const cache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

console.log(chalk.yellow("Starting server..."));

if (config.challenge !== false) {
  console.log(chalk.green("Password protection is enabled."));
  Object.entries(config.users).forEach(([username, password]) => {
    console.log(chalk.blue(`Username: ${username}, Password: ${password}`));
  });
  app.use(basicAuth({ users: config.users, challenge: true }));
}

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/e/*", async (req, res, nextMiddleware) => {
  try {
    if (cache.has(req.path)) {
      const { data, contentType, timestamp } = cache.get(req.path);
      if (Date.now() - timestamp <= CACHE_TTL) {
        res.writeHead(200, { "Content-Type": contentType });
        return res.end(data);
      }
      cache.delete(req.path);
    }

    const baseUrls = {
      "/e/1/": "https://raw.githubusercontent.com/qrs/x/fixy/",
      "/e/2/": "https://raw.githubusercontent.com/3v1/V5-Assets/main/",
      "/e/3/": "https://raw.githubusercontent.com/3v1/V5-Retro/master/",
    };

    let reqTarget;
    for (const [prefix, baseUrl] of Object.entries(baseUrls)) {
      if (req.path.startsWith(prefix)) {
        reqTarget = baseUrl + req.path.slice(prefix.length);
        break;
      }
    }

    if (!reqTarget) return nextMiddleware();

    const asset = await fetch(reqTarget);
    if (!asset.ok) return nextMiddleware();

    const data = Buffer.from(await asset.arrayBuffer());
    const ext = path.extname(reqTarget);
    const contentType = [".unityweb"].includes(ext)
      ? "application/octet-stream"
      : mime.getType(ext) || "application/octet-stream";

    cache.set(req.path, { data, contentType, timestamp: Date.now() });
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).send("Error fetching the asset");
  }
});

app.use(express.static(path.join(__dirname, "static"), { index: false }));
app.use("/uv", express.static(ultravioletPath));
app.use("/baremux", express.static(baremuxPath));

app.all("*", (req, res) => nextHandler(req, res));

server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.on("listening", () => {
  console.log(chalk.green(`Server is running on http://localhost:${PORT}`));
});

nextApp
  .prepare()
  .then(() => {
    server.listen({ port: PORT });
  })
  .catch(error => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
