const { Readable, Writable } = require("stream");

function inject(app, options) {
  return new Promise((resolve, reject) => {
    const body = options.body ? Buffer.from(JSON.stringify(options.body)) : null;
    const req = new Readable({
      read() {
        if (body) this.push(body);
        this.push(null);
      }
    });
    req.method = options.method || "GET";
    req.url = options.path;
    req.headers = {};
    for (const [key, value] of Object.entries(options.headers || {})) {
      req.headers[key.toLowerCase()] = value;
    }
    if (body) {
      req.headers["content-type"] = "application/json";
      req.headers["content-length"] = String(body.length);
    }
    req.get = (name) => req.headers[String(name).toLowerCase()];

    const chunks = [];
    const res = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      }
    });
    res.statusCode = 200;
    res.headers = {};
    res.setHeader = (name, value) => {
      res.headers[String(name).toLowerCase()] = value;
    };
    res.getHeader = (name) => res.headers[String(name).toLowerCase()];
    res.removeHeader = (name) => {
      delete res.headers[String(name).toLowerCase()];
    };
    res.writeHead = (statusCode, headers) => {
      res.statusCode = statusCode;
      Object.assign(res.headers, headers || {});
    };
    res.end = (chunk) => {
      if (chunk) chunks.push(Buffer.from(chunk));
      const raw = Buffer.concat(chunks).toString("utf8");
      let parsedBody = raw;
      try {
        parsedBody = raw ? JSON.parse(raw) : null;
      } catch (_error) {
        parsedBody = raw;
      }
      resolve({ status: res.statusCode, headers: res.headers, body: parsedBody });
    };
    res.on("error", reject);

    app.handle(req, res, reject);
  });
}

module.exports = { inject };
